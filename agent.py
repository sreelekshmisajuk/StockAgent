import time
import openai
import tiktoken
import random
import requests
import google.generativeai as genai

import util
from log.custom_logger import log

from prompt.agent_prompt import *
from procoder.functional import format_prompt
from procoder.prompt import *
from secretary import Secretary
from stock import Stock


def random_init(stock_a_initial, stock_b_initial):
    stock_a, stock_b, cash, debt_amount = 0.0, 0.0, 0.0, 0.0
    while stock_a * stock_a_initial + stock_b * stock_b_initial + cash < util.MIN_INITIAL_PROPERTY \
            or stock_a * stock_a_initial + stock_b * stock_b_initial + cash > util.MAX_INITIAL_PROPERTY \
            or debt_amount > stock_a * stock_a_initial + stock_b * stock_b_initial + cash:
        stock_a = int(random.uniform(0, util.MAX_INITIAL_PROPERTY / stock_a_initial))
        stock_b = int(random.uniform(0, util.MAX_INITIAL_PROPERTY / stock_b_initial))
        cash = random.uniform(0, util.MAX_INITIAL_PROPERTY)
        debt_amount = random.uniform(0, util.MAX_INITIAL_PROPERTY)
    debt = {
        "loan": "yes",
        "amount": debt_amount,
        "loan_type": random.randint(0, len(util.LOAN_TYPE) - 1),
        "repayment_date": random.choice(util.REPAYMENT_DAYS)
    }
    return stock_a, stock_b, cash, debt
# def random_init(stock_initial_price):
#     stock, cash, debt_amount = 0.0, 0.0, 0.0
#     while stock * stock_initial_price + cash < util.MIN_INITIAL_PROPERTY \
#             or stock * stock_initial_price + cash > util.MAX_INITIAL_PROPERTY \
#             or debt_amount > stock * stock_initial_price + cash:
#         stock = int(random.uniform(0, util.MAX_INITIAL_PROPERTY / stock_initial_price))
#         cash = random.uniform(0, util.MAX_INITIAL_PROPERTY)
#         debt_amount = random.uniform(0, util.MAX_INITIAL_PROPERTY)
#     debt = {
#         "loan": "yes",
#         "amount": debt_amount,
#         "loan_type": random.randint(0, len(util.LOAN_TYPE)),
#         "repayment_date": random.choice(util.REPAYMENT_DAYS)
#     }
#     return stock, cash, debt


class Agent:
    def __init__(self, i, stock_a_price, stock_b_price, secretary, model):
        self.order = i
        self.secretary = secretary
        self.model = model
        personas = ["Conservative", "Aggressive", "Fundamental", "News-Driven", "Technical"]
        self.character = personas[i % len(personas)]

        self.stock_a_amount, self.stock_b_amount, self.cash, init_debt = random_init(stock_a_price, stock_b_price)
        self.init_proper = self.get_total_proper(stock_a_price, stock_b_price)  # 初始资产 后续借贷不超过初始资产

        self.action_history = [[] for _ in range(util.TOTAL_DATE)]
        self.chat_history = []
        self.loans = [init_debt]
        self.is_bankrupt = False
        self.quit = False

    def has_api_key(self) -> bool:
        model_lower = (self.model or "").lower()
        if 'gemini' in model_lower:
            return bool(util.GOOGLE_API_KEY)
        else:
            return bool(util.OPENAI_API_KEY or util.YUNWU_API_KEY)

    def _heuristic_loan(self, date, max_loan):
        if max_loan <= 1000:
            return {"loan": "no"}
        prob = 0.15
        if self.character == "Aggressive":
            prob = 0.60
        elif self.character == "News-Driven":
            prob = 0.45
        elif self.character == "Technical":
            prob = 0.35
        elif self.character == "Fundamental":
            prob = 0.20
        elif self.character == "Conservative":
            prob = 0.05

        if util.LOAN_RATE[0] <= 0.024:
            prob += 0.20

        if random.random() < prob:
            borrow_amount = float(min(max_loan * 0.30, random.choice([5000, 10000, 25000, 50000, 75000])))
            borrow_amount = max(1000.0, round(borrow_amount, -2))
            loan_type = random.choice([0, 1, 2])
            return {"loan": "yes", "loan_type": loan_type, "amount": borrow_amount}
        return {"loan": "no"}

    def _heuristic_action(self, date, session, stock_a, stock_b, stock_a_deals, stock_b_deals):
        mid_a = util.ideal_price_midpoint("A", date)
        mid_b = util.ideal_price_midpoint("B", date)
        p_a = stock_a.get_price()
        p_b = stock_b.get_price()

        chosen_stock = "B" if (self.character in ["Aggressive", "News-Driven"] or random.random() > 0.5) else "A"
        current_p = p_a if chosen_stock == "A" else p_b
        target_mid = mid_a if chosen_stock == "A" else mid_b
        current_shares = self.stock_a_amount if chosen_stock == "A" else self.stock_b_amount

        deals = stock_a_deals if chosen_stock == "A" else stock_b_deals
        price_diff_ratio = (target_mid - current_p) / target_mid

        # 1. Conservative Investor
        if self.character == "Conservative":
            if price_diff_ratio > 0.02 and self.cash > current_p * 5:
                price = round(current_p * 1.01, 2)
                amt = min(int(self.cash / (price * 2)), random.randint(10, 30))
                if amt > 0:
                    return {
                        "action_type": "buy", "stock": chosen_stock, "amount": amt, "price": price,
                        "reasoning": f"Conservative valuation buffer met. Stock {chosen_stock} price ₹{current_p:.2f} trades below DCF intrinsic floor; supported by healthy 41.05% gross margin.",
                        "risk_assessment": "Low", "confidence": 92.0
                    }
            elif current_shares >= 10 and price_diff_ratio < -0.02:
                price = round(current_p * 0.99, 2)
                amt = min(current_shares, random.randint(5, 20))
                return {
                    "action_type": "sell", "stock": chosen_stock, "amount": amt, "price": price,
                    "reasoning": f"Locking in defensive gains on Stock {chosen_stock} at ₹{current_p:.2f} as price approaches upper resistance band. Preserving cash reserves.",
                    "risk_assessment": "Low", "confidence": 91.0
                }
            return {
                "action_type": "hold", "stock": chosen_stock, "amount": 0, "price": current_p,
                "reasoning": "Elevated market volatility. Preserving liquid cash capital and holding defensive positions.",
                "risk_assessment": "Low", "confidence": 90.0
            }

        # 2. Aggressive Investor
        elif self.character == "Aggressive":
            if self.cash > current_p * 3 and random.random() > 0.25:
                price = round(current_p * random.uniform(1.005, 1.03), 2)
                amt = min(int(self.cash / price), random.randint(20, 60))
                if amt > 0:
                    return {
                        "action_type": "buy", "stock": chosen_stock, "amount": amt, "price": price,
                        "reasoning": f"Aggressive expansion into high-beta growth opportunity on Stock {chosen_stock} (₹{current_p:.2f}); leveraging BBS bullish forum cues and RRR monetary easing.",
                        "risk_assessment": "High", "confidence": 85.0
                    }
            elif current_shares >= 8:
                price = round(current_p * random.uniform(0.97, 0.995), 2)
                amt = random.randint(8, min(current_shares, 40))
                return {
                    "action_type": "sell", "stock": chosen_stock, "amount": amt, "price": price,
                    "reasoning": f"Taking short-term profits on momentum rally for Stock {chosen_stock} to reallocate into breakout dips.",
                    "risk_assessment": "High", "confidence": 80.0
                }
            return {
                "action_type": "hold", "stock": chosen_stock, "amount": 0, "price": current_p,
                "reasoning": "Maintaining high-beta equity exposure while tracking session order book liquidity depth.",
                "risk_assessment": "Medium", "confidence": 75.0
            }

        # 3. Fundamental Investor
        elif self.character == "Fundamental":
            if price_diff_ratio >= 0.01 and self.cash > current_p * 4:
                price = round(current_p * 1.015, 2)
                amt = min(int(self.cash / (price * 1.5)), random.randint(15, 45))
                if amt > 0:
                    return {
                        "action_type": "buy", "stock": chosen_stock, "amount": amt, "price": price,
                        "reasoning": f"Fundamental valuation discount of {abs(price_diff_ratio)*100:.1f}% indicates margin of safety. Quarterly statement shows strong operating margin (20.45%) and revenue growth.",
                        "risk_assessment": "Medium", "confidence": 88.0
                    }
            elif price_diff_ratio <= -0.01 and current_shares >= 5:
                price = round(current_p * 0.985, 2)
                amt = min(current_shares, random.randint(10, 30))
                return {
                    "action_type": "sell", "stock": chosen_stock, "amount": amt, "price": price,
                    "reasoning": f"Stock {chosen_stock} trading at a premium to discounted cash flow valuation relative to sustainable growth rate (5.0%).",
                    "risk_assessment": "Low", "confidence": 86.0
                }
            return {
                "action_type": "hold", "stock": chosen_stock, "amount": 0, "price": current_p,
                "reasoning": f"Current market price ₹{current_p:.2f} aligns closely with audited DCF fair value estimates.",
                "risk_assessment": "Low", "confidence": 89.0
            }

        # 4. News-Driven Investor
        elif self.character == "News-Driven":
            # Highly responsive to benchmark loan rates, RRR cut and macro announcements
            if util.LOAN_RATE[0] <= 0.028 and self.cash > current_p * 3:
                price = round(current_p * 1.02, 2)
                amt = min(int(self.cash / price), random.randint(15, 50))
                if amt > 0:
                    return {
                        "action_type": "buy", "stock": chosen_stock, "amount": amt, "price": price,
                        "reasoning": f"Macro policy easing (RRR reduction to {util.LOAN_RATE[0]*100:.1f}%) signals broad liquidity expansion; entering Stock {chosen_stock} ahead of sector momentum.",
                        "risk_assessment": "High", "confidence": 84.0
                    }
            elif current_shares >= 5:
                price = round(current_p * 0.98, 2)
                amt = random.randint(5, min(current_shares, 25))
                return {
                    "action_type": "sell", "stock": chosen_stock, "amount": amt, "price": price,
                    "reasoning": "Elevated benchmark borrowing costs indicate tighter monetary conditions. De-risking speculative positions.",
                    "risk_assessment": "High", "confidence": 82.0
                }
            return {
                "action_type": "hold", "stock": chosen_stock, "amount": 0, "price": current_p,
                "reasoning": "Monitoring incoming regulatory bulletins and BBS community consensus for clear market direction.",
                "risk_assessment": "Medium", "confidence": 78.0
            }

        # 5. Technical Investor
        else: # Technical
            # Momentum trend indicator
            if (not deals["buy"] or len(deals["buy"]) >= len(deals["sell"])) and self.cash > current_p * 3:
                price = round(current_p * 1.015, 2)
                amt = min(int(self.cash / (price * 1.2)), random.randint(15, 40))
                if amt > 0:
                    return {
                        "action_type": "buy", "stock": chosen_stock, "amount": amt, "price": price,
                        "reasoning": f"Order book bid imbalance and upward trend momentum indicate buying entry above historical support at ₹{current_p:.2f}.",
                        "risk_assessment": "Medium", "confidence": 81.0
                    }
            elif current_shares >= 5:
                price = round(current_p * 0.985, 2)
                amt = random.randint(5, min(current_shares, 30))
                return {
                    "action_type": "sell", "stock": chosen_stock, "amount": amt, "price": price,
                    "reasoning": f"Resistance detected at recent price high ₹{current_p:.2f} with increasing selling volume on the order tape.",
                    "risk_assessment": "Medium", "confidence": 79.0
                }
            return {
                "action_type": "hold", "stock": chosen_stock, "amount": 0, "price": current_p,
                "reasoning": f"Price ₹{current_p:.2f} consolidating near historical moving average. Awaiting breakout signal.",
                "risk_assessment": "Low", "confidence": 83.0
            }

    def _heuristic_post_message(self, stock_a_price=None, stock_b_price=None):
        a_p = f"₹{stock_a_price:.2f}" if stock_a_price else "current levels"
        b_p = f"₹{stock_b_price:.2f}" if stock_b_price else "current levels"
        templates = {
            "Conservative": [
                f"I recommend Stock A because its 41.05% gross margin provides downside security at {a_p}.",
                f"Capital preservation is top priority. Holding cash reserves with Stock A at {a_p}.",
                f"Steady yields and capital protection outweigh chasing speculative tech beta at {b_p}."
            ],
            "Aggressive": [
                f"I think Stock B is undervalued following the recent reserve requirement ratio cut. Entering at {b_p}!",
                f"Strong dip buying opportunities emerging on Stock B at {b_p}! Targeting rapid upside.",
                f"Leveraged position initiated. The risk-reward ratio is highly favorable for aggressive traders."
            ],
            "Fundamental": [
                f"I believe Stock A has potential based on audited quarterly operating income and DCF margin of safety at {a_p}.",
                f"Company A DCF valuation suggests intrinsic support at {a_p}. Revenue fundamentals remain healthy.",
                f"Reviewing latest corporate earnings reports. Operating margins are holding steady despite macro headwinds."
            ],
            "News-Driven": [
                f"Special Event alert: Central bank Reserve Requirement Ratio reduction to {util.LOAN_RATE[0]*100:.1f}% unlocks market liquidity.",
                f"Monitoring government regulatory updates. Technology sector is reacting positively to recent policy headlines.",
                f"External news sentiment is key. Rebalancing equity portfolio to capture policy-driven momentum."
            ],
            "Technical": [
                f"Moving average support held firmly at {a_p}. Order book shows heavy bid accumulation on Stock A.",
                f"Momentum indicators are entering oversold territory on Stock B. Expecting an immediate technical bounce.",
                f"Breakout alert: Resistance cleared at {a_p} with rising volume. Following the upward trend."
            ]
        }
        options = templates.get(self.character, templates["Fundamental"])
        return f"[Agent {self.order} - {self.character}] " + random.choice(options)

    def _heuristic_next_day_estimate(self):
        buy_a = "yes" if self.cash > 5000 and random.random() > 0.4 else "no"
        buy_b = "yes" if self.cash > 5000 and (self.character in ["Aggressive", "Growth-Oriented"] or random.random() > 0.5) else "no"
        sell_a = "yes" if self.stock_a_amount > 10 and random.random() > 0.5 else "no"
        sell_b = "yes" if self.stock_b_amount > 10 and random.random() > 0.5 else "no"
        loan = "yes" if self.character == "Aggressive" and random.random() > 0.6 else "no"
        return {"buy_A": buy_a, "buy_B": buy_b, "sell_A": sell_a, "sell_B": sell_b, "loan": loan}

    def run_api(self, prompt, temperature: float = 1):
        model_lower = (self.model or "").lower()
        if 'gemini' in model_lower:
            return self.run_api_gemini(prompt, temperature)
        else:
            return self.run_api_gpt(prompt, temperature)

    def run_api_gemini(self, prompt, temperature: float = 1):
        if not util.GOOGLE_API_KEY:
            log.logger.error("ERROR: GOOGLE_API_KEY is not set. Please set GOOGLE_API_KEY or GEMINI_API_KEY environment variable.")
            return ""
        genai.configure(api_key=util.GOOGLE_API_KEY, transport='rest')
        generation_config = genai.types.GenerationConfig(
            candidate_count=1,
            temperature=temperature)
        
        model_name = self.model
        if model_name in ["gemini-pro", "gemini", "gemini-1.0-pro"]:
            model_name = "gemini-1.5-flash"

        model = genai.GenerativeModel(model_name)
        self.chat_history.append({"role": "user", "parts": [prompt]})
        max_retry = 2
        retry = 0
        while retry < max_retry:
            try:
                response = model.generate_content(contents=self.chat_history, generation_config=generation_config)
                new_message_dict = {"role": 'model', "parts": [response.text]}
                self.chat_history.append(new_message_dict)
                return response.text
            except Exception as e:
                log.logger.warning("Gemini api retry...{}".format(e))
                retry += 1
                time.sleep(1)
        log.logger.error("ERROR: GEMINI API FAILED. SKIP THIS INTERACTION.")
        return ""

    def run_api_gpt(self, prompt, temperature: float = 1):
        api_key = util.OPENAI_API_KEY or util.YUNWU_API_KEY or os.getenv("OPENAI_API_KEY", "")
        if not api_key:
            log.logger.error("ERROR: OPENAI_API_KEY or YUNWU_API_KEY is not set.")
            return ""
        base_url = util.get_yunwu_v1_base_url() if (util.YUNWU_API_KEY and not util.OPENAI_API_KEY) else None
        client = openai.OpenAI(api_key=api_key, base_url=base_url)
        self.chat_history.append({"role": "user", "content": prompt})
        max_retry = 2
        retry = 0

        while retry < max_retry:
            try:
                response = client.chat.completions.create(
                    model=self.model,
                    messages=self.chat_history,
                    temperature=temperature,
                )
                new_message_dict = {"role": response.choices[0].message.role,
                                    "content": response.choices[0].message.content}
                self.chat_history.append(new_message_dict)
                resp = response.choices[0].message.content
                return resp
            except Exception as e:
                log.logger.warning("API retry...{}".format(e))
                retry += 1
                time.sleep(1)
        log.logger.error("ERROR: API FAILED. SKIP THIS INTERACTION.")
        return ""

    def get_total_proper(self, stock_a_price, stock_b_price):
        return self.stock_a_amount * stock_a_price + self.stock_b_amount * stock_b_price + self.cash

    def get_proper_cash_value(self, stock_a_price, stock_b_price):
        proper = self.stock_a_amount * stock_a_price + self.stock_b_amount * stock_b_price + self.cash
        a_value = self.stock_a_amount * stock_a_price
        b_value = self.stock_b_amount * stock_b_price
        return proper, self.cash, a_value, b_value

    def get_total_loan(self):
        debt = 0
        for loan in self.loans:
            debt += loan["amount"]
        return debt

    def plan_loan(self, date, stock_a_price, stock_b_price, lastday_forum_message):
        if self.quit:
            return {"loan": "no"}
        # first day action : prompt with background
        if date == 1:
            prompt = Collection(BACKGROUND_PROMPT,
                                LOAN_TYPE_PROMPT,
                                DECIDE_IF_LOAN_PROMPT).set_indexing_method(sharp2_indexing).set_sep("\n")
            max_loan = self.init_proper - self.get_total_loan()
            inputs = {
                'date': date,
                'character': self.character,
                'stock_a': self.stock_a_amount,
                'stock_b': self.stock_b_amount,
                'cash': self.cash,
                'debt': self.loans,
                'max_loan': max_loan,
                'loan_rate1': util.LOAN_RATE[0],
                'loan_rate2': util.LOAN_RATE[1],
                'loan_rate3': util.LOAN_RATE[2],
            }

        # other days action : prompt with last day forum message & stock price
        else:
            prompt = Collection(BACKGROUND_PROMPT,
                                LASTDAY_FORUM_AND_STOCK_PROMPT,
                                LOAN_TYPE_PROMPT,
                                DECIDE_IF_LOAN_PROMPT).set_indexing_method(sharp2_indexing).set_sep("\n")
            max_loan = self.init_proper - self.get_total_loan()
            inputs = {
                "date": date,
                "character": self.character,
                "stock_a": self.stock_a_amount,
                "stock_b": self.stock_b_amount,
                "cash": self.cash,
                "debt": self.loans,
                "max_loan": max_loan,
                "stock_a_price": stock_a_price,
                "stock_b_price": stock_b_price,
                "lastday_forum_message": lastday_forum_message,
                'loan_rate1': util.LOAN_RATE[0],
                'loan_rate2': util.LOAN_RATE[1],
                'loan_rate3': util.LOAN_RATE[2],
            }
        if max_loan <= 0:
            return {"loan": "no"}

        if util.is_non_llm_baseline(self.model) or not self.has_api_key():
            loan = self._heuristic_loan(date, max_loan)
            if loan.get("loan") == "yes":
                loan["repayment_date"] = date + util.LOAN_TYPE_DATE[loan["loan_type"]]
                self.loans.append(loan)
                self.cash += loan["amount"]
                log.logger.info(f"INFO: Agent {self.order} ({self.character}) decide to loan: {loan}")
            else:
                log.logger.info(f"INFO: Agent {self.order} decide not to loan")
            return loan

        try_times = 0
        MAX_TRY_TIMES = 3
        resp = self.run_api(format_prompt(prompt, inputs))
        if resp == "":
            loan = self._heuristic_loan(date, max_loan)
            if loan.get("loan") == "yes":
                loan["repayment_date"] = date + util.LOAN_TYPE_DATE[loan["loan_type"]]
                self.loans.append(loan)
                self.cash += loan["amount"]
            return loan

        loan_format_check, fail_response, loan = self.secretary.check_loan(resp,
                                                                           max_loan)  # secretary check loan format
        while not loan_format_check:
            # log.logger.debug("WARNING: Loan format check failed because of these issues: {}".format(fail_response))
            try_times += 1
            if try_times > MAX_TRY_TIMES:
                log.logger.warning("WARNING: Loan format try times > MAX_TRY_TIMES. Skip as no loan today.")
                loan = {"loan": "no"}
                break

            resp = self.run_api(format_prompt(LOAN_RETRY_PROMPT, {"fail_response": fail_response}))
            if resp == "":
                return {"loan": "no"}
            loan_format_check, fail_response, loan = self.secretary.check_loan(resp, max_loan)

        if loan["loan"] == "yes":
            loan["repayment_date"] = date + util.LOAN_TYPE_DATE[loan["loan_type"]]  # add loan repayment_date
            self.loans.append(loan)
            #self.action_history[date].append(loan)
            self.cash += loan["amount"]
            log.logger.info("INFO: Agent {} decide to loan: {}".format(self.order, loan))
        else:
            log.logger.info("INFO: Agent {} decide not to loan".format(self.order))
        return loan

    # date=交易日, time=当前交易时段
    # 设置
    def plan_stock(self, date, time, stock_a, stock_b, stock_a_deals, stock_b_deals, season_report_days=None):
        if self.quit:
            return {"action_type": "no"}
        report_days = season_report_days if season_report_days is not None else util.SEASON_REPORT_DAYS
        if date in report_days and time == 1:
            index = report_days.index(date) % len(util.FINANCIAL_REPORT_A)
            prompt = Collection(FIRST_DAY_FINANCIAL_REPORT, FIRST_DAY_BACKGROUND_KNOWLEDGE, SEASONAL_FINANCIAL_REPORT,
                                DECIDE_BUY_STOCK_PROMPT).set_indexing_method(sharp2_indexing).set_sep("\n")
            inputs = {
                "date": date,
                "time": time,
                "stock_a": self.stock_a_amount,
                "stock_b": self.stock_b_amount,
                "stock_a_price": stock_a.get_price(),
                "stock_b_price": stock_b.get_price(),
                "stock_a_deals": stock_a_deals,
                "stock_b_deals": stock_b_deals,
                "cash": self.cash,
                "stock_a_report": stock_a.gen_financial_report(index),
                "stock_b_report": stock_b.gen_financial_report(index)
            }
        elif time == 1:
            prompt = Collection(FIRST_DAY_FINANCIAL_REPORT, FIRST_DAY_BACKGROUND_KNOWLEDGE,
                                DECIDE_BUY_STOCK_PROMPT).set_indexing_method(sharp2_indexing).set_sep("\n")
            inputs = {
                "date": date,
                "time": time,
                "stock_a": self.stock_a_amount,
                "stock_b": self.stock_b_amount,
                "stock_a_price": stock_a.get_price(),
                "stock_b_price": stock_b.get_price(),
                "stock_a_deals": stock_a_deals,
                "stock_b_deals": stock_b_deals,
                "cash": self.cash
            }
        else:
            prompt = DECIDE_BUY_STOCK_PROMPT
            inputs = {
                "date": date,
                "time": time,
                "stock_a": self.stock_a_amount,
                "stock_b": self.stock_b_amount,
                "stock_a_price": stock_a.get_price(),
                "stock_b_price": stock_b.get_price(),
                "stock_a_deals": stock_a_deals,
                "stock_b_deals": stock_b_deals,
                "cash": self.cash
            }


        if util.is_non_llm_baseline(self.model) or not self.has_api_key():
            action = self._heuristic_action(date, time, stock_a, stock_b, stock_a_deals, stock_b_deals)
            log.logger.info(f"INFO: Agent {self.order} ({self.character}) decide to action: {action}")
            return action

        try_times = 0
        MAX_TRY_TIMES = 3
        resp = self.run_api(format_prompt(prompt, inputs))
        if resp == "":
            action = self._heuristic_action(date, time, stock_a, stock_b, stock_a_deals, stock_b_deals)
            return action

        action_format_check, fail_response, action = self.secretary.check_action(
            resp, self.cash, self.stock_a_amount, self.stock_b_amount, stock_a.get_price(), stock_b.get_price())
        while not action_format_check:
            # log.logger.debug("Action format check failed because of these issues: {}".format(fail_response))
            try_times += 1
            if try_times > MAX_TRY_TIMES:
                log.logger.warning("WARNING: Action format try times > MAX_TRY_TIMES. Skip as no loan today.")
                action = {"action_type": "no"}
                break

            resp = self.run_api(format_prompt(BUY_STOCK_RETRY_PROMPT, {"fail_response": fail_response}))
            if resp == "":
                return {"action_type": "no"}
            action_format_check, fail_response, action = self.secretary.check_action(
                resp, self.cash, self.stock_a_amount, self.stock_b_amount, stock_a.get_price(), stock_b.get_price())

        if action["action_type"] == "buy":
            #self.action_history[date].append(action)
            log.logger.info("INFO: Agent {} decide to action: {}".format(self.order, action))
            # if action["stock"] == "stock_a":
            #     self.stock_a_amount += action["amount"]
            #     self.cash -= action["amount"] * stock_a.get_price()
            # else:
            #     self.stock_b_amount += action["amount"]
            #     self.cash -= action["amount"] * stock_b.get_price()
            return action
        elif action["action_type"] == "sell":
            #self.action_history[date].append(action)
            log.logger.info("INFO: Agent {} decide to action: {}".format(self.order, action))
            # if action["stock"] == "stock_a":
            #     self.stock_a_amount -= action["amount"]
            #     self.cash += action["amount"] * stock_a.get_price()
            # else:
            #     self.stock_b_amount -= action["amount"]
            #     self.cash += action["amount"] * stock_b.get_price()
            return action
        elif action["action_type"] in ["no", "hold"]:
            log.logger.info("INFO: Agent {} decide not to action: {}".format(self.order, action.get("reasoning", "")))
            return action

        log.logger.error("ERROR: WRONG ACTION: {}".format(action))
        return {"action_type": "no"}

    def buy_stock(self, stock_name, amount, price):
        if self.quit or amount <= 0:
            return False
        if self.cash < price * amount:
            log.logger.warning("ILLEGAL STOCK BUY BEHAVIOR: remain cash {}".format(self.cash))
            return False
        self.cash -= price * amount
        s_upper = str(stock_name).upper()
        if s_upper in ['A', 'STOCK_A'] or 'A' in s_upper:
            self.stock_a_amount += amount
        else:
            self.stock_b_amount += amount

        return True

    def sell_stock(self, stock_name, amount, price):
        if self.quit or amount <= 0:
            return False
        s_upper = str(stock_name).upper()
        is_a = s_upper in ['A', 'STOCK_A'] or 'A' in s_upper
        if is_a:
            if self.stock_a_amount < amount:
                amount = self.stock_a_amount
            self.stock_a_amount -= amount
        else:
            if self.stock_b_amount < amount:
                amount = self.stock_b_amount
            self.stock_b_amount -= amount
        self.cash += price * amount
        return True

    def loan_repayment(self, date):
        if self.quit:
            return
        # check是否贷款还款日，还款，破产检查
        for loan in self.loans[:]:
            if loan["repayment_date"] == date:
                self.cash -= loan["amount"] * (1 + util.LOAN_RATE[loan["loan_type"]])
                self.loans.remove(loan)
        if self.cash < 0:
            self.is_bankrupt = True


    def interest_payment(self):
        if self.quit:
            return
        # 贷款付息日付息
        for loan in self.loans:
            self.cash -= loan["amount"] * util.LOAN_RATE[loan["loan_type"]] / 12
            if self.cash < 0:
                self.is_bankrupt = True

    def bankrupt_process(self, stock_a_price, stock_b_price):
        if self.quit:
            return False
        total_value_of_stock = self.stock_a_amount * stock_a_price + self.stock_b_amount * stock_b_price
        if total_value_of_stock + self.cash < 0:
            log.logger.warning(f"Agent {self.order} bankrupt. ")
                               #f"Action history: " + str(self.action_history))
            return True
        if stock_a_price * self.stock_a_amount >= -self.cash:
            sell_a = math.ceil(-self.cash / stock_a_price)
            self.stock_a_amount -= sell_a
            self.cash += sell_a * stock_a_price
        else:
            self.cash += stock_a_price * self.stock_a_amount
            self.stock_a_amount = 0
            sell_b = math.ceil(-self.cash / stock_b_price)
            self.stock_b_amount -= sell_b
            self.cash += sell_b * stock_b_price

        if self.stock_a_amount < 0 or self.stock_b_amount < 0 or self.cash < 0:
            raise RuntimeError("ERROR: WRONG BANKRUPT PROCESS")
        self.is_bankrupt = False
        return False

    def post_message(self, stock_a_price=None, stock_b_price=None):
        if self.quit:
            return ""
        if util.is_non_llm_baseline(self.model) or not self.has_api_key():
            return self._heuristic_post_message(stock_a_price, stock_b_price)
        prompt = format_prompt(POST_MESSAGE_PROMPT, inputs={})
        resp = self.run_api(prompt)
        if not resp:
            return self._heuristic_post_message(stock_a_price, stock_b_price)
        return resp

    def next_day_estimate(self):
        if self.quit:
            return {"buy_A": "no", "buy_B": "no", "sell_A": "no", "sell_B": "no", "loan": "no"}
        if util.is_non_llm_baseline(self.model) or not self.has_api_key():
            return self._heuristic_next_day_estimate()
        prompt = format_prompt(NEXT_DAY_ESTIMATE_PROMPT, inputs={})
        resp = self.run_api(prompt)
        if resp == "":
            return self._heuristic_next_day_estimate()
        format_check, fail_response, estimate = self.secretary.check_estimate(resp)
        try_times = 0
        MAX_TRY_TIMES = 3
        while not format_check:
            try_times += 1
            if try_times > MAX_TRY_TIMES:
                estimate = self._heuristic_next_day_estimate()
                break
            resp = self.run_api(format_prompt(NEXT_DAY_ESTIMATE_RETRY, {"fail_response": fail_response}))
            if resp == "":
                return self._heuristic_next_day_estimate()
            format_check, fail_response, estimate = self.secretary.check_estimate(resp)
        return estimate


