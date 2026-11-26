# StockAgent: Autonomous LLM Multi-Agent Market Simulation Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript-61DAFB?style=flat&logo=react)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/UI-Tailwind%20CSS-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/Database-SQLite%20%2B%20SQLAlchemy-003B57?style=flat&logo=sqlite)](https://www.sqlalchemy.org/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)

**StockAgent** is an end-to-end financial research and market simulation platform that simulates realistic equity markets populated by autonomous Large Language Model (LLM) investor agents.

Each agent independently evaluates market signals, interacts with peers on a financial discussion board, manages leveraged portfolios, and submits trading orders executed through a Continuous Double Auction (CDA) exchange.

The platform combines a Python-based multi-agent AI simulation engine, a FastAPI backend, and a modern React + Vite frontend to provide real-time market monitoring, autonomous trading, analytics, and research capabilities.

---

## 1. System Architecture

StockAgent consists of three interconnected layers:

```text
┌──────────────────────────────────────────────────────────────┐
│                  FRONTEND                                    │
│              React 18 + TypeScript + Vite                    │
│                                                              │
│  Dashboard & Live Candlesticks  AI Investor Roster           │
│  External Events & Shocks       Real-Time Simulation Cockpit │
│  Asset Evolution & Leaderboard  Excel / CSV Research Exports │
└──────────────────────────────┬───────────────────────────────┘
                               │
                       REST APIs + WebSockets
                               │
┌──────────────────────────────▼───────────────────────────────┐
│                  BACKEND                                     │
│                  FastAPI + SQLite                            │
│                                                              │
│  Simulation API Engine      Portfolio & Loan Services        │
│  Market Data Services       Trade Matching & Auditing        │
│  Analytics & Reports        WebSocket Event Streaming        │
└──────────────────────────────┬───────────────────────────────┘
                               │
                         Event Callback Loop
                               │
┌──────────────────────────────▼───────────────────────────────┐
│              AUTONOMOUS AI SIMULATION KERNEL                 │
│                       Python                                 │
│                                                              │
│  Continuous Double Auction (CDA) Exchange                    │
│  Four-Factor Market Context Assembly                         │
│  Gemini LLM Agent Decision Engine                            │
│  Autonomous Trading & Portfolio Management                   │
└──────────────────────────────────────────────────────────────┘
```

- **Frontend:** Interactive dashboard with Japanese candlestick charts, investor monitoring, live trade ledger, and research analytics.
- **Backend:** FastAPI services that expose REST endpoints, manage application data, and stream real-time events through WebSockets.
- **Simulation Kernel:** Python-based autonomous multi-agent engine responsible for market analysis, LLM-driven decisions, and CDA order execution.

---

## 2. Four-Factor AI Decision Framework

At each trading session, each autonomous investor evaluates four synchronized market inputs before deciding whether to **BUY**, **SELL**, or **HOLD**:

```text
        Stock Price Stream
                │
                ▼
       Corporate Financial Data
                │
                ▼
        BBS Social Discussions
                │
                ▼
         Macro & Policy Events
                │
                ▼
        Autonomous AI Agent
                │
                ▼
        Trading Decision
                │
        ┌───────┼───────┐
        ▼       ▼       ▼
       BUY     SELL    HOLD
                │
                ▼
        Order Submission
                │
                ▼
     Continuous Double Auction
                │
                ▼
        Trade Execution & Audit
```

| Factor | Input | Description |
|---|---|---|
| **1. Market Data** | Stock Prices & Technical Trends | Live Yahoo Finance feeds or simulated prices, moving averages, and order book bid/ask pressure. |
| **2. Fundamentals** | Corporate Financial Reports | Audited statements, DCF intrinsic valuation, gross margins, cash flow, and debt-to-equity ratios. |
| **3. Social Sentiment**| BBS Discussion Forum | Dynamic peer discussion feed, agent opinions, bull/bear sentiment, and contrarian signals. |
| **4. External Events** | Macro & Policy Shocks | Benchmark interest rates, Reserve Requirement Ratio (RRR) changes, subsidies, and policy shocks. |

---

## 3. Five Autonomous AI Investor Personas

Each investor follows a distinct behavioral archetype and trading strategy:

| Persona | Risk Profile | Strategy & Decision Driver | Preferred Equities |
|---|---|---|---|
| **Conservative** | Low Risk | Capital preservation; avoids high leverage; accumulates only when prices trade deeply below intrinsic support. | Stable Value (Stock A) |
| **Aggressive** | High Risk | Chases upside momentum; embraces market volatility; aggressively borrows margin debt to buy market dips. | High-Beta Growth (Stock B) |
| **Fundamental** | Moderate Risk | Evaluates audited financial statements, DCF midpoint discounts, and corporate solvency metrics. | Undervalued Assets |
| **News-Driven** | Event-Driven | Highly sensitive to regulatory announcements, interest rate cuts, and macroeconomic policy shifts. | Fast Rebalancing Assets |
| **Technical** | Quantitative | Reads order book depth, bid-ask imbalances, moving averages, and breakout levels. | Breakout Equities |

---

## 4. Platform Modules & Features

### 📊 1. Dashboard & Market Overview (`/`)
* **Real-World Live Candlestick Chart**: Toggle between green/red Japanese candlesticks (with high/low wicks, real volume histogram, and hover HUD) and simulation price lines.
* **Live Price Feeds**: Connects to real-world stock quotes (`AAPL`, `MSFT`, `NVDA`, `GOOGL`, `TSLA`, `RELIANCE.NS`, etc.) in Indian Rupees (₹) and USD ($).
* **Market Metrics**: Displays live prices for Stock A and Stock B, total active agents, and executed trade count.
* **Recent Executed Trades**: Shows instant ticker notifications of trades matched on the exchange.

### 👥 2. AI Investors (`/agents`)
* **Directory & Portfolios**: Visual cards for each active agent displaying liquid cash, equity share holdings, outstanding debt, and net worth.
* **Persona Filter Bar**: Quick-filter investors by strategy (`All`, `Conservative`, `Aggressive`, `Fundamental`, `News-Driven`, `Technical`).
* **Inspect Brain Modal**:
  * **4-Factor Brain Matrix**: Inspect how the agent analyzes price, fundamentals, forum posts, and events.
  * **Order Rationale & Trades**: Live audit trail of decisions with detailed reasoning text and confidence scores.
  * **BBS Forum Posts**: Chronological list of discussion posts published by the agent.
  * **Balance Sheet & Debt**: Detailed loan ledger with borrowing dates and interest rates.

### 📰 3. External Events & News (`/events`)
* **Macro & Policy Shocks**: Chronological list of market events (e.g. RRR rate cuts, technology subsidies, geopolitical developments).
* **Empirical Persona Reactions**: Side-by-side breakdown showing how Conservative, Aggressive, Fundamental, News-Driven, and Technical personas interpret each event.

### 🕹️ 4. Live Simulation Cockpit (`/simulation`)
* **Execution Deck**: Start, pause, resume, or stop running simulations in real time.
* **Live Trade Ledger**: Streaming table of every trade matched on the exchange, including buyer, seller, price, turnover, and rationale.
* **Kernel Log Console**: Live streaming stdout terminal capturing LLM prompt reasoning and exchange order-matching events over WebSockets.

### 📈 5. Research & Reports (`/reports`)
* **Asset Evolution Over Time**: Multi-agent net worth chart starting from a normalized base index (₹1,00,000) to compare strategic divergence.
* **Interactive Toggles**: Toggle individual agent visibility lines on and off.
* **Ranked Leaderboard**: Tabular ranking of agents sorted by total return, liquid cash, equity value, and debt.
* **Data Export Center**: One-click downloads of simulation data in **Microsoft Excel (.xlsx)** or **CSV** formats.

---

## 5. Technology Stack

### Backend
| Technology | Purpose |
|---|---|
| Python 3.10+ | Core programming language |
| FastAPI | High-performance REST API |
| Uvicorn | ASGI web server |
| SQLite & SQLAlchemy | Relational database & ORM |
| Google Gemini API | LLM-powered agent reasoning |
| WebSockets | Real-time event streaming |
| Requests & yfinance | External market data integration |
| OpenPyXL & Pandas | Excel report generation and data analytics |
| Pydantic v2 | Data validation and type schemas |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | User interface development |
| TypeScript | Type-safe application development |
| Vite | Frontend build tooling & dev server |
| Tailwind CSS | High-contrast enterprise styling |
| Lucide React | Modern icon suite |
| Custom SVG Engine | High-precision Japanese candlestick charts |
| Recharts | Statistical and asset evolution graphs |

---

## 6. Project Structure

```text
StockAgent/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/              # 13 dedicated REST routers
│   │   ├── core/                    # Database & settings
│   │   ├── models/                  # 10 SQLAlchemy ORM models
│   │   ├── schemas/                 # Pydantic v2 schemas
│   │   ├── services/                # Business logic & EngineAdapter
│   │   ├── websocket/               # Threadsafe WebSocket manager
│   │   └── main.py                  # FastAPI application entry
│   ├── tests/                       # Automated pytest suite
│   ├── requirements.txt             # Backend dependencies
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/              # React view components
│   │   ├── hooks/useWebSocket.ts    # Resilient WebSocket hook
│   │   ├── services/api.ts          # Typed REST API client
│   │   ├── types/index.ts           # Domain models
│   │   ├── App.tsx                  # Master layout
│   │   └── main.tsx                 # Root entry
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── prompt/
│   └── agent_prompt.py
├── agent.py                         # Autonomous agent brain
├── main.py                          # Simulation orchestrator
├── record.py                        # Performance recorder
├── secretary.py                     # Market secretary
├── util.py                          # Market utilities
├── .env.example
├── .gitignore
└── README.md
```

---

## 7. Installation & Quickstart

### Prerequisites
* Python 3.10 or higher
* Node.js 18 or higher (and npm)
* Git

### Step 1: Clone Repository
```bash
git clone https://github.com/sreelekshmisajuk/StockAgent.git
cd StockAgent
```

### Step 2: Setup Python Virtual Environment
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
```

### Step 3: Configure Environment
Copy `.env.example` to `.env` and set your Google Gemini API key:
```powershell
Copy-Item .env.example .env
```
In `.env`:
```env
GEMINI_API_KEY="your-gemini-api-key"
```

### Step 4: Start Backend Server
```powershell
.venv\Scripts\uvicorn.exe backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive Swagger docs: `http://localhost:8000/docs`

### Step 5: Start Frontend Server
In a separate terminal:
```powershell
cd frontend
npm install
npm run dev
```
Open your browser at the Vite URL (typically `http://localhost:5173`).

---

## 8. Verification & Tests

To execute the automated test suite:
```powershell
.\.venv\Scripts\python.exe -m pytest backend/tests/
```
All route and service tests pass with 100% success.
