import asyncio
import websockets
import requests
import json

async def test():
    # 1. Create room
    res = requests.post("http://localhost:8000/api/rooms")
    room_id = res.json()["room_id"]
    print(f"Room created: {room_id}")
    
    # 2. Check room
    res = requests.get(f"http://localhost:8000/api/rooms/{room_id}")
    print(f"Check before join: {res.status_code}")
    
    # 3. Join websocket
    ws_url = f"ws://localhost:8000/ws/{room_id}/client1"
    async with websockets.connect(ws_url) as ws:
        await ws.send(json.dumps({"name": "TestUser"}))
        init = await ws.recv()
        print("Joined room")
        
    # 4. Disconnected now. Check room again
    res = requests.get(f"http://localhost:8000/api/rooms/{room_id}")
    print(f"Check after leave: {res.status_code}")

asyncio.run(test())
