import {
  SimulationRun,
  SimulationCreate,
  DashboardStats,
  StockSnapshot,
  TradeOrder,
  AgentProfile,
  PortfolioHistory,
  MacroEvent,
  ForumMessage,
  LoanRecord,
  SimulationLog,
  AnalyticsSummary,
} from '../types';

const API_BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const json = await response.json();
      if (json && json.detail) {
        errorDetail = typeof json.detail === 'string' ? json.detail : JSON.stringify(json.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Dashboard
  getDashboardStats: (simId?: string) =>
    request<DashboardStats>(`/dashboard${simId ? `?simulation_id=${simId}` : ''}`),

  // Simulations
  getSimulations: () => request<SimulationRun[]>('/simulations'),
  getSimulation: (id: string) => request<SimulationRun>(`/simulations/${id}`),
  createSimulation: (data: SimulationCreate) =>
    request<SimulationRun>('/simulations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  startSimulation: (id: string) =>
    request<SimulationRun>(`/simulations/${id}/start`, { method: 'POST' }),
  pauseSimulation: (id: string) =>
    request<SimulationRun>(`/simulations/${id}/pause`, { method: 'POST' }),
  resumeSimulation: (id: string) =>
    request<SimulationRun>(`/simulations/${id}/resume`, { method: 'POST' }),
  stopSimulation: (id: string) =>
    request<SimulationRun>(`/simulations/${id}/stop`, { method: 'POST' }),

  // Stocks
  getStockSnapshots: (simId: string, ticker?: string) =>
    request<StockSnapshot[]>(`/stocks/${simId}/snapshots${ticker ? `?ticker=${ticker}` : ''}`),
  getLiveStockQuote: (ticker: string, currency: string = 'INR', simId?: string) =>
    request<any>(`/stocks/live/${ticker}?currency=${currency}${simId ? `&simulation_id=${simId}` : ''}`),

  // Trades
  getTrades: (simId: string, ticker?: string, limit: number = 100) =>
    request<TradeOrder[]>(`/trades/${simId}?limit=${limit}${ticker ? `&ticker=${ticker}` : ''}`),

  // Agents
  getAgents: (simId: string) => request<AgentProfile[]>(`/agents/${simId}`),
  getAgentDecisions: (simId: string, agentOrder: number | string) =>
    request<any[]>(`/agents/${simId}/${agentOrder}/decisions`),
  getFinancialReports: (simId: string) =>
    request<any>(`/stocks/${simId}/financial-reports`),

  // Portfolios
  getPortfolios: (simId: string, agentId?: string) =>
    request<PortfolioHistory[]>(`/portfolios/${simId}${agentId ? `?agent_id=${agentId}` : ''}`),
  getPortfolioSummary: (simId: string) =>
    request<any[]>(`/portfolios/${simId}/summary`),

  // News & Macro
  getNews: (simId: string, limit: number = 50) =>
    request<MacroEvent[]>(`/news/${simId}?limit=${limit}`),

  // Forum
  getForumMessages: (simId: string, limit: number = 50) =>
    request<ForumMessage[]>(`/forum/${simId}?limit=${limit}`),

  // Loans
  getLoans: (simId: string) => request<LoanRecord[]>(`/loans/${simId}`),

  // Analytics
  getAnalyticsSummary: (simId: string) =>
    request<AnalyticsSummary>(`/analytics/${simId}/summary`),

  // Reports
  exportReport: (simId: string, reportType: string = 'trades', format: string = 'excel') =>
    request<{ simulation_id: string; format: string; report_type: string; file_path: string; download_url: string }>(
      `/reports/export/${simId}?report_type=${reportType}&format=${format}`,
      { method: 'POST' }
    ),

  // Logs
  getLogs: (simId: string, level?: string, limit: number = 200) =>
    request<SimulationLog[]>(`/logs/${simId}?limit=${limit}${level ? `&level=${level}` : ''}`),

  // Settings
  getSettings: () => request<any>('/settings'),
};
