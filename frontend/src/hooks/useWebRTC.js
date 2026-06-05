import { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from '../context/WebSocketContext';

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export function useWebRTC(localStream) {
  const { sendSignaling, onSignalingMessage, users, clientId } = useWebSocket();
  const [peers, setPeers] = useState({});
  const peersRef = useRef({});

  const createPeer = useCallback((targetId, initiator) => {
    if (peersRef.current[targetId]) return peersRef.current[targetId].connection;

    const pc = new RTCPeerConnection(STUN_SERVERS);

    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignaling('webrtc_ice_candidate', targetId, event.candidate);
      }
    };

    pc.ontrack = (event) => {
      setPeers(prev => ({
        ...prev,
        [targetId]: { connection: pc, stream: event.streams[0] }
      }));
    };

    peersRef.current[targetId] = { connection: pc, stream: null };

    if (initiator) {
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
          sendSignaling('webrtc_offer', targetId, pc.localDescription);
        });
    }

    return pc;
  }, [localStream, sendSignaling]);

  useEffect(() => {
    onSignalingMessage('webrtc_offer', async (data) => {
      const pc = createPeer(data.sender, false);
      await pc.setRemoteDescription(new RTCSessionDescription(data.payload));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignaling('webrtc_answer', data.sender, pc.localDescription);
    });

    onSignalingMessage('webrtc_answer', async (data) => {
      if (peersRef.current[data.sender]) {
        const pc = peersRef.current[data.sender].connection;
        await pc.setRemoteDescription(new RTCSessionDescription(data.payload));
      }
    });

    onSignalingMessage('webrtc_ice_candidate', async (data) => {
      if (peersRef.current[data.sender]) {
        const pc = peersRef.current[data.sender].connection;
        await pc.addIceCandidate(new RTCIceCandidate(data.payload));
      }
    });
  }, [createPeer, onSignalingMessage, sendSignaling]);

  // Handle localStream being added later (on-demand calling)
  useEffect(() => {
    if (localStream) {
      Object.entries(peersRef.current).forEach(async ([id, peer]) => {
        const pc = peer.connection;
        const senders = pc.getSenders();
        let trackAdded = false;
        localStream.getTracks().forEach(track => {
          if (!senders.find(s => s.track === track)) {
            pc.addTrack(track, localStream);
            trackAdded = true;
          }
        });
        if (trackAdded) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendSignaling('webrtc_offer', id, pc.localDescription);
        }
      });
    }
  }, [localStream, sendSignaling]);

  useEffect(() => {
    users.forEach(user => {
      if (user.client_id !== clientId && !peersRef.current[user.client_id]) {
        if (clientId > user.client_id) {
          createPeer(user.client_id, true);
        }
      }
    });
    
    const userIds = users.map(u => u.client_id);
    Object.keys(peersRef.current).forEach(id => {
      if (!userIds.includes(id)) {
        peersRef.current[id].connection.close();
        delete peersRef.current[id];
        setPeers(prev => {
          const newPeers = { ...prev };
          delete newPeers[id];
          return newPeers;
        });
      }
    });
  }, [users, clientId, createPeer]);

  const disconnectAll = useCallback(() => {
    Object.values(peersRef.current).forEach(p => p.connection.close());
    peersRef.current = {};
    setPeers({});
  }, []);

  return { peers, disconnectAll };
}
