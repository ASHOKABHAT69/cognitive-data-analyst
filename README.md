# Cognitive Data Analyst

Cognitive Data Analyst is a full-stack AI data analysis application that lets users upload CSV files, ask questions in natural language, view SQL-backed results, inspect charts, and export the final analysis as a PDF report.

The project combines a FastAPI backend, DuckDB query execution, Gemini-powered query planning, and a React frontend for an interactive data exploration workflow.

## Sample Output

### Application Workflow

![Upload dataset and ask question](images/upload-ask-top%20heading.png)

### Dataset Preview

![Dataset preview](images/Dataset-priveiw.png)

### AI Query Output

![AI query output](images/AI-Query-Output.png)

### Result Table

![Result table](images/Result-Table.png)

### Chart View

![Chart view](images/Chart-view.png)

### Exported PDF Report

Download or preview the generated report:

[Open sample PDF report](Exported-Report/player-query-report.pdf)

## Key Features

- Upload CSV datasets and preview rows before analysis.
- Ask natural language questions about uploaded data.
- Use voice input in supported browsers such as Chrome and Edge.
- Generate query plans with Gemini and convert them into SQL.
- Execute analysis queries with DuckDB.
- Automatically retry failed generated queries with a repair step.
- Display results in both table and chart views.
- Export dataset summary, question, generated SQL, chart view, and result table as a PDF report.

## Tech Stack

### Backend

- FastAPI
- Uvicorn
- Pandas
- DuckDB
- Google GenAI SDK
- Pydantic

### Frontend

- React
- Axios
- Recharts
- jsPDF
- jsPDF AutoTable

## Project Structure

```text
cognitive-data-analyst/
|-- backend/
|   |-- app.py
|   |-- requirements.txt
|   |-- .env.example
|   `-- utils/
|       |-- csv_handler.py
|       |-- fallback_rules.py
|       |-- prompt_builder.py
|       |-- query_planner.py
|       |-- schema_helper.py
|       |-- sql_builder.py
|       `-- sql_runner.py
|-- frontend/
|   |-- package.json
|   |-- public/
|   `-- src/
|       |-- App.js
|       |-- App.css
|       |-- index.js
|       `-- components/
|           |-- AskBox.jsx
|           |-- DataPreview.jsx
|           |-- FileUpload.jsx
|           |-- PdfReportButton.jsx
|           |-- ResultChart.jsx
|           `-- ResultTable.jsx
|-- images/
|   |-- upload-ask-top heading.png
|   |-- Dataset-priveiw.png
|   |-- AI-Query-Output.png
|   |-- Result-Table.png
|   `-- Chart-view.png
|-- Exported-Report/
|   `-- player-query-report.pdf
|-- Player.csv
|-- housing.csv
|-- .gitignore
`-- README.md
```

## Getting Started

### Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- npm
- Gemini API key

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Add your Gemini API key in `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Run the backend:

```bash
python app.py
```

The API runs at:

```text
http://127.0.0.1:5000
```

### Frontend Setup

Open a second terminal:

```bash
cd frontend
npm install
npm start
```

The frontend runs at:

```text
http://localhost:3000
```

## Usage

1. Start the backend and frontend servers.
2. Open `http://localhost:3000`.
3. Upload a CSV dataset.
4. Review the dataset preview.
5. Ask a question using text or voice input.
6. View the generated SQL-backed result table.
7. Inspect the chart view when the result supports visualization.
8. Click **Download PDF Report** to export the analysis.

## API Overview

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | Confirms the backend is running. |
| `GET` | `/health` | Returns backend health status. |
| `POST` | `/upload-csv` | Uploads and previews a CSV file. |
| `POST` | `/ask-question` | Accepts a natural language question and returns SQL-backed analysis results. |

## PDF Report Export

The PDF export is generated in the frontend using `jsPDF` and `jspdf-autotable`. A report includes:

- Dataset filename, row count, column count, and generation time.
- User question.
- Execution mode.
- Generated SQL.
- Chart section for compatible two-column numeric results.
- Result table.
- Page footer with report metadata.

## Security Notes

- Real API keys must stay in `backend/.env`.
- `.env` and `.env.*` files are ignored by Git.
- `backend/.env.example` is safe to commit because it contains only placeholder values.

## Development

### Backend

```bash
cd backend
python app.py
```

### Frontend

```bash
cd frontend
npm start
```

### Production Build

```bash
cd frontend
npm run build
```

## Troubleshooting

- If the frontend cannot reach the backend, confirm the backend is running on `http://127.0.0.1:5000`.
- If queries fail, confirm `GEMINI_API_KEY` is set in `backend/.env`.
- If CSV upload fails, verify the file has a `.csv` extension and valid tabular content.
- If voice input is unavailable, use Chrome or Edge and allow microphone access.

## Last Updated

April 2026
