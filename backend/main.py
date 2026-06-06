from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File
from fastapi.responses import Response, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json
import time
import uuid
import asyncio
from room_manager import room_manager, Message

app = FastAPI(title="Ephemeral API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CreateRoomRequest(BaseModel):
    room_id: Optional[str] = None

class CreateRoomResponse(BaseModel):
    room_id: str

@app.post("/api/rooms", response_model=CreateRoomResponse)
async def create_room(request: CreateRoomRequest = None):
    custom_id = request.room_id if request else None
    if custom_id and room_manager.room_exists(custom_id):
        raise HTTPException(status_code=400, detail="Room already exists. Please join it instead.")
    room_id = room_manager.create_room(custom_id)
    return {"room_id": room_id}

@app.get("/api/rooms/{room_id}")
async def check_room(room_id: str):
    if not room_manager.room_exists(room_id):
        raise HTTPException(status_code=404, detail="Room not found or expired")
    return {"status": "ok", "users_count": len(room_manager.room_clients.get(room_id, []))}

@app.post("/api/upload/{room_id}")
async def upload_file(room_id: str, file: UploadFile = File(...)):
    if not room_manager.room_exists(room_id):
        raise HTTPException(status_code=404, detail="Room not found")
        
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 10MB)")

    file_id = room_manager.save_file(room_id, file.filename, file.content_type, content)
    file_url = f"/api/files/{room_id}/{file_id}"
    
    return {
        "file_id": file_id,
        "file_url": file_url,
        "file_name": file.filename,
        "file_type": file.content_type
    }

@app.get("/api/files/{room_id}/{file_id}")
async def get_file(room_id: str, file_id: str):
    file_data = room_manager.get_file(room_id, file_id)
    if not file_data:
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=file_data["file_path"],
        media_type=file_data["content_type"],
        filename=file_data["file_name"]
    )

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, dict[str, WebSocket]] = {}

    async def connect(self, room_id: str, client_id: str, websocket: WebSocket):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = {}
        self.active_connections[room_id][client_id] = websocket

    def disconnect(self, room_id: str, client_id: str):
        if room_id in self.active_connections and client_id in self.active_connections[room_id]:
            del self.active_connections[room_id][client_id]

    async def broadcast(self, room_id: str, message: str, exclude_client: str = None):
        if room_id in self.active_connections:
            for cid, connection in self.active_connections[room_id].items():
                if cid != exclude_client:
                    await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/{room_id}/{client_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, client_id: str):
    if not room_manager.room_exists(room_id):
        await websocket.close(code=4004, reason="Room not found")
        return

    await manager.connect(room_id, client_id, websocket)
    
    user_name = f"Anonymous {client_id[:4]}"
    try:
        user_info_msg = await websocket.receive_text()
        user_data = json.loads(user_info_msg)
        user_name = user_data.get('name', user_name)
        
        room_manager.add_client(room_id, client_id, {"name": user_name})
        
        history = room_manager.get_messages(room_id)
        users = room_manager.get_users(room_id)
        
        await websocket.send_text(json.dumps({
            "type": "init",
            "history": [m.dict() for m in history],
            "users": users
        }))
        
        join_msg = Message(
            id=str(uuid.uuid4()),
            sender_id="system",
            sender_name="System",
            content=f"{user_name} joined the room",
            timestamp=time.time(),
            type="system"
        )
        room_manager.add_message(room_id, join_msg)
        await manager.broadcast(room_id, json.dumps({
            "type": "user_joined",
            "user": {"client_id": client_id, "name": user_name},
            "message": join_msg.dict()
        }))

        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            msg_type = message_data.get("type")
            
            if msg_type == "chat":
                msg = Message(
                    id=str(uuid.uuid4()),
                    sender_id=client_id,
                    sender_name=user_name,
                    content=message_data.get("content", ""),
                    timestamp=time.time(),
                    type="text"
                )
                room_manager.add_message(room_id, msg)
                await manager.broadcast(room_id, json.dumps({
                    "type": "chat",
                    "message": msg.dict()
                }))
                
            elif msg_type == "file":
                msg = Message(
                    id=str(uuid.uuid4()),
                    sender_id=client_id,
                    sender_name=user_name,
                    content=message_data.get("content", ""),
                    timestamp=time.time(),
                    type="file",
                    file_url=message_data.get("file_url"),
                    file_type=message_data.get("file_type"),
                    file_name=message_data.get("file_name")
                )
                room_manager.add_message(room_id, msg)
                await manager.broadcast(room_id, json.dumps({
                    "type": "chat",
                    "message": msg.dict()
                }))
            
            elif msg_type in ["webrtc_offer", "webrtc_answer", "webrtc_ice_candidate"]:
                target_id = message_data.get("target")
                if target_id and room_id in manager.active_connections:
                    if target_id in manager.active_connections[room_id]:
                        target_ws = manager.active_connections[room_id][target_id]
                        await target_ws.send_text(json.dumps({
                            "type": msg_type,
                            "sender": client_id,
                            "payload": message_data.get("payload")
                        }))

    except WebSocketDisconnect:
        manager.disconnect(room_id, client_id)
        room_manager.remove_client(room_id, client_id)
        
        leave_msg = Message(
            id=str(uuid.uuid4()),
            sender_id="system",
            sender_name="System",
            content=f"{user_name} left the room",
            timestamp=time.time(),
            type="system"
        )
        room_manager.add_message(room_id, leave_msg)
        await manager.broadcast(room_id, json.dumps({
            "type": "user_left",
            "client_id": client_id,
            "message": leave_msg.dict()
        }))
        
        if len(room_manager.room_clients.get(room_id, set())) == 0:
            async def delayed_destroy():
                await asyncio.sleep(10)
                if room_manager.room_exists(room_id) and len(room_manager.room_clients.get(room_id, set())) == 0:
                    room_manager.destroy_room(room_id)
            
            asyncio.create_task(delayed_destroy())
