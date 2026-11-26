
# StockAgent: Autonomous LLM Multi-Agent Market Simulation Platform

StockAgent is an end-to-end financial research and market simulation platform that simulates realistic equity markets populated by autonomous Large Language Model (LLM) investor agents.

Each agent independently evaluates market signals, interacts with other agents through a financial discussion board, manages leveraged portfolios, and submits trading orders executed through a Continuous Double Auction (CDA) exchange.

The platform combines a Python-based AI simulation engine, a FastAPI backend, and a React-based interactive frontend to provide real-time market monitoring, autonomous trading, analytics, and research capabilities.

---

## 1. System Architecture

StockAgent consists of three interconnected layers:

```text
┌──────────────────────────────────────────────────────────────┐
│                  FRONTEND                                    │
│              React 18 + TypeScript + Vite                    │
│                                                              │
│  Dashboard & Charts       AI Investor Roster                 │
│  Market Analytics         Real-Time Simulation Cockpit       │
│  Asset Evolution          Leaderboard & Research Exports     │
└──────────────────────────────┬───────────────────────────────┘
                               │
                       REST APIs + WebSockets
                               │
┌──────────────────────────────▼───────────────────────────────┐
│                  BACKEND                                     │
│                  FastAPI + SQLite                            │
│                                                              │
│  Simulation API            Portfolio & Loan Services         │
│  Market Data Services      Trade Matching & Auditing         │
│  Analytics & Reports       WebSocket Event Streaming         │
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
│  Gemini LLM Agent Decision Engine                             │
│  Autonomous Trading & Portfolio Management                   │
└──────────────────────────────────────────────────────────────┘
```

### Architecture Overview

- **Frontend:** Interactive dashboard for market visualization, investor monitoring, simulation control, and research analytics.
- **Backend:** FastAPI services that expose REST endpoints, manage application data, and stream real-time events through WebSockets.
- **Simulation Kernel:** Python-based autonomous multi-agent engine responsible for market analysis, LLM-driven decisions, and trade execution.

---

## 2. Four-Factor AI Decision Framework

Each autonomous investor evaluates four synchronized market inputs before deciding whether to BUY, SELL, or HOLD.

| Factor | Input | Description |
|---|---|---|
| 1. Market Data | Stock Prices & Technical Trends | Live or simulated prices, moving averages, and order book bid/ask pressure. |
| 2. Fundamentals | Corporate Financial Reports | Financial statements, DCF valuation, gross margins, cash flow, and debt-to-equity ratios. |
| 3. Social Sentiment | BBS Discussion Forum | Agent discussions, peer sentiment, bullish/bearish opinions, and contrarian signals. |
| 4. External Events | Macro & Policy Shocks | Benchmark interest rates, Reserve Requirement Ratio (RRR) changes, subsidies, and regulatory events. |

### Autonomous Decision Process

```text
        Stock Price Stream
                |
                v
      Corporate Financial Data
                |
                v
       BBS Social Discussions
                |
                v
        Macro & Policy Events
                |
                v
       Autonomous AI Agent
                |
                v
       Trading Decision
                |
       ┌────────┼────────┐
       v        v        v
      BUY      SELL     HOLD
                |
                v
       Order Submission
                |
                v
    Continuous Double Auction
                |
                v
       Trade Execution & Audit
```

Each agent generates a trading decision containing:

- Trading action
- Order quantity
- Proposed execution price
- Decision rationale
- Risk profile

---

## 3. Five Autonomous AI Investor Personas

Each investor follows a distinct behavioral archetype and trading strategy.

| Persona | Risk Profile | Strategy |
|---|---|---|
| Conservative | Low Risk | Focuses on capital preservation and undervalued opportunities while avoiding excessive leverage. |
| Aggressive | High Risk | Pursues momentum and growth opportunities, accepting greater volatility and margin exposure. |
| Fundamental | Moderate Risk | Evaluates financial statements, intrinsic value, DCF estimates, and corporate solvency. |
| News-Driven | Event-Driven | Reacts to regulatory announcements, interest rate changes, and macroeconomic developments. |
| Technical | Quantitative | Analyzes order book depth, bid-ask imbalances, support/resistance, and price breakouts. |

---

## 4. Platform Modules & Features

### 📊 1. Dashboard & Market Overview

**Route:** `/`

- Interactive Japanese candlestick charts with high/low wicks and volume visualization.
- Toggle between real-world market feeds and simulated market prices.
- Live stock quote integration for symbols such as AAPL, MSFT, NVDA, GOOGL, TSLA, and RELIANCE.NS.
- Market metrics including stock prices, active investors, and executed trade counts.
- Recent executed trades and real-time market updates.

### 👥 2. AI Investors

**Route:** `/agents`

- Investor directory with individual portfolio information.
- Agent cash balances, equity holdings, outstanding debt, and net worth.
- Persona-based filtering across all five investor strategies.
- Inspect Brain interface for examining individual agent decisions.
- Four-factor market analysis and decision rationale.
- Historical trades, confidence scores, and BBS discussion posts.
- Loan history, borrowing dates, and interest rates.

### 📰 3. External Events & News

**Route:** `/events`

- Chronological market events and macroeconomic developments.
- Policy shocks including benchmark interest rate changes and RRR adjustments.
- Industry regulations, subsidies, and geopolitical developments.
- Comparative analysis of how different AI investor personas interpret external events.

### 🕹️ 4. Live Simulation Cockpit

**Route:** `/simulation`

- Start, pause, resume, and stop simulation sessions.
- Real-time trade execution ledger.
- Trading information including buyer, seller, price, turnover, and decision rationale.
- Live kernel logs and simulation event monitoring.
- WebSocket-based real-time communication.

### 📈 5. Research & Reports

**Route:** `/reports`

- Asset evolution and portfolio performance visualization.
- Agent net worth comparison using a normalized starting capital of ₹1,00,000.
- Interactive chart filters for individual investor strategies.
- Ranked investor leaderboard based on financial performance.
- Portfolio breakdown covering liquid cash, equity value, debt, and total returns.
- Research data exports in Microsoft Excel (`.xlsx`) and CSV formats.

---

## 5. Technology Stack

### Backend

| Technology | Purpose |
|---|---|
| Python 3.10+ | Core programming language |
| FastAPI | REST API development |
| Uvicorn | ASGI server |
| SQLite | Relational database |
| SQLAlchemy | Database ORM |
| Google Gemini API | LLM-powered agent decisions |
| WebSockets | Real-time event communication |
| Requests | External market data integration |
| Pandas | Data processing and analysis |
| OpenPyXL | Excel report generation |
| Pydantic | Data validation and schemas |

### Frontend

| Technology | Purpose |
|---|---|
| React 18 | User interface development |
| TypeScript | Type-safe application development |
| Vite | Frontend build tooling |
| Tailwind CSS | UI styling |
| Lucide React | Icon library |
| Recharts | Data visualization |
| Custom SVG Charts | Japanese candlestick visualization |

---

## 6. Project Structure

```text
StockAgent/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── websocket/
│   │   └── main.py
│   ├── tests/
│   ├── requirements.txt
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.ts
│
├── prompt/
│   └── agent_prompt.py
│
├── res/
│   └── Simulation output files (.xlsx)
│
├── agent.py
├── main.py
├── record.py
├── secretary.py
├── util.py
├── .gitignore
└── README.md
```

---

## 7. Installation & Setup

### Prerequisites

Ensure the following are installed:

- Python 3.10 or later
- Node.js and npm
- Git

### Step 1: Clone the Repository

```bash
git clone https://github.com/sreelekshmisajuk/StockAgent.git
cd StockAgent
```

### Step 2: Set Up the Python Environment

```powershell
python -m venv .venv
```

Activate the virtual environment:

```powershell
.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r backend/requirements.txt
```

### Step 3: Configure Environment Variables

Configure the required API credentials and application settings according to the backend configuration.

For example, if your application uses a Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key
```

**Important:** Keep API keys and secrets in environment variables. Never commit actual credentials to GitHub.

### Step 4: Start the Backend Server

From the repository root:

```powershell
.venv\Scripts\uvicorn.exe backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend API documentation:

http://localhost:8000/docs

### Step 5: Start the Frontend Development Server

Open a new terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the local development URL displayed by Vite in your terminal.

---

## 8. API & Real-Time Communication

The backend provides REST APIs for application operations and WebSocket connections for real-time updates.

Core backend modules include:

- Agent management
- Market data
- Portfolio management
- Trading and order execution
- Loans and leverage
- Analytics and reporting
- Simulation control
- News and discussion forums
- Application settings
- Logs and monitoring

FastAPI automatically provides interactive API documentation through Swagger UI.

**API Documentation:** `http://localhost:8000/docs`

---

## 9. Research & Simulation Capabilities

StockAgent provides an experimental environment for studying autonomous AI investor behavior in simulated financial markets.

Key research capabilities include:

- Comparing different AI investor strategies.
- Studying LLM-based trading decisions.
- Observing the influence of financial fundamentals and social sentiment.
- Evaluating portfolio performance and risk exposure.
- Analyzing market reactions to external economic events.
- Exporting simulation records for further research.

---


