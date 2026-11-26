import os
from pathlib import Path
import pandas as pd
from sqlalchemy.orm import Session
from fastapi import HTTPException
from fastapi.responses import FileResponse

from backend.app.core.config import settings
from backend.app.models import TradeOrder, StockSnapshot, AgentProfile, PortfolioHistory
from backend.app.schemas import ReportExportResponse

class ReportService:
    def export_report(self, db: Session, simulation_id: str, report_type: str, file_format: str) -> ReportExportResponse:
        report_dir = settings.SIMULATION_OUTPUT_DIR / simulation_id / "reports"
        os.makedirs(report_dir, exist_ok=True)

        ext = "xlsx" if file_format in ["excel", "xlsx"] else "csv"
        filename = f"{report_type}_{simulation_id[:8]}.{ext}"
        file_path = report_dir / filename

        df = None
        if report_type == "trades":
            trades = db.query(TradeOrder).filter(TradeOrder.simulation_id == simulation_id).all()
            data = [{
                "Day": t.day,
                "Session": t.session,
                "Ticker": t.ticker,
                "Buyer_ID": t.buyer_id,
                "Seller_ID": t.seller_id,
                "Amount": t.amount,
                "Price": t.price,
                "Turnover": t.turnover or round(t.amount * t.price, 2),
                "Reasoning": t.reasoning or "Bid matched ask",
                "Risk_Assessment": t.risk_assessment or "Moderate",
                "Confidence": t.confidence or 85.0,
                "Timestamp": t.timestamp
            } for t in trades]
            df = pd.DataFrame(data)

        elif report_type == "stocks":
            stocks = db.query(StockSnapshot).filter(StockSnapshot.simulation_id == simulation_id).all()
            data = [{
                "Day": s.day,
                "Session": s.session,
                "Ticker": s.ticker,
                "Price": s.price,
                "Volume": s.deals_count,
                "Turnover": round(s.price * s.deals_count, 2),
                "Timestamp": s.timestamp
            } for s in stocks]
            df = pd.DataFrame(data)

        elif report_type == "agents":
            agents = db.query(AgentProfile).filter(AgentProfile.simulation_id == simulation_id).all()
            data = [{
                "Agent_ID": a.agent_order,
                "Name": a.name,
                "Character": a.character,
                "Persona": a.persona,
                "Risk_Appetite": a.risk_appetite,
                "Cash": a.current_cash,
                "Stock_A": a.current_stock_a,
                "Stock_B": a.current_stock_b,
                "Debt": a.current_debt,
                "Bankrupt": a.is_bankrupt
            } for a in agents]
            df = pd.DataFrame(data)

        elif report_type == "portfolios":
            ports = db.query(PortfolioHistory).filter(PortfolioHistory.simulation_id == simulation_id).all()
            data = [{
                "Agent_ID": p.agent_id,
                "Day": p.day,
                "Session": p.session,
                "Cash": p.cash,
                "Stock_A_Shares": p.stock_a_shares,
                "Stock_A_Value": p.stock_a_value,
                "Stock_B_Shares": p.stock_b_shares,
                "Stock_B_Value": p.stock_b_value,
                "Total_Property": p.total_property,
                "Debt": p.debt
            } for p in ports]
            df = pd.DataFrame(data)
        else:
            raise HTTPException(status_code=400, detail=f"Invalid report type: {report_type}")

        if df is None or df.empty:
            df = pd.DataFrame([{"Message": "No data available for this report"}])

        if file_format == "csv":
            df.to_csv(file_path, index=False)
        elif file_format in ["excel", "xlsx"]:
            df.to_excel(file_path, index=False)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {file_format}")

        download_url = f"/api/reports/download/{simulation_id}/{filename}"
        return ReportExportResponse(
            simulation_id=simulation_id,
            format=file_format,
            report_type=report_type,
            file_path=str(file_path),
            download_url=download_url
        )

    def get_downloadable_file(self, simulation_id: str, filename: str) -> FileResponse:
        file_path = settings.SIMULATION_OUTPUT_DIR / simulation_id / "reports" / filename
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Requested report file does not exist")
        return FileResponse(
            path=str(file_path),
            filename=filename,
            media_type="application/octet-stream"
        )

report_service = ReportService()
