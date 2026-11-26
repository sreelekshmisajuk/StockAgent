from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models import StockSnapshot, MacroEvent, TradeOrder, SimulationRun
import util

class MarketService:
    def get_stocks_overview(self, db: Session, simulation_id: str) -> List[Dict]:
        # Check actual tickers present in snapshots
        snap_tickers = [
            r[0].upper() for r in db.query(StockSnapshot.ticker).filter(
                StockSnapshot.simulation_id == simulation_id
            ).distinct().all() if r[0]
        ]
        
        if snap_tickers:
            target_tickers = snap_tickers
        else:
            sim = db.query(SimulationRun).filter(SimulationRun.id == simulation_id).first()
            raw_stocks = [s.strip().upper() for s in (sim.stocks.split(",") if sim and sim.stocks else ["A", "B"])]
            target_tickers = raw_stocks[:2] if len(raw_stocks) >= 2 else (raw_stocks or ["A", "B"])
            
        overview = []

        initial_prices = {
            "A": util.STOCK_A_INITIAL_PRICE,
            "B": util.STOCK_B_INITIAL_PRICE
        }

        for ticker in target_tickers[:4]:
            latest = db.query(StockSnapshot).filter(
                StockSnapshot.simulation_id == simulation_id,
                func.upper(StockSnapshot.ticker).in_([ticker, f"STOCK_{ticker}"])
            ).order_by(StockSnapshot.day.desc(), StockSnapshot.session.desc()).first()

            deals_count = db.query(TradeOrder).filter(
                TradeOrder.simulation_id == simulation_id,
                func.upper(TradeOrder.ticker).in_([ticker, f"STOCK_{ticker}"])
            ).count()

            init_p = initial_prices.get(ticker, util.STOCK_A_INITIAL_PRICE if ticker in ["A", "AAPL"] else util.STOCK_B_INITIAL_PRICE)
            curr_p = latest.price if latest else init_p
            pct = ((curr_p - init_p) / init_p * 100.0) if init_p else 0.0

            overview.append({
                "ticker": ticker,
                "current_price": round(curr_p, 2),
                "initial_price": round(init_p, 2),
                "change_percentage": round(pct, 2),
                "deals_count": deals_count
            })

        return overview

    def get_all_snapshots(self, db: Session, simulation_id: str, ticker: Optional[str] = None) -> List[StockSnapshot]:
        query = db.query(StockSnapshot).filter(StockSnapshot.simulation_id == simulation_id)
        if ticker:
            query = query.filter(func.upper(StockSnapshot.ticker) == ticker.upper())
        return query.order_by(StockSnapshot.day.asc(), StockSnapshot.session.asc()).all()

    def get_stock_history(self, db: Session, simulation_id: str, ticker: str) -> List[StockSnapshot]:
        return db.query(StockSnapshot).filter(
            StockSnapshot.simulation_id == simulation_id,
            func.upper(StockSnapshot.ticker) == ticker.upper()
        ).order_by(StockSnapshot.day.asc(), StockSnapshot.session.asc()).all()

    def get_market_events(self, db: Session, simulation_id: str) -> List[MacroEvent]:
        return db.query(MacroEvent).filter(
            MacroEvent.simulation_id == simulation_id
        ).order_by(MacroEvent.day.asc()).all()

    def get_financial_reports(self, db: Session, simulation_id: str) -> Dict:
        return {
            "simulation_id": simulation_id,
            "companies": [
                {
                    "ticker": "A",
                    "company_name": "Company A (Chemicals & Core Manufacturing)",
                    "sector": "Industrial & Materials",
                    "summary": {
                        "gross_margin": "41.05%",
                        "net_profit_margin": "19.11%",
                        "operating_margin": "20.45%",
                        "return_on_investment": "12.4%",
                        "wacc": "8.85%",
                        "cost_of_debt": "5.5%",
                        "sustainable_growth_rate": "5.0%"
                    },
                    "quarterly_statements": [
                        {"quarter": "Q1 03/23", "revenue": 4483.99, "gross_profit": 1840.67, "operating_income": 917.47, "net_income": 856.67, "growth_yoy": "9.49%"},
                        {"quarter": "Q2 06/23", "revenue": 4417.79, "gross_profit": 1576.26, "operating_income": 538.97, "net_income": 493.95, "growth_yoy": "7.38%"},
                        {"quarter": "Q3 09/23", "revenue": 4041.30, "gross_profit": 1513.46, "operating_income": 768.25, "net_income": 724.36, "growth_yoy": "8.70%"},
                        {"quarter": "Q4 12/23", "revenue": 5024.04, "gross_profit": 2133.70, "operating_income": 1115.33, "net_income": 1031.21, "growth_yoy": "7.75%"}
                    ]
                },
                {
                    "ticker": "B",
                    "company_name": "Company B (Technology & Software)",
                    "sector": "Information Technology",
                    "summary": {
                        "gross_margin": "31.21%",
                        "net_profit_margin": "17.04%",
                        "operating_margin": "18.35%",
                        "return_on_investment": "15.8%",
                        "wacc": "8.79%",
                        "cost_of_debt": "5.5%",
                        "sustainable_growth_rate": "5.0%"
                    },
                    "quarterly_statements": [
                        {"quarter": "Q1 03/23", "revenue": 1319.94, "gross_profit": 411.95, "operating_income": 234.95, "net_income": 224.92, "growth_yoy": "19.96%"},
                        {"quarter": "Q2 06/23", "revenue": 1096.70, "gross_profit": 342.82, "operating_income": 195.21, "net_income": 186.77, "growth_yoy": "19.86%"},
                        {"quarter": "Q3 09/23", "revenue": 1676.70, "gross_profit": 529.49, "operating_income": 289.87, "net_income": 278.33, "growth_yoy": "18.21%"},
                        {"quarter": "Q4 12/23", "revenue": 1075.13, "gross_profit": 348.45, "operating_income": 191.37, "net_income": 181.16, "growth_yoy": "15.98%"}
                    ]
                }
            ]
        }

    def get_live_stock_quote(self, db: Session, ticker: str, currency: str = "INR", simulation_id: Optional[str] = None) -> Dict:
        norm_ticker = ticker.strip().upper()
        usd_to_inr = 84.50

        # 1. Simulation Stocks (Stock A and Stock B)
        if norm_ticker in ["A", "STOCK_A", "B", "STOCK_B"]:
            is_a = "A" in norm_ticker
            tick_char = "A" if is_a else "B"
            base_p = util.STOCK_A_INITIAL_PRICE if is_a else util.STOCK_B_INITIAL_PRICE
            co_name = "Company A (Chemicals & Industrial)" if is_a else "Company B (Technology & Software)"

            snaps = []
            if simulation_id:
                snaps = db.query(StockSnapshot).filter(
                    StockSnapshot.simulation_id == simulation_id,
                    func.upper(StockSnapshot.ticker).in_([tick_char, f"STOCK_{tick_char}"])
                ).order_by(StockSnapshot.day.asc(), StockSnapshot.session.asc()).all()

            candles = []
            if snaps:
                for s in snaps:
                    o = s.open_price or s.price
                    c = s.close_price or s.price
                    h = s.high_price or round(max(o, c) * 1.008, 2)
                    l = s.low_price or round(min(o, c) * 0.992, 2)
                    v = s.volume or s.deals_count or 1500
                    is_bullish = c >= o
                    candles.append({
                        "time": f"Day {s.day} S{s.session}",
                        "open": round(o, 2),
                        "high": round(h, 2),
                        "low": round(l, 2),
                        "close": round(c, 2),
                        "volume": v,
                        "is_bullish": is_bullish,
                        "color": "#10b981" if is_bullish else "#ef4444"
                    })
            else:
                for d in range(1, 6):
                    for sess in [1, 2]:
                        variance = (d * 0.42 - sess * 0.18) if is_a else (d * 0.78 - sess * 0.32)
                        o = round(base_p + variance - 0.22, 2)
                        c = round(base_p + variance + 0.28, 2)
                        h = round(max(o, c) + 0.35, 2)
                        l = round(min(o, c) - 0.30, 2)
                        is_bullish = c >= o
                        candles.append({
                            "time": f"Day {d} S{sess}",
                            "open": o,
                            "high": h,
                            "low": l,
                            "close": c,
                            "volume": 2000 + d * 400 + sess * 150,
                            "is_bullish": is_bullish,
                            "color": "#10b981" if is_bullish else "#ef4444"
                        })

            latest = candles[-1]
            prev = candles[-2] if len(candles) > 1 else candles[0]
            chg = round(latest["close"] - prev["close"], 2)
            pct = round((chg / prev["close"] * 100), 2) if prev["close"] else 0.0

            return {
                "ticker": f"Stock {tick_char}",
                "symbol": tick_char,
                "company_name": co_name,
                "currency": "INR",
                "current_price": latest["close"],
                "open_price": latest["open"],
                "high_price": latest["high"],
                "low_price": latest["low"],
                "previous_close": prev["close"],
                "change": chg,
                "change_percent": pct,
                "volume": latest["volume"],
                "candlesticks": candles
            }

        # 2. Real-World Live Market Stocks
        company_names = {
            "AAPL": "Apple Inc.",
            "MSFT": "Microsoft Corporation",
            "GOOGL": "Alphabet Inc.",
            "TSLA": "Tesla, Inc.",
            "NVDA": "NVIDIA Corporation",
            "AMZN": "Amazon.com, Inc.",
            "INFY": "Infosys Limited",
            "RELIANCE.NS": "Reliance Industries Limited",
            "TCS.NS": "Tata Consultancy Services"
        }
        co_name = company_names.get(norm_ticker, f"{norm_ticker} Corporation")

        try:
            import requests
            from datetime import datetime
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{norm_ticker}?interval=1d&range=1mo"
            headers = {"User-Agent": "Mozilla/5.0"}
            r = requests.get(url, headers=headers, timeout=2.0)
            if r.status_code == 200:
                data = r.json()
                res = data["chart"]["result"][0]
                timestamps = res.get("timestamp", [])
                q = res["indicators"]["quote"][0]
                opens = q.get("open", [])
                highs = q.get("high", [])
                lows = q.get("low", [])
                closes = q.get("close", [])
                vols = q.get("volume", [])

                rate = usd_to_inr if currency == "INR" and not norm_ticker.endswith(".NS") else 1.0
                candles = []
                for t, o, h, l, c, v in zip(timestamps, opens, highs, lows, closes, vols):
                    if None not in (o, h, l, c):
                        c_o = round(float(o) * rate, 2)
                        c_h = round(float(h) * rate, 2)
                        c_l = round(float(l) * rate, 2)
                        c_c = round(float(c) * rate, 2)
                        is_bull = c_c >= c_o
                        candles.append({
                            "time": datetime.fromtimestamp(t).strftime("%d %b"),
                            "open": c_o,
                            "high": c_h,
                            "low": c_l,
                            "close": c_c,
                            "volume": int(v or 0),
                            "is_bullish": is_bull,
                            "color": "#10b981" if is_bull else "#ef4444"
                        })

                if candles:
                    latest = candles[-1]
                    prev = candles[-2] if len(candles) > 1 else candles[0]
                    chg = round(latest["close"] - prev["close"], 2)
                    pct = round((chg / prev["close"] * 100), 2) if prev["close"] else 0.0

                    return {
                        "ticker": norm_ticker,
                        "symbol": norm_ticker,
                        "company_name": co_name,
                        "currency": currency,
                        "current_price": latest["close"],
                        "open_price": latest["open"],
                        "high_price": latest["high"],
                        "low_price": latest["low"],
                        "previous_close": prev["close"],
                        "change": chg,
                        "change_percent": pct,
                        "volume": latest["volume"],
                        "candlesticks": candles
                    }
        except Exception:
            pass

        # 3. Fallback calibrated market quotes if network offline
        base_quotes = {
            "AAPL": 228.50,
            "MSFT": 415.20,
            "GOOGL": 172.80,
            "TSLA": 218.40,
            "NVDA": 138.60,
            "AMZN": 186.40,
            "INFY": 1890.00,
            "RELIANCE.NS": 2980.00
        }
        b_usd = base_quotes.get(norm_ticker, 160.0)
        rate = usd_to_inr if currency == "INR" and not norm_ticker.endswith(".NS") else 1.0
        base_val = round(b_usd * rate, 2)

        import random
        candles = []
        cur = base_val * 0.94
        for i in range(16):
            delta = (random.random() - 0.47) * (base_val * 0.024)
            o = round(cur, 2)
            c = round(cur + delta, 2)
            h = round(max(o, c) + abs(delta * 0.6), 2)
            l = round(min(o, c) - abs(delta * 0.6), 2)
            cur = c
            is_bull = c >= o
            candles.append({
                "time": f"Day {i+1}",
                "open": o,
                "high": h,
                "low": l,
                "close": c,
                "volume": random.randint(18000000, 52000000),
                "is_bullish": is_bull,
                "color": "#10b981" if is_bull else "#ef4444"
            })

        latest = candles[-1]
        prev = candles[-2]
        chg = round(latest["close"] - prev["close"], 2)
        pct = round((chg / prev["close"] * 100), 2)

        return {
            "ticker": norm_ticker,
            "symbol": norm_ticker,
            "company_name": co_name,
            "currency": currency,
            "current_price": latest["close"],
            "open_price": latest["open"],
            "high_price": latest["high"],
            "low_price": latest["low"],
            "previous_close": prev["close"],
            "change": chg,
            "change_percent": pct,
            "volume": latest["volume"],
            "candlesticks": candles
        }

market_service = MarketService()
