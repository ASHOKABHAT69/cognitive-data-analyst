import os
from typing import Any, List, Literal, Optional, Union

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None  # type: ignore[assignment]
    types = None  # type: ignore[assignment]

from pydantic import BaseModel, Field

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None


class Aggregation(BaseModel):
    function: Literal["count", "sum", "avg", "min", "max", "count_distinct"]
    column: str
    alias: str


class FilterCondition(BaseModel):
    column: str
    operator: Literal["=", "!=", ">", "<", ">=", "<=", "contains", "starts_with", "ends_with"]
    value: Union[str, int, float, bool]


class OrderByItem(BaseModel):
    column: str
    direction: Literal["asc", "desc"]


class QueryPlan(BaseModel):
    intent: Literal["select", "aggregate", "groupby_aggregate", "filter_only", "sort_limit"]
    select_columns: List[str] = Field(default_factory=list)
    aggregations: List[Aggregation] = Field(default_factory=list)
    filters: List[FilterCondition] = Field(default_factory=list)
    group_by: List[str] = Field(default_factory=list)
    order_by: List[OrderByItem] = Field(default_factory=list)
    limit: Optional[int] = None


def build_planner_prompt(schema_payload: dict, question: str) -> str:
    return f"""
You are a CSV query planner.

Convert the user's question into a structured query plan.

Rules:
- Use only columns that exist in the schema.
- Do not invent column names.
- Prefer exact or semantically closest matches.

- If the question asks for "count", "number of", or "total", use aggregations.

- If the question contains "by <column>" OR refers to categories like "countries", "skills", "types",
  you MUST use GROUP BY on that column.

- If the question asks for "most", "top", "highest", "largest":
  → Use ORDER BY with aggregation (like COUNT or AVG)
  → Use DESC order
  → Use LIMIT if a number is specified

- If aggregation is used with a column (like count of players per country),
  you MUST include GROUP BY that column.

- If selecting a column and also aggregating, GROUP BY is REQUIRED.

- Always ensure SQL is valid.

- Return only structured JSON.

Schema:
{schema_payload}

User question:
{question}
""".strip()


def generate_query_plan(schema_payload: dict, question: str) -> dict:
    if client is None:
        raise Exception("Gemini AI not configured. Missing GEMINI_API_KEY.")

    prompt = build_planner_prompt(schema_payload, question)

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=QueryPlan,
            temperature=0,
        ),
    )

    if not response.parsed:
        raise Exception("Gemini returned no parsed planner output.")

    return response.parsed.model_dump()


def build_repair_prompt(schema_payload: dict, question: str, previous_plan: dict, bad_sql: str, error_message: str) -> str:
    return f"""
You are a CSV query repair specialist.

The initial query plan failed. Please analyze the failure and generate a corrected query plan.

Rules:
- Use only columns that exist in the schema.
- Do not invent column names.
- Prefer exact or semantically closest matches.

- If the question asks for "count", "number of", or "total", use aggregations.

- If the question contains "by <column>" OR refers to categories like "countries", "skills", "types",
  you MUST use GROUP BY on that column.

- If the question asks for "most", "top", "highest", "largest":
  → Use ORDER BY with aggregation (like COUNT or AVG)
  → Use DESC order
  → Use LIMIT if a number is specified

- If aggregation is used with a column (like count of players per country),
  you MUST include GROUP BY that column.

- If selecting a column and also aggregating, GROUP BY is REQUIRED.

- Always ensure SQL is valid.

- Return only structured JSON.

Schema:
{schema_payload}

User question:
{question}

Previous plan (which failed):
{previous_plan}

Generated SQL (which failed):
{bad_sql}

Error from SQL execution:
{error_message}

Please generate a corrected query plan that addresses the error above.
""".strip()


def repair_query_plan(schema_payload: dict, question: str, previous_plan: dict, bad_sql: str, error_message: str) -> dict:
    """Repair a failed query plan by analyzing the error and generating a corrected plan."""
    if client is None:
        raise Exception("Gemini AI not configured. Missing GEMINI_API_KEY.")

    prompt = build_repair_prompt(schema_payload, question, previous_plan, bad_sql, error_message)

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=QueryPlan,
            temperature=0,
        ),
    )

    if not response.parsed:
        raise Exception("Gemini returned no parsed repair output.")

    return response.parsed.model_dump()