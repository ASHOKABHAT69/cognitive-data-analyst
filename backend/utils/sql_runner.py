try:
    import duckdb
except ImportError:
    duckdb = None

import pandas as pd

current_df = None
current_columns = []
current_dtypes = {}


def load_csv_to_db(file_path: str):
    global current_df, current_columns, current_dtypes

    current_df = pd.read_csv(file_path)
    current_df = current_df.loc[:, ~current_df.columns.str.contains(r"^Unnamed")]

    current_columns = current_df.columns.tolist()
    current_dtypes = {col: str(dtype) for col, dtype in current_df.dtypes.items()}


def run_query(sql: str):
    global current_df

    if current_df is None:
        return {
            "success": False,
            "error": "No dataset loaded",
            "rows": []
        }

    try:
        result = duckdb.query_df(current_df, "dataset", sql).to_df()
        return {
            "success": True,
            "error": None,
            "rows": result.fillna("").to_dict(orient="records")
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "rows": []
        }


def get_schema_info():
    global current_df, current_columns, current_dtypes
    return current_df, current_columns, current_dtypes