import asyncio
import json
import logging
from typing import Dict, List
from fastapi import WebSocket

logger = logging.getLogger("WebSocketManager")

class ConnectionManager:
    def __init__(self):
        # simulation_id -> list of WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Global listeners (e.g. dashboard)
        self.global_connections: List[WebSocket] = []
        self._loop = None

    def set_event_loop(self, loop: asyncio.AbstractEventLoop):
        self._loop = loop

    async def connect(self, websocket: WebSocket, simulation_id: str = "global"):
        await websocket.accept()
        if simulation_id == "global":
            self.global_connections.append(websocket)
        else:
            if simulation_id not in self.active_connections:
                self.active_connections[simulation_id] = []
            self.active_connections[simulation_id].append(websocket)
        logger.info(f"WebSocket client connected to channel: {simulation_id}")

    def disconnect(self, websocket: WebSocket, simulation_id: str = "global"):
        if simulation_id == "global":
            if websocket in self.global_connections:
                self.global_connections.remove(websocket)
        else:
            if simulation_id in self.active_connections and websocket in self.active_connections[simulation_id]:
                self.active_connections[simulation_id].remove(websocket)
        logger.info(f"WebSocket client disconnected from channel: {simulation_id}")

    async def broadcast(self, simulation_id: str, message: dict):
        payload = json.dumps(message)
        # Send to specific simulation listeners
        if simulation_id in self.active_connections:
            dead_connections = []
            for connection in self.active_connections[simulation_id]:
                try:
                    await connection.send_text(payload)
                except Exception:
                    dead_connections.append(connection)
            for dead in dead_connections:
                self.disconnect(dead, simulation_id)

        # Also broadcast to global listeners
        dead_globals = []
        for connection in self.global_connections:
            try:
                await connection.send_text(payload)
            except Exception:
                dead_globals.append(connection)
        for dead in dead_globals:
            self.disconnect(dead, "global")

    def broadcast_threadsafe(self, simulation_id: str, message: dict):
        """Allows threads (like simulation runner) to safely schedule WebSocket broadcasts."""
        if self._loop and self._loop.is_running():
            asyncio.run_coroutine_threadsafe(self.broadcast(simulation_id, message), self._loop)

ws_manager = ConnectionManager()
