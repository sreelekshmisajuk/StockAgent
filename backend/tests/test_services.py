import pytest
from backend.app.schemas import SimulationCreate
from backend.app.services import (
    simulation_service,
    agent_service,
    market_service,
    trading_service,
    portfolio_service,
    news_service,
    forum_service,
    loan_service,
    analytics_service,
    report_service,
    settings_service,
    engine_adapter,
)
from backend.app.models import (
    AgentProfile, StockSnapshot, TradeOrder, OrderIntent,
    PortfolioHistory, MacroEvent, ForumMessage, LoanRecord
)

def test_settings_service():
    settings_data = settings_service.get_settings()
    assert settings_data.project_name == "StockAgent Simulation API"
    assert "gemini-1.5-flash" in settings_data.supported_models
    assert isinstance(settings_data.has_openai_key, bool)

def test_simulation_crud_service(db_session):
    # 1. Create simulation
    sim_data = SimulationCreate(
        name="Test Service Sim",
        model_name="gemini-1.5-flash",
        total_agents=4,
        total_days=2,
        total_sessions=2
    )
    sim = simulation_service.create_simulation(db_session, sim_data)
    assert sim.id is not None
    assert sim.name == "Test Service Sim"
    assert sim.status == "PENDING"

    # 2. Get status
    status_data = simulation_service.get_status(db_session, sim.id)
    assert status_data.status == "PENDING"
    assert status_data.progress_percentage == 0.0

    # 3. List simulations
    sims = simulation_service.list_simulations(db_session)
    assert len(sims) >= 1

    # 4. Add mock simulation data (agents, stock snapshots, trades)
    agent_1 = AgentProfile(
        simulation_id=sim.id,
        agent_order=0,
        character="Aggressive",
        initial_cash=50000.0,
        initial_stock_a=100,
        initial_stock_b=50,
        current_cash=45000.0,
        current_stock_a=110,
        current_stock_b=50,
        current_debt=0.0
    )
    agent_2 = AgentProfile(
        simulation_id=sim.id,
        agent_order=1,
        character="Conservative",
        initial_cash=80000.0,
        initial_stock_a=50,
        initial_stock_b=200,
        current_cash=85000.0,
        current_stock_a=40,
        current_stock_b=200,
        current_debt=0.0
    )
    db_session.add_all([agent_1, agent_2])

    stock_snap_a = StockSnapshot(
        simulation_id=sim.id,
        day=1,
        session=1,
        ticker="A",
        price=27.5
    )
    stock_snap_b = StockSnapshot(
        simulation_id=sim.id,
        day=1,
        session=1,
        ticker="B",
        price=42.0
    )
    db_session.add_all([stock_snap_a, stock_snap_b])

    trade = TradeOrder(
        simulation_id=sim.id,
        day=1,
        session=1,
        ticker="A",
        buyer_id=0,
        seller_id=1,
        amount=10,
        price=27.5
    )
    db_session.add(trade)

    macro_event = MacroEvent(
        simulation_id=sim.id,
        day=1,
        event_name="RRR Cut",
        message="Reserve requirement ratio lowered",
        loan_rates="[0.024, 0.027, 0.030]"
    )
    db_session.add(macro_event)

    forum_msg = ForumMessage(
        simulation_id=sim.id,
        day=1,
        agent_id=0,
        message="Bullish on Stock A!"
    )
    db_session.add(forum_msg)

    loan = LoanRecord(
        simulation_id=sim.id,
        agent_id=0,
        day=1,
        applied=True,
        loan_type=1,
        amount=10000.0,
        repayment_day=44
    )
    db_session.add(loan)
    db_session.commit()

    # 5. Test Agent Service
    agents = agent_service.get_agents(db_session, sim.id)
    assert len(agents) == 2
    agent_detail = agent_service.get_agent_detail(db_session, sim.id, 0)
    assert agent_detail["character"] == "Aggressive"
    assert agent_detail["total_portfolio_value"] > 0

    # 6. Test Market Service
    overview = market_service.get_stocks_overview(db_session, sim.id)
    assert len(overview) == 2
    history_a = market_service.get_stock_history(db_session, sim.id, "A")
    assert len(history_a) == 1
    assert history_a[0].price == 27.5

    # 7. Test Trading Service
    trades = trading_service.get_trades(db_session, sim.id)
    assert len(trades) == 1
    assert trades[0].amount == 10
    assert trades[0].ticker == "A"

    # 8. Test Portfolio Service
    summaries = portfolio_service.get_portfolio_summaries(db_session, sim.id)
    assert len(summaries) == 2

    # 9. Test News & Forum & Loan Services
    events = news_service.get_events(db_session, sim.id)
    assert len(events) == 1
    forum_msgs = forum_service.get_forum_messages(db_session, sim.id)
    assert len(forum_msgs) == 1
    loans = loan_service.get_loans(db_session, sim.id)
    assert len(loans) == 1

    # 10. Test Analytics Service
    analytics = analytics_service.get_analytics_overview(db_session, sim.id)
    assert analytics.total_trades_count == 1
    assert analytics.total_volume_traded == 10
    assert len(analytics.persona_breakdown) >= 1

    # 11. Test Report Service Export
    report_csv = report_service.export_report(db_session, sim.id, "trades", "csv")
    assert report_csv.format == "csv"
    assert "trades" in report_csv.file_path
