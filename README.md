# 🛍️ E-Commerce Return Rate Minimizer & Profitability Optimization

A full-stack web application (**FastAPI backend + React frontend**) that analyses
e-commerce order data to show return rates, profit/loss, and a live product
search report — with colourful, animated 3D charts.

```
ecommerce-app/
├── backend/           FastAPI REST API (Python)
│   ├── main.py
│   └── requirements.txt
├── frontend/          React + Vite + Plotly.js
│   └── src/
│       ├── App.jsx
│       ├── api.js
│       └── components/
│           ├── SearchBar.jsx
│           ├── Dashboard.jsx
│           └── ProductReport.jsx
└── README.md
```

## Architecture

```
┌─────────────┐        HTTP/JSON (REST API)        ┌──────────────┐
│   React     │  ───────────────────────────────►  │   FastAPI    │
│  Frontend   │  ◄───────────────────────────────  │   Backend    │
│ (Plotly.js) │                                     │ (pandas +    │
└─────────────┘                                     │  scikit-learn)│
                                                      └──────────────┘
```

- **Backend (FastAPI)** — generates the order-level dataset, trains a
  Random Forest return-risk model at startup, and exposes REST endpoints.
- **Frontend (React)** — calls the API, renders colourful dashboard charts
  and a live product-search report using Plotly.js.
- They are two **separate processes** that talk over HTTP — this is a real
  frontend/backend split (unlike the earlier Jupyter Notebook version, which
  had everything in one process).

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/summary` | Overall stats + category-wise return rate/profit |
| GET | `/api/scatter?sample_size=1200` | Sampled points for the 3D overview chart |
| GET | `/api/products?q=nike` | Product name search/autocomplete |
| GET | `/api/product/{name}` | Full report for one product (orders, returns, profit, loss, risk, trends) |

Interactive API docs (Swagger UI) are auto-generated at **`/docs`** once the
backend is running.

## Running Locally

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend will be live at `http://localhost:8000` (docs at `http://localhost:8000/docs`).

### 2. Frontend

In a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

Frontend will be live at `http://localhost:5173`. It automatically proxies
`/api/*` calls to the backend (configured in `vite.config.js`), so both must
be running at the same time during development.

## Deploying to the Internet

You need to deploy the **backend** and **frontend** separately (or containerize both).

### Option A — Simple & Free tier friendly
- **Backend** → deploy `backend/` to **Render**, **Railway**, or **Fly.io**
  (all support Python/FastAPI out of the box). Start command:
  `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Frontend** → deploy `frontend/` to **Vercel** or **Netlify**.
  Set the environment variable `VITE_API_BASE_URL` to your deployed backend URL
  (e.g. `https://your-backend.onrender.com`) before building.
- Build command: `npm run build`, output directory: `dist`.

### Option B — Docker (both together)
Create a `Dockerfile` in `backend/`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```
Build the frontend (`npm run build`) and serve the `dist/` folder via Nginx,
or any static host, pointed at your deployed backend URL.

### Important for production
- In `backend/main.py`, change `allow_origins=["*"]` to your actual frontend
  domain (e.g. `["https://your-app.vercel.app"]`) for security.
- Set `VITE_API_BASE_URL` in the frontend's environment before building.

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Backend Framework | FastAPI |
| ML Model | scikit-learn (RandomForestClassifier) |
| Data Handling | pandas, numpy |
| Frontend Framework | React 19 (Vite) |
| Charts / 3D | Plotly.js (react-plotly.js) |
| HTTP Client | axios |
| Styling | Plain CSS (custom, no framework) |
