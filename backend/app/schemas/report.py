from pydantic import BaseModel

class ReportExportResponse(BaseModel):
    simulation_id: str
    format: str  # "excel" or "csv"
    report_type: str  # "trades", "stocks", "agents", "portfolios", "all"
    file_path: str
    download_url: str
