from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.schemas import ReportExportResponse
from backend.app.services import report_service

router = APIRouter(prefix="/reports", tags=["Reports & Export"])

@router.post("/export/{simulation_id}", response_model=ReportExportResponse)
def export_report(
    simulation_id: str,
    report_type: str = Query("trades", pattern="^(trades|stocks|agents|portfolios)$"),
    format: str = Query("excel", pattern="^(excel|csv)$"),
    db: Session = Depends(get_db)
):
    return report_service.export_report(db, simulation_id, report_type=report_type, file_format=format)

@router.get("/download/{simulation_id}/{filename}")
def download_report_file(simulation_id: str, filename: str):
    return report_service.get_downloadable_file(simulation_id, filename)
