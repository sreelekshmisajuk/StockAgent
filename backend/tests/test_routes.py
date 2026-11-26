from backend.app.api.routes import (
    dashboard,
    simulations,
    agents,
    stocks,
    trades,
    portfolios,
    news,
    forum,
    loans,
    analytics,
    reports,
    logs,
    settings,
)
from backend.app.schemas import SimulationCreate

def test_all_routes_direct(db_session):
    # 1. Settings route
    settings_res = settings.get_settings()
    assert settings_res.project_name == "StockAgent Simulation API"

    # 2. Simulations route: Create simulation
    create_req = SimulationCreate(
        name="Route Test Sim",
        model_name="gemini-1.5-flash",
        total_agents=2,
        total_days=1,
        total_sessions=1
    )
    sim_res = simulations.create_simulation(create_req, db_session)
    sim_id = sim_res.id
    assert sim_res.name == "Route Test Sim"

    # 3. Simulations route: List & Get & Status
    sim_list = simulations.list_simulations(db=db_session)
    assert len(sim_list) >= 1

    sim_single = simulations.get_simulation(sim_id, db_session)
    assert sim_single.id == sim_id

    sim_status = simulations.get_simulation_status(sim_id, db_session)
    assert sim_status.status == "PENDING"

    # 4. Agents route
    agent_list = agents.get_agents(sim_id, db_session)
    assert isinstance(agent_list, list)

    # 5. Stocks route
    stock_overview = stocks.get_stocks_overview(sim_id, db_session)
    assert len(stock_overview) == 2

    # 6. Trades route
    trade_list = trades.get_trades(sim_id, db=db_session)
    assert isinstance(trade_list, list)

    orders_list = trades.get_order_intents(sim_id, db=db_session)
    assert isinstance(orders_list, list)

    # 7. Portfolios route
    port_summaries = portfolios.get_portfolio_summaries(sim_id, db_session)
    assert isinstance(port_summaries, list)

    # 8. News route
    news_list = news.get_events(sim_id, db_session)
    assert isinstance(news_list, list)

    # 9. Forum route
    forum_list = forum.get_forum_messages(sim_id, db=db_session)
    assert isinstance(forum_list, list)

    # 10. Loans route
    loan_list = loans.get_loans(sim_id, db=db_session)
    assert isinstance(loan_list, list)

    # 11. Analytics route
    analytics_res = analytics.get_analytics(sim_id, db_session)
    assert analytics_res.simulation_id == sim_id

    # 12. Reports route
    report_res = reports.export_report(sim_id, "trades", "csv", db_session)
    assert report_res.format == "csv"

    # 13. Logs route
    log_list = logs.get_logs(db=db_session)
    assert isinstance(log_list, list)

    # 14. Dashboard route
    dash_res = dashboard.get_dashboard_summary(db_session)
    assert dash_res.total_simulations >= 1
