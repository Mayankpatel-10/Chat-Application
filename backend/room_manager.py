import uuid
from typing import Dict, List, Set, Optional
import os
from pydantic import BaseModel
import time

class Message(BaseModel):
    id: str
    sender_id: str
    sender_name: str
    content: str
    timestamp: float
    type: str # 'text', 'system', 'file'
    file_url: Optional[str] = None
    file_type: Optional[str] = None
    file_name: Optional[str] = None

class RoomManager:
    def __init__(self):
        self.rooms: Dict[str, float] = {}
        self.room_clients: Dict[str, Set[str]] = {}
        self.room_messages: Dict[str, List[Message]] = {}
        self.room_users: Dict[str, Dict[str, dict]] = {}
        self.room_files: Dict[str, Dict[str, dict]] = {}
        os.makedirs("uploads", exist_ok=True)

    def create_room(self, custom_room_id: Optional[str] = None) -> str:
        room_id = custom_room_id if custom_room_id else str(uuid.uuid4())[:8]
        self.rooms[room_id] = time.time() + 24 * 3600
        self.room_clients[room_id] = set()
        self.room_messages[room_id] = []
        self.room_users[room_id] = {}
        self.room_files[room_id] = {}
        return room_id

    def room_exists(self, room_id: str) -> bool:
        return room_id in self.rooms

    def add_client(self, room_id: str, client_id: str, user_info: dict):
        if room_id not in self.room_clients:
            self.room_clients[room_id] = set()
            self.room_users[room_id] = {}
            self.room_messages[room_id] = []
            self.room_files[room_id] = {}
        self.room_clients[room_id].add(client_id)
        self.room_users[room_id][client_id] = user_info

    def remove_client(self, room_id: str, client_id: str):
        if room_id in self.room_clients and client_id in self.room_clients[room_id]:
            self.room_clients[room_id].remove(client_id)
            if client_id in self.room_users[room_id]:
                del self.room_users[room_id][client_id]

    def add_message(self, room_id: str, message: Message):
        if room_id in self.room_messages:
            self.room_messages[room_id].append(message)
            if len(self.room_messages[room_id]) > 100:
                self.room_messages[room_id].pop(0)

    def get_messages(self, room_id: str) -> List[Message]:
        return self.room_messages.get(room_id, [])
        
    def get_users(self, room_id: str) -> List[dict]:
        if room_id in self.room_users:
            return [{"client_id": cid, **info} for cid, info in self.room_users[room_id].items()]
        return []

    def save_file(self, room_id: str, file_name: str, content_type: str, content: bytes) -> str:
        if room_id not in self.room_files:
            self.room_files[room_id] = {}
        file_id = str(uuid.uuid4())
        
        file_path = os.path.join("uploads", f"{room_id}_{file_id}")
        with open(file_path, "wb") as f:
            f.write(content)
            
        self.room_files[room_id][file_id] = {
            "file_name": file_name,
            "content_type": content_type,
            "file_path": file_path
        }
        return file_id

    def get_file(self, room_id: str, file_id: str) -> Optional[dict]:
        if room_id in self.room_files:
            return self.room_files[room_id].get(file_id)
        return None

    def clean_expired_rooms(self):
        current_time = time.time()
        expired_rooms = [r for r, expiry in self.rooms.items() if current_time > expiry]
        for r in expired_rooms:
            del self.rooms[r]
            if r in self.room_clients: del self.room_clients[r]
            if r in self.room_messages: del self.room_messages[r]
            if r in self.room_users: del self.room_users[r]
            if r in self.room_files:
                for f_id, f_data in self.room_files[r].items():
                    try:
                        os.remove(f_data["file_path"])
                    except:
                        pass
                del self.room_files[r]

room_manager = RoomManager()
