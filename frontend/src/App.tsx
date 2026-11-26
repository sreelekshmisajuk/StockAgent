import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import { useSimulationWebSocket } from './hooks/useWebSocket';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { SimulationDeck } from './components/SimulationDeck';
import { DashboardView } from './components/DashboardView';
import { AgentRoster } from './components/AgentRoster';
import { TradesView } from './components/TradesView';
import { NewsView } from './components/NewsView';
import { AnalyticsView } from './components/AnalyticsView';
import { ReportsView } from './components/ReportsView';
import { LogsConsole } from './components/LogsConsole';
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
} from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [simulations, setSimulations] = useState<SimulationRun[]>([]);
  const [activeSim, setActiveSim] = useState<SimulationRun | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [backendConnected, setBackendConnected] = useState<boolean>(false);

  // Simulation Entities State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [snapshots, setSnapshots] = useState<StockSnapshot[]>([]);
  const [trades, setTrades] = useState<TradeOrder[]>([]);
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [portfolios, setPortfolios] = useState<PortfolioHistory[]>([]);
  const [news, setNews] = useState<MacroEvent[]>([]);
  const [forum, setForum] = useState<ForumMessage[]>([]);
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [logs, setLogs] = useState<SimulationLog[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  // Real-time WebSocket hook
  const { isConnected: wsConnected, lastMessage } = useSimulationWebSocket(activeSim?.id || null);

  // Load all simulations
  const loadSimulations = useCallback(async () => {
    try {
      const data = await api.getSimulations();
      setSimulations(data);
      setBackendConnected(true);
      if (data.length > 0 && !activeSim) {
        setActiveSim(data[0]);
      }
    } catch {
      setBackendConnected(false);
    }
  }, [activeSim]);

  // Load active simulation data
  const loadActiveSimData = useCallback(async (simId: string) => {
    try {
      const [
        dashStats,
        stockData,
        tradeData,
        agentData,
        portData,
        newsData,
        forumData,
        loanData,
        logData,
        analyticsData,
      ] = await Promise.allSettled([
        api.getDashboardStats(simId),
        api.getStockSnapshots(simId),
        api.getTrades(simId),
        api.getAgents(simId),
        api.getPortfolios(simId),
        api.getNews(simId),
        api.getForumMessages(simId),
        api.getLoans(simId),
        api.getLogs(simId),
        api.getAnalyticsSummary(simId),
      ]);

      if (dashStats.status === 'fulfilled') setStats(dashStats.value);
      if (stockData.status === 'fulfilled') setSnapshots(stockData.value);
      if (tradeData.status === 'fulfilled') setTrades(tradeData.value);
      if (agentData.status === 'fulfilled') setAgents(agentData.value);
      if (portData.status === 'fulfilled') setPortfolios(portData.value);
      if (newsData.status === 'fulfilled') setNews(newsData.value);
      if (forumData.status === 'fulfilled') setForum(forumData.value);
      if (loanData.status === 'fulfilled') setLoans(loanData.value);
      if (logData.status === 'fulfilled') setLogs(logData.value);
      if (analyticsData.status === 'fulfilled') setAnalytics(analyticsData.value);
    } catch (err) {
      console.error('Failed loading simulation details', err);
    }
  }, []);

  // Poll simulations and dashboard periodically
  useEffect(() => {
    loadSimulations();
    const interval = setInterval(loadSimulations, 4000);
    return () => clearInterval(interval);
  }, [loadSimulations]);

  useEffect(() => {
    if (activeSim?.id) {
      loadActiveSimData(activeSim.id);
      if (activeSim.status === 'RUNNING') {
        const interval = setInterval(() => loadActiveSimData(activeSim.id), 2000);
        return () => clearInterval(interval);
      }
    }
  }, [activeSim?.id, activeSim?.status, loadActiveSimData]);

  // Handle incoming real-time WebSocket events
  useEffect(() => {
    if (!lastMessage) return;

    const eventType = String((lastMessage as any).type || (lastMessage as any).event || '').toUpperCase();
    const data = lastMessage.data;

    switch (eventType) {
      case 'MARKET_TICK':
      case 'SESSION_CLOSED':
        if (activeSim?.id) {
          loadActiveSimData(activeSim.id);
        }
        break;

      case 'TRADE_EXECUTED':
        if (data) {
          setTrades((prev) => [data, ...prev]);
          setStats((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              total_executed_trades: prev.total_executed_trades + 1,
              total_volume_traded: prev.total_volume_traded + (data.amount || 0),
            };
          });
          if (activeSim?.id) {
            api.getLogs(activeSim.id).then((l) => setLogs(l)).catch(() => {});
          }
        }
        break;

      case 'MACRO_EVENT':
      case 'NEWS_BROADCAST':
        if (data) setNews((prev) => [data, ...prev]);
        break;

      case 'FORUM_POST':
      case 'FORUM_MESSAGE':
        if (data) setForum((prev) => [data, ...prev]);
        break;

      case 'PORTFOLIO_SNAPSHOT':
      case 'AGENT_UPDATED':
        if (data) setPortfolios((prev) => [...prev, data]);
        if (activeSim?.id) {
          api.getAgents(activeSim.id).then((a) => setAgents(a)).catch(() => {});
        }
        break;

      case 'ORDER_INTENT':
        if (activeSim?.id) {
          api.getLogs(activeSim.id).then((l) => setLogs(l)).catch(() => {});
        }
        break;

      case 'SIMULATION_STARTED':
      case 'SIMULATION_PAUSED':
      case 'SIMULATION_RESUMED':
      case 'SIMULATION_COMPLETED':
      case 'SIMULATION_STOPPED':
      case 'SIMULATION_FAILED':
      case 'SIMULATION_ERROR':
        if (activeSim?.id) {
          api.getSimulation(activeSim.id).then((sim) => {
            setActiveSim(sim);
            setSimulations((prev) => prev.map((s) => (s.id === sim.id ? sim : s)));
          });
          loadActiveSimData(activeSim.id);
        }
        break;

      default:
        break;
    }
  }, [lastMessage, activeSim?.id, loadActiveSimData]);

  // Actions
  const handleCreateSim = async (config: SimulationCreate) => {
    const newSim = await api.createSimulation(config);
    setSimulations((prev) => [newSim, ...prev]);
    setActiveSim(newSim);
  };

  const handleStartSim = async (id: string) => {
    const updated = await api.startSimulation(id);
    setActiveSim(updated);
  };

  const handlePauseSim = async (id: string) => {
    const updated = await api.pauseSimulation(id);
    setActiveSim(updated);
  };

  const handleResumeSim = async (id: string) => {
    const updated = await api.resumeSimulation(id);
    setActiveSim(updated);
  };

  const handleStopSim = async (id: string) => {
    const updated = await api.stopSimulation(id);
    setActiveSim(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans antialiased">
      {/* Sidebar with 13 Dedicated Pages */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        simulations={simulations}
        activeSim={activeSim}
        onSelectSim={(id) => {
          const selected = simulations.find((s) => s.id === id);
          if (selected) setActiveSim(selected);
        }}
        backendConnected={backendConnected}
        wsConnected={wsConnected}
        onOpenNewSimModal={() => setIsModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        <TopHeader
          activeTab={activeTab}
          activeSim={activeSim}
          onStart={handleStartSim}
          onPause={handlePauseSim}
          onResume={handleResumeSim}
          onStop={handleStopSim}
          onOpenNewSimModal={() => setIsModalOpen(true)}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* 1. Dashboard & Market Overview */}
          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              activeSim={activeSim}
              snapshots={snapshots}
              trades={trades}
            />
          )}

          {/* 2. AI Investors (5 Personas, Portfolios, Debts & Balances) */}
          {activeTab === 'agents' && (
            <AgentRoster
              agents={agents}
              portfolios={portfolios}
              loans={loans}
              trades={trades}
              forum={forum}
              activeSim={activeSim}
              snapshots={snapshots}
            />
          )}

          {/* 3. External Events & News (Macro, Policy, Fundamentals, Global) */}
          {activeTab === 'events' && (
            <NewsView
              news={news}
              forum={forum}
              simulationId={activeSim?.id}
            />
          )}

          {/* 4. Live Simulation Cockpit (Control Deck, Streaming Trades & Activity Logs) */}
          {activeTab === 'simulation' && (
            <div className="space-y-6">
              <SimulationDeck
                activeSim={activeSim}
                onStart={handleStartSim}
                onPause={handlePauseSim}
                onResume={handleResumeSim}
                onStop={handleStopSim}
                onCreate={handleCreateSim}
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
              />
              <TradesView trades={trades} />
              <LogsConsole logs={logs} />
            </div>
          )}

          {/* 5. Research & Reports (Model Comparison, Scenario Comparison & Exports) */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <AnalyticsView
                activeSim={activeSim}
                analytics={analytics}
                portfolios={portfolios}
                agents={agents}
                trades={trades}
                snapshots={snapshots}
              />
              <ReportsView activeSim={activeSim} />
            </div>
          )}
        </main>
      </div>

      {/* New Simulation Modal (Available globally) */}
      {isModalOpen && activeTab !== 'simulation' && (
        <SimulationDeck
          activeSim={activeSim}
          onStart={handleStartSim}
          onPause={handlePauseSim}
          onResume={handleResumeSim}
          onStop={handleStopSim}
          onCreate={handleCreateSim}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
        />
      )}
    </div>
  );
}

export default App;
