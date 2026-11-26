export interface SimulationRun {
  id: string;
  name: string;
  status: 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'STOPPED';
  model_name: string;
  total_agents: number;
  total_days: number;
  total_sessions: number;
  stocks?: string;
  initial_capital?: number;
  scenario_type?: 'baseline' | 'event-driven';
  current_day: number;
  current_session: number;
  initial_cash_min: number;
  initial_cash_max: number;
  risk_free_rate: number;
  config_json?: string;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface CustomEventCreate {
  title: string;
  description: string;
  affected_stocks?: string;
  category?: string;
  sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  severity?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  round_day: number;
}

export interface SimulationCreate {
  name?: string;
  model_name?: string;
  total_agents?: number;
  total_days?: number;
  total_sessions?: number;
  stocks?: string[];
  initial_capital?: number;
  scenario_type?: 'baseline' | 'event-driven';
  selected_factors?: string[];
  custom_events?: CustomEventCreate[];
  initial_cash_min?: number;
  initial_cash_max?: number;
  risk_free_rate?: number;
  loan_interest_rate?: number;
  enable_news?: boolean;
  enable_forum?: boolean;
}

export interface StockSnapshot {
  id: number;
  simulation_id: string;
  ticker: string;
  day: number;
  session: number;
  open_price: number;
  close_price: number;
  high_price: number;
  low_price: number;
  volume: number;
  turnover: number;
  timestamp: string;
}

export interface TradeOrder {
  id: number;
  simulation_id: string;
  order_type: 'BUY' | 'SELL';
  ticker: string;
  day: number;
  session: number;
  buyer_id?: string;
  seller_id?: string;
  price: number;
  amount: number;
  turnover: number;
  reasoning?: string;
  risk_assessment?: string;
  confidence?: number;
  timestamp: string;
}

export interface AgentProfile {
  id: number | string;
  simulation_id: string;
  agent_order?: number;
  agent_index?: number;
  character?: string;
  name?: string;
  persona?: string;
  risk_appetite?: string;
  initial_cash: number;
  initial_stock_a: number;
  initial_stock_b: number;
  initial_debt?: number;
  current_cash?: number;
  current_stock_a?: number;
  current_stock_b?: number;
  current_debt?: number;
  is_bankrupt?: boolean;
  is_active?: boolean;
  created_at?: string;
}

export interface PortfolioHistory {
  id: number;
  simulation_id: string;
  agent_id: number | string;
  day: number;
  session: number;
  cash: number;
  stock_a_shares?: number;
  stock_a_amount?: number;
  stock_a_value?: number;
  stock_b_shares?: number;
  stock_b_amount?: number;
  stock_b_value?: number;
  total_property?: number;
  net_worth?: number;
  debt?: number;
  total_debt?: number;
  timestamp: string;
}

export interface MacroEvent {
  id: number;
  simulation_id: string;
  day: number;
  session?: number;
  event_name?: string;
  headline?: string;
  message?: string;
  body?: string;
  category?: string;
  affected_stocks?: string;
  impact_stock?: string;
  sentiment?: string;
  severity?: string;
  loan_rates?: string;
  timestamp: string;
}

export interface ForumMessage {
  id: number;
  simulation_id: string;
  agent_id: number | string;
  day: number;
  session?: number;
  content?: string;
  message?: string;
  sentiment?: string;
  timestamp: string;
}

export interface LoanRecord {
  id: number;
  simulation_id: string;
  agent_id: number | string;
  day?: number;
  day_borrowed?: number;
  repayment_day?: number;
  amount?: number;
  loan_type?: number;
  interest_rate?: number;
  status?: string;
  is_repaid?: boolean;
  timestamp: string;
}

export interface SimulationLog {
  id: number;
  simulation_id: string;
  level: string;
  message: string;
  day?: number;
  session?: number;
  timestamp: string;
}

export interface FinancialQuarter {
  quarter: string;
  revenue: number;
  gross_profit: number;
  operating_income: number;
  net_income: number;
  growth_yoy: string;
}

export interface CompanyFinancials {
  ticker: string;
  company_name: string;
  sector: string;
  summary: {
    gross_margin: string;
    net_profit_margin: string;
    operating_margin: string;
    return_on_investment: string;
    wacc: string;
    cost_of_debt: string;
    sustainable_growth_rate: string;
  };
  quarterly_statements: FinancialQuarter[];
}

export interface FinancialReportsResponse {
  simulation_id: string;
  companies: CompanyFinancials[];
}

export interface DashboardStats {
  total_simulations: number;
  active_simulation?: SimulationRun | null;
  total_agents: number;
  total_executed_trades: number;
  total_volume_traded: number;
  latest_stock_a_price?: number;
  latest_stock_b_price?: number;
  recent_trades: TradeOrder[];
  recent_news: MacroEvent[];
  recent_forum: ForumMessage[];
}

export interface AnalyticsSummary {
  simulation_id: string;
  total_trades?: number;
  total_trades_count?: number;
  total_volume_shares?: number;
  total_volume_traded?: number;
  total_turnover?: number;
  total_turnover_cash?: number;
  stock_a_final_price?: number;
  stock_b_final_price?: number;
  stock_a_return_pct?: number;
  stock_b_return_pct?: number;
  total_market_capitalization?: number;
  wealth_gini_index?: number;
  top_performer?: {
    agent_id: string;
    character?: string;
    net_worth: number;
    roi_percent: number;
  };
  top_performers?: any[];
  persona_breakdown?: Array<{
    character: string;
    count: number;
    average_wealth: number;
    total_trades: number;
    bankruptcy_rate: number;
  }>;
  total_defaults?: number;
}

export interface CandleStickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  is_bullish: boolean;
  color: string;
}

export interface LiveStockQuote {
  ticker: string;
  symbol: string;
  company_name: string;
  currency: 'INR' | 'USD';
  current_price: number;
  open_price: number;
  high_price: number;
  low_price: number;
  previous_close: number;
  change: number;
  change_percent: number;
  volume: number;
  candlesticks: CandleStickData[];
}
