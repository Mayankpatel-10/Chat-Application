import React, { createContext, useContext, useState, useRef } from 'react';

const WebSocketContext = createContext();

export function WebSocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [clientId, setClientId] = useState(() => Math.random().toString(36).substring(2, 10));
  const [userName, setUserName] = useState('');

  const webrtcCallbacks = useRef({});

  const connect = (room, name) => {
    setRoomId(room);
    setUserName(name);
    
    const wsUrl = `ws://localhost:8000/ws/${room}/${clientId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ name }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch(data.type) {
        case 'init':
          setMessages(data.history || []);
          setUsers(data.users || []);
          break;
        case 'user_joined':
          setUsers(prev => [...prev.filter(u => u.client_id !== data.user.client_id), data.user]);
          setMessages(prev => [...prev, data.message]);
          break;
        case 'user_left':
          setUsers(prev => prev.filter(u => u.client_id !== data.client_id));
          setMessages(prev => [...prev, data.message]);
          break;
        case 'chat':
          setMessages(prev => [...prev, data.message]);
          break;
        case 'webrtc_offer':
        case 'webrtc_answer':
        case 'webrtc_ice_candidate':
          if (webrtcCallbacks.current[data.type]) {
            webrtcCallbacks.current[data.type](data);
          }
          break;
        default:
          console.warn('Unknown message type:', data.type);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setSocket(null);
    };

    setSocket(ws);
  };

  const disconnect = () => {
    if (socket) {
      socket.close();
      setSocket(null);
    }
    setRoomId(null);
    setMessages([]);
    setUsers([]);
    setIsConnected(false);
  };

  const sendMessage = (content) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify({ type: 'chat', content }));
    }
  };

  const sendSignaling = (type, target, payload) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify({ type, target, payload }));
    }
  };

  const sendFileMessage = (fileData) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify({
        type: 'file',
        content: '',
        ...fileData
      }));
    }
  };

  const onSignalingMessage = (type, callback) => {
    webrtcCallbacks.current[type] = callback;
  };

  return (
    <WebSocketContext.Provider value={{
      socket,
      isConnected,
      roomId,
      clientId,
      userName,
      messages,
      users,
      connect,
      disconnect,
      sendMessage,
      sendFileMessage,
      sendSignaling,
      onSignalingMessage
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => useContext(WebSocketContext);
