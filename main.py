import argparse
import random
import pandas as pd
import openai
import tiktoken

import util
from agent import Agent
from secretary import Secretary
from stock import Stock
from log.custom_logger import log
from record import create_stock_record, create_trade_record, AgentRecordDaily, create_agentses_record

def get_agent(all_agents, order):
    for agent in all_agents:
        if agent.order == order:
            return agent
    return None

def handle_action(action, stock_deals, all_agents, stock, session, event_callback=None):
    # action = JSON{"agent": 1, "action_type": "buy"|"sell", "stock": "A"|"B", "amount": 10, "price": 10}
    try:
        if action["action_type"] == "buy":
            # Continuous double-auction: match against sitting sell orders (sorted lowest ask first)
            stock_deals["sell"].sort(key=lambda s: s["price"])
            for sell_action in stock_deals["sell"][:]:
                if action["price"] >= sell_action["price"]:
                    # Clears at the sitting ask order's price
                    exec_price = sell_action["price"]
                    close_amount = min(action["amount"], sell_action["amount"])
                    get_agent(all_agents, action["agent"]).buy_stock(stock.name, close_amount, exec_price)
                    if not sell_action["agent"] == -1:  # Market maker / issuing
                        get_agent(all_agents, sell_action["agent"]).sell_stock(stock.name, close_amount, exec_price)
                    stock.add_session_deal({"price": exec_price, "amount": close_amount})
                    create_trade_record(action["date"], session, stock.name, action["agent"], sell_action["agent"],
                                        close_amount, exec_price)
                    if event_callback:
                        event_callback("TRADE_EXECUTED", {
                            "day": action["date"],
                            "session": session,
                            "ticker": stock.name,
                            "buyer_id": action["agent"],
                            "seller_id": sell_action["agent"],
                            "amount": close_amount,
                            "price": exec_price,
                            "turnover": round(close_amount * exec_price, 2),
                            "reasoning": action.get("reasoning", "Bid matched sitting ask order."),
                            "risk_assessment": action.get("risk_assessment", "Moderate"),
                            "confidence": action.get("confidence", 85.0),
                        })

                    if action["amount"] > close_amount:  # Partial fill, continue matching
                        log.logger.info(f"ACTION - BUY:{action['agent']}, SELL:{sell_action['agent']}, "
                                        f"STOCK:{stock.name}, PRICE:{exec_price}, AMOUNT:{close_amount}")
                        stock_deals["sell"].remove(sell_action)
                        action["amount"] -= close_amount
                    else:  # Full fill
                        log.logger.info(f"ACTION - BUY:{action['agent']}, SELL:{sell_action['agent']}, "
                                        f"STOCK:{stock.name}, PRICE:{exec_price}, AMOUNT:{close_amount}")
                        sell_action["amount"] -= close_amount
                        return
            # Unfilled portion sits on the buy side
            stock_deals["buy"].append(action)

        else:
            # Continuous double-auction: match against sitting buy orders (sorted highest bid first)
            stock_deals["buy"].sort(key=lambda b: b["price"], reverse=True)
            for buy_action in stock_deals["buy"][:]:
                if action["price"] <= buy_action["price"]:
                    # Clears at the sitting bid order's price
                    exec_price = buy_action["price"]
                    close_amount = min(action["amount"], buy_action["amount"])
                    get_agent(all_agents, action["agent"]).sell_stock(stock.name, close_amount, exec_price)
                    get_agent(all_agents, buy_action["agent"]).buy_stock(stock.name, close_amount, exec_price)
                    stock.add_session_deal({"price": exec_price, "amount": close_amount})
                    create_trade_record(action["date"], session, stock.name, buy_action["agent"], action["agent"],
                                        close_amount, exec_price)
                    if event_callback:
                        event_callback("TRADE_EXECUTED", {
                            "day": action["date"],
                            "session": session,
                            "ticker": stock.name,
                            "buyer_id": buy_action["agent"],
                            "seller_id": action["agent"],
                            "amount": close_amount,
                            "price": exec_price,
                            "turnover": round(close_amount * exec_price, 2),
                            "reasoning": action.get("reasoning", "Ask matched sitting bid order."),
                            "risk_assessment": action.get("risk_assessment", "Moderate"),
                            "confidence": action.get("confidence", 85.0),
                        })

                    if action["amount"] > close_amount:  # Partial fill
                        log.logger.info(f"ACTION - BUY:{buy_action['agent']}, SELL:{action['agent']}, "
                                        f"STOCK:{stock.name}, PRICE:{exec_price}, AMOUNT:{close_amount}")
                        stock_deals["buy"].remove(buy_action)
                        action["amount"] -= close_amount
                    else:  # Full fill
                        log.logger.info(f"ACTION - BUY:{buy_action['agent']}, SELL:{action['agent']}, "
                                        f"STOCK:{stock.name}, PRICE:{exec_price}, AMOUNT:{close_amount}")
                        buy_action["amount"] -= close_amount
                        return
            stock_deals["sell"].append(action)
    except Exception as e:
        log.logger.error(f"handle_action error: {e}")
        return


def simulation(args, event_callback=None, pause_event=None, stop_event=None):
    import time
    agents_num = getattr(args, "agents", None) or util.AGENTS_NUM
    total_date = getattr(args, "days", None) or util.TOTAL_DATE
    total_session = getattr(args, "sessions", None) or util.TOTAL_SESSION

    if event_callback:
        event_callback("SIMULATION_STARTED", {
            "total_agents": agents_num,
            "total_days": total_date,
            "total_sessions": total_session,
            "model": args.model
        })

    # init
    stocks = getattr(args, "stocks", None) or ["AAPL", "MSFT"]
    ticker_a = stocks[0] if len(stocks) > 0 else "AAPL"
    ticker_b = stocks[1] if len(stocks) > 1 else "MSFT"
    scenario_type = getattr(args, "scenario_type", "event-driven") or "event-driven"
    custom_events = getattr(args, "custom_events", []) or []

    secretary = Secretary(args.model)
    stock_a = Stock(ticker_a, util.STOCK_A_INITIAL_PRICE, 0, is_new=False)
    stock_b = Stock(ticker_b, util.STOCK_B_INITIAL_PRICE, 0, is_new=False)
    all_agents = []
    log.logger.debug("Agents initial...")
    for i in range(0, agents_num):  # agents start from 0, -1 refers to admin
        agent = Agent(i, stock_a.get_price(), stock_b.get_price(), secretary, args.model)
        all_agents.append(agent)
        log.logger.debug("cash: {}, stock a: {}, stock b:{}, debt: {}".format(agent.cash, agent.stock_a_amount,
                                                                              agent.stock_b_amount, agent.loans))
        if event_callback:
            event_callback("AGENT_INIT", {
                "agent_order": agent.order,
                "character": agent.character,
                "cash": agent.cash,
                "stock_a": agent.stock_a_amount,
                "stock_b": agent.stock_b_amount,
                "debt": agent.get_total_loan() if hasattr(agent, 'get_total_loan') else 0.0,
            })

    # start simulation
    last_day_forum_message = []
    stock_a_deals = {"sell": [], "buy": []}
    stock_b_deals = {"sell": [], "buy": []}

    # Schedule external factors: Macroeconomic policy events & Corporate earnings releases
    if total_date >= 78:
        season_report_days = list(util.SEASON_REPORT_DAYS)
        event_1_day = util.EVENT_1_DAY
        event_2_day = util.EVENT_2_DAY
    else:
        # Dynamically scale for shorter simulation runs so external factors can be evaluated
        earnings_day = max(2, total_date // 3)
        season_report_days = [earnings_day]
        event_1_day = max(2, (total_date * 2) // 3)
        event_2_day = max(3, total_date - 1) if total_date >= 5 else None

    log.logger.debug("--------Simulation Start!--------")
    for date in range(1, total_date + 1):
        if stop_event and stop_event.is_set():
            log.logger.info("Simulation stop requested.")
            if event_callback:
                event_callback("SIMULATION_STOPPED", {"day": date})
            return

        if pause_event:
            while pause_event.is_set() and not (stop_event and stop_event.is_set()):
                time.sleep(0.5)

        log.logger.debug(f"--------DAY {date}---------")
        stock_a_deals["sell"].clear()
        stock_a_deals["buy"].clear()
        stock_b_deals["buy"].clear()
        stock_b_deals["sell"].clear()

        # Day 1 initial market opening background
        if date == 1 and event_callback:
            event_callback("MACRO_EVENT", {
                "day": 1,
                "event_name": "Market Opening & Company Baseline",
                "category": "Macroeconomic",
                "affected_stocks": f"{stock_a.name}, {stock_b.name}",
                "sentiment": "NEUTRAL",
                "severity": "LOW",
                "message": f"Market opened for {stock_a.name} (Stable fundamentals) and {stock_b.name} (High growth). Benchmark central bank rates established.",
                "loan_rates": str(util.LOAN_RATE)
            })

        # check if an agent needs to repay loans
        for agent in all_agents[:]:
            agent.chat_history.clear()
            agent.loan_repayment(date)

        if date in util.REPAYMENT_DAYS:
            for agent in all_agents[:]:
                agent.interest_payment()

        for agent in all_agents[:]:
            if agent.is_bankrupt:
                quit_sig = agent.bankrupt_process(stock_a.get_price(), stock_b.get_price())
                if quit_sig:
                    agent.quit = True
                    all_agents.remove(agent)

        # External Events (Only in Event-Driven Scenario)
        if scenario_type == "event-driven":
            # 1. Quarterly Corporate Earnings Release
            if date in season_report_days:
                idx = season_report_days.index(date) % len(util.FINANCIAL_REPORT_A)
                rep_a = stock_a.gen_financial_report(idx)
                rep_b = stock_b.gen_financial_report(idx)
                last_day_forum_message.append({
                    "name": -1,
                    "message": f"[Quarterly Earnings Release] {stock_a.name}: {rep_a} | {stock_b.name}: {rep_b}"
                })
                if event_callback:
                    event_callback("MACRO_EVENT", {
                        "day": date,
                        "event_name": f"Corporate Earnings Release (Q{idx + 1})",
                        "category": "Company Fundamentals",
                        "affected_stocks": f"{stock_a.name}, {stock_b.name}",
                        "sentiment": "POSITIVE",
                        "severity": "MODERATE",
                        "message": f"{stock_a.name}: {rep_a} | {stock_b.name}: {rep_b}",
                        "loan_rates": str(util.LOAN_RATE)
                    })

            # 2. Special macroeconomic policy events
            if date == event_1_day:
                util.LOAN_RATE = util.EVENT_1_LOAN_RATE
                last_day_forum_message.append({"name": -1, "message": util.EVENT_1_MESSAGE})
                if event_callback:
                    event_callback("MACRO_EVENT", {
                        "day": date,
                        "event_name": "Reserve Requirement Ratio Reduction",
                        "category": "Government and Policy",
                        "affected_stocks": "ALL",
                        "sentiment": "POSITIVE",
                        "severity": "HIGH",
                        "message": util.EVENT_1_MESSAGE,
                        "loan_rates": str(util.EVENT_1_LOAN_RATE)
                    })
            if event_2_day and date == event_2_day:
                util.LOAN_RATE = util.EVENT_2_LOAN_RATE
                last_day_forum_message.append({"name": -1, "message": util.EVENT_2_MESSAGE})
                if event_callback:
                    event_callback("MACRO_EVENT", {
                        "day": date,
                        "event_name": "Interest Rate Increase",
                        "category": "Macroeconomic",
                        "affected_stocks": "ALL",
                        "sentiment": "NEGATIVE",
                        "severity": "HIGH",
                        "message": util.EVENT_2_MESSAGE,
                        "loan_rates": str(util.EVENT_2_LOAN_RATE)
                    })

            # 3. User-defined custom events
            for cevent in custom_events:
                if cevent.get("round_day") == date:
                    msg = f"[{cevent.get('category', 'Custom')}] {cevent.get('title')}: {cevent.get('description')}"
                    last_day_forum_message.append({"name": -1, "message": msg})
                    if event_callback:
                        event_callback("MACRO_EVENT", {
                            "day": date,
                            "event_name": cevent.get("title", "Custom Market Event"),
                            "category": cevent.get("category", "Custom Event"),
                            "affected_stocks": cevent.get("affected_stocks", "ALL"),
                            "sentiment": cevent.get("sentiment", "NEUTRAL"),
                            "severity": cevent.get("severity", "MODERATE"),
                            "message": cevent.get("description", ""),
                            "loan_rates": str(util.LOAN_RATE)
                        })

        # agent decide whether to loan
        daily_agent_records = []
        for agent in all_agents:
            loan = agent.plan_loan(date, stock_a.get_price(), stock_b.get_price(), last_day_forum_message)
            daily_agent_records.append(AgentRecordDaily(date, agent.order, loan))
            if event_callback:
                event_callback("LOAN_DECISION", {
                    "agent_id": agent.order,
                    "day": date,
                    "loan": loan
                })

        for session in range(1, total_session + 1):
            log.logger.debug(f"SESSION {session}")
            # 随机定义交易顺序
            sequence = list(range(len(all_agents)))
            random.shuffle(sequence)
            for i in sequence:
                agent = all_agents[i]

                action = agent.plan_stock(date, session, stock_a, stock_b, stock_a_deals, stock_b_deals, season_report_days=season_report_days)
                proper, cash, valua_a, value_b = agent.get_proper_cash_value(stock_a.get_price(), stock_b.get_price())
                create_agentses_record(agent.order, date, session, proper, cash, valua_a, value_b, action)
                action["agent"] = agent.order
                action["date"] = date
                if event_callback:
                    event_callback("ORDER_INTENT", {
                        "agent_id": agent.order,
                        "day": date,
                        "session": session,
                        "action": action
                    })
                if action["action_type"] not in ["no", "hold"]:
                    if action["stock"] in ['A', stock_a.name]:
                        handle_action(action, stock_a_deals, all_agents, stock_a, session, event_callback=event_callback)
                    else:
                        handle_action(action, stock_b_deals, all_agents, stock_b, session, event_callback=event_callback)

            # 交易时段结束，更新股票价格
            stock_a.update_price(date)
            stock_b.update_price(date)
            create_stock_record(date, session, stock_a.get_price(), stock_b.get_price())
            if event_callback:
                event_callback("SESSION_CLOSED", {
                    "day": date,
                    "session": session,
                    "stock_a_price": stock_a.get_price(),
                    "stock_b_price": stock_b.get_price()
                })

        # agent预测明天行动
        for idx, agent in enumerate(all_agents):
            estimation = agent.next_day_estimate()
            log.logger.info("Agent {} tomorrow estimation: {}".format(agent.order, estimation))
            if idx >= len(daily_agent_records):
                break
            daily_agent_records[idx].add_estimate(estimation)
            daily_agent_records[idx].write_to_excel()
        daily_agent_records.clear()

        # 交易日结束，论坛信息更新
        last_day_forum_message.clear()
        log.logger.debug(f"DAY {date} ends, display forum messages...")
        for agent in all_agents:
            chat_history = agent.chat_history
            message = agent.post_message(stock_a.get_price(), stock_b.get_price())
            log.logger.info("Agent {} says: {}".format(agent.order, message))
            last_day_forum_message.append({"name": agent.order, "message": message})
            if event_callback:
                event_callback("FORUM_POST", {
                    "agent_id": agent.order,
                    "day": date,
                    "message": message
                })

        # Emit portfolio snapshot and day completed event
        if event_callback:
            for agent in all_agents:
                proper, cash, valua_a, valua_b = agent.get_proper_cash_value(stock_a.get_price(), stock_b.get_price())
                debt_val = agent.get_total_loan() if hasattr(agent, 'get_total_loan') else 0.0
                event_callback("PORTFOLIO_SNAPSHOT", {
                    "agent_id": agent.order,
                    "day": date,
                    "session": total_session,
                    "cash": cash,
                    "stock_a_shares": agent.stock_a_amount,
                    "stock_a_value": valua_a,
                    "stock_b_shares": agent.stock_b_amount,
                    "stock_b_value": valua_b,
                    "total_property": proper,
                    "debt": debt_val,
                })
            event_callback("DAY_COMPLETED", {"day": date, "total_days": total_date})

    if event_callback:
        event_callback("SIMULATION_COMPLETED", {"total_days": total_date})



    log.logger.debug("--------Simulation finished!--------")
    log.logger.debug("--------Agents action history--------")
    # for agent in all_agents:
    #     log.logger.debug(f"Agent {agent.order} action history:")
    #     log.logger.info(agent.action_history)
    # log.logger.debug("--------Stock deal history--------")
    # for stock in [stock_a, stock_b]:
    #     log.logger.debug(f"Stock {stock.name} deal history:")
    #     log.logger.info(stock.history)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=str, default="gemini-1.5-flash", help="model name")
    parser.add_argument("--agents", type=int, default=util.AGENTS_NUM, help="number of agents")
    parser.add_argument("--days", type=int, default=util.TOTAL_DATE, help="simulation days")
    parser.add_argument("--sessions", type=int, default=util.TOTAL_SESSION, help="sessions per day")
    args = parser.parse_args()
    simulation(args)
