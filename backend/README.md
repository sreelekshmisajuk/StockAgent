# StockAgent FastAPI Backend

Enterprise backend system for the StockAgent LLM multi-agent stock trading simulation platform.

## Architecture

- **Framework**: FastAPI (asynchronous, high-performance web framework)
- **Database**: SQLite + SQLAlchemy 2.0 (ORM)
- **Real-Time Communication**: WebSockets (`/ws/{simulation_id}`)
- **Simulation Runner**: Non-invasive `EngineAdapter` wrapping the original research simulation engine with pause, resume, stop, and streaming event hooks.

## Directory Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application entry, CORS, WebSockets
│   ├── core/
│   │   ├── config.py        # Settings and environment variables
│   │   └── database.py      # SQLAlchemy engine, session maker, base model
│   ├── models/              # SQLAlchemy database models
│   ├── schemas/             # Pydantic v2 validation schemas
│   ├── api/
│   │   ├── api_router.py    # Master router
│   │   └── routes/          # 13 dedicated REST API routers
│   ├── services/            # Business logic and EngineAdapter
│   └── websocket/
│       └── manager.py       # Threadsafe WebSocket connection hub
├── tests/                   # Pytest test suite
├── requirements.txt
└── README.md
```

## Setup & Running

### 1. Activate Environment & Install Dependencies
```powershell
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
```

### 2. Configure API Keys (Optional for live LLM agents)
```powershell
$env:GOOGLE_API_KEY = "your-gemini-api-key"
# or
$env:OPENAI_API_KEY = "your-openai-api-key"
```

### 3. Start the Backend Server
```powershell
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive OpenAPI documentation is available at:
`http://localhost:8000/docs`

## Available API Endpoints

- **Dashboard**: `GET /api/dashboard`
- **Simulations**:
  - `POST /api/simulations` – Create new simulation
  - `GET /api/simulations` – List simulations
  - `GET /api/simulations/{id}` – Get simulation info
  - `GET /api/simulations/{id}/status` – Live progress and status
  - `POST /api/simulations/{id}/start` – Start simulation in background
  - `POST /api/simulations/{id}/pause` – Pause execution
  - `POST /api/simulations/{id}/resume` – Resume execution
  - `POST /api/simulations/{id}/stop` – Safely stop execution
- **Agents**: `GET /api/agents/{simulation_id}`, `GET /api/agents/{simulation_id}/{agent_order}`
- **Stocks**: `GET /api/stocks/{simulation_id}`, `GET /api/stocks/{simulation_id}/history/{ticker}`
- **Trades**: `GET /api/trades/{simulation_id}`, `GET /api/trades/{simulation_id}/orders`
- **Portfolios**: `GET /api/portfolios/{simulation_id}/summary`, `GET /api/portfolios/{simulation_id}/history`
- **News & Shocks**: `GET /api/news/{simulation_id}`
- **Investor Forum**: `GET /api/forum/{simulation_id}`
- **Loans & Credit**: `GET /api/loans/{simulation_id}`
- **Analytics**: `GET /api/analytics/{simulation_id}`
- **Reports**: `POST /api/reports/export/{simulation_id}`, `GET /api/reports/download/{simulation_id}/{filename}`
- **Logs**: `GET /api/logs`
- **Settings**: `GET /api/settings`
- **WebSocket**: `WS /ws/{simulation_id}`
