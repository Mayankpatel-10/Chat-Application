# Schatten - Privacy First Communication

<p align="center">
  <img src="./frontend/public/logo.png" alt="Schatten Logo" width="150" />
</p>

Schatten (German for "shadow") is a hyper-premium, ephemeral, privacy-first communication platform. It allows users to create temporary chat rooms for instant messaging, file sharing, and high-quality voice/video calls. 

Once a room expires, all messages, media, and traces of the conversation are completely obliterated. 

## Features
- **Ephemeral Rooms:** Rooms and all their contents are temporary and securely destroyed.
- **Premium Interface:** A sleek, fully responsive, cyberpunk-inspired dark theme featuring stunning Framer Motion animations and 3D effects.
- **Media Sharing:** Easily upload and preview images, videos, audio, and documents directly in the chat.
- **WebRTC Audio & Video:** Crystal clear, low-latency peer-to-peer voice and video calls.
- **Anonymous Entry:** Users are automatically assigned cool, anonymous animal names (e.g., "Neon Fox") upon joining.
- **Custom Room Codes:** Create custom room IDs or use randomly generated, secure access codes.

## Tech Stack
- **Frontend:** React.js, Vite, Tailwind CSS, Framer Motion, React Three Fiber (3D effects), Lucide React.
- **Backend:** Python, FastAPI, WebSockets (real-time chat), Uvicorn.
- **Communication:** WebRTC (for P2P Video/Audio), WebSockets.

## How to Run Locally

### 1. Start the Backend
Navigate to the `backend` directory, create a virtual environment, install dependencies, and start the FastAPI server:

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # On Windows
# source venv/bin/activate  # On Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Start the Frontend
In a new terminal window, navigate to the `frontend` directory, install NPM packages, and start the Vite development server:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser to start chatting!
