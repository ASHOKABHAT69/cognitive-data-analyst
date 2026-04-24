from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from utils.csv_handler import save_uploaded_file, read_csv_preview
from utils.sql_runner import run_query, get_schema_info
from utils.schema_helper import build_schema_payload
from utils.query_planner import generate_query_plan ,  repair_query_plan
from utils.sql_builder import build_sql_from_plan
from utils.fallback_rules import try_simple_rule

app = FastAPI(title="Cognitive Data Analyst API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, examples=["Show average sales by city"])


@app.get("/")
def root():
    return {"message": "Backend is running successfully"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/upload-csv")
def upload_csv(file: UploadFile = File(...)):
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided.")

        if not file.filename.lower().endswith(".csv"):
            raise HTTPException(status_code=400, detail="Only CSV files are allowed.")

        file_path = save_uploaded_file(file)
        result = read_csv_preview(file_path)

        return {
            "message": "CSV uploaded successfully",
            **result
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process CSV: {str(e)}")


@app.post("/ask-question")
def ask_question(payload: AskRequest):
    try:
        question = payload.question.strip()

        current_df, columns, dtypes = get_schema_info()
        if current_df is None or not columns:
            return {"error": "No dataset loaded. Please upload a CSV first."}

        schema_payload = build_schema_payload(current_df)

        # First attempt
        plan = generate_query_plan(schema_payload, question)
        sql = build_sql_from_plan(plan)
        query_output = run_query(sql)

        # Success on first try
        if query_output["success"]:
            return {
                "mode": "planner",
                "question": question,
                "plan": plan,
                "sql": sql,
                "result": query_output["rows"],
                "auto_corrected": False,
            }

        # Retry once with repair
        repaired_plan = repair_query_plan(
            schema_payload=schema_payload,
            question=question,
            previous_plan=plan,
            bad_sql=sql,
            error_message=query_output["error"],
        )
        repaired_sql = build_sql_from_plan(repaired_plan)
        repaired_output = run_query(repaired_sql)

        if repaired_output["success"]:
            return {
                "mode": "planner_repaired",
                "question": question,
                "plan": repaired_plan,
                "sql": repaired_sql,
                "result": repaired_output["rows"],
                "auto_corrected": True,
                "previous_sql": sql,
                "repair_reason": query_output["error"],
            }

        return {
            "error": f"Planner failed after retry. First error: {query_output['error']} | Retry error: {repaired_output['error']}",
            "mode": "planner_failed",
            "question": question,
            "plan": repaired_plan,
            "sql": repaired_sql,
            "available_columns": columns,
            "numeric_columns": [
                col for col, dtype in dtypes.items()
                if any(x in dtype.lower() for x in ['int', 'float', 'double'])
            ],
        }

    except Exception as e:
        return {
            "error": f"Planner failed: {str(e)}",
            "mode": "planner_failed",
        }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="127.0.0.1", port=5000, reload=True)
