import asyncio
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.core.config import settings, REPO_ROOT
from backend.app.core.database import init_db
from backend.app.api.api_router import api_router
from backend.app.websocket.manager import ws_manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    init_db()
    # Bind current asyncio loop to WebSocket manager for threadsafe cross-thread calls
    ws_manager.set_event_loop(asyncio.get_running_loop())
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include All REST API Routes
app.include_router(api_router)

# WebSocket Endpoint for Real-time Simulation Updates
@app.websocket("/ws/{simulation_id}")
async def websocket_simulation_channel(websocket: WebSocket, simulation_id: str):
    await ws_manager.connect(websocket, simulation_id)
    try:
        while True:
            # Keep connection alive; clients may send ping or control messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, simulation_id)

@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME, "version": settings.VERSION}

from fastapi.responses import FileResponse

# Mount static frontend production build if available
frontend_dist = REPO_ROOT / "frontend" / "dist"
if frontend_dist.is_dir():
    assets_dir = frontend_dist / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = frontend_dist / full_path
        if full_path and file_path.is_file():
            return FileResponse(file_path)
        index_file = frontend_dist / "index.html"
        if index_file.is_file():
            response = FileResponse(index_file)
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
            return response
        return {"error": "Frontend build not found"}

