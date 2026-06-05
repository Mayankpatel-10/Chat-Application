import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AnimatedBackground } from '../components/ui/AnimatedBackground';

const ADJECTIVES = ['Silent', 'Swift', 'Clever', 'Brave', 'Fierce', 'Calm', 'Wild', 'Shadow', 'Neon', 'Cosmic'];
const ANIMALS = ['Fox', 'Owl', 'Wolf', 'Bear', 'Hawk', 'Panther', 'Tiger', 'Lion', 'Eagle', 'Shark', 'Lynx', 'Viper'];

const generateRandomName = () => {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adj} ${animal}`;
};

export function RoomSetup() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCreate = async () => {
    setIsCreating(true);
    setError('');
    try {
      const res = await fetch(`${apiUrl}/api/rooms`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId || null })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Failed to create room');
        return;
      }
      navigate(`/room/${data.room_id}`, { state: { userName: generateRandomName() } });
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!roomId) return;
    try {
      const res = await fetch(`${apiUrl}/api/rooms/${roomId}`);
      if (res.ok) {
        navigate(`/room/${roomId}`, { state: { userName: generateRandomName() } });
      } else {
        setError('Room not found or expired');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="min-h-[100dvh] flex items-center justify-center p-4 relative overflow-hidden bg-background"
    >
      <AnimatedBackground />
      
      <GlassCard className="w-full max-w-md p-6 sm:p-10 relative z-10 border border-white/10 bg-bg-secondary/40 backdrop-blur-2xl rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8 sm:mb-10"
        >
          <img src="/logo.png" alt="Schatten Logo" className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 rounded-2xl shadow-[0_0_20px_rgba(255,217,0,0.3)]" />
          <h2 className="text-3xl sm:text-4xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-br from-white to-highlight-soft">Join Schatten</h2>
          <p className="text-highlight-soft text-sm sm:text-base">Enter a room code or create a new one</p>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-highlight-soft mb-2 uppercase tracking-wider">Room Code</label>
              <Input 
                placeholder="Enter custom room code or leave blank" 
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
                className="bg-background/50 border-white/10 focus:border-primary/50 focus:ring-primary/50 text-lg py-6 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={handleJoin}
                className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 py-6 rounded-xl font-bold tracking-wide"
              >
                JOIN
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full bg-primary hover:bg-primary/90 text-background py-6 rounded-xl font-bold tracking-wide shadow-[0_0_20px_rgba(255,217,0,0.3)] hover:shadow-[0_0_30px_rgba(255,217,0,0.5)] transition-all"
              >
                {isCreating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "CREATE"}
              </Button>
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="text-error text-sm text-center font-bold bg-error/10 py-2 rounded-lg border border-error/20"
            >
              {error}
            </motion.p>
          )}
        </motion.div>
      </GlassCard>
    </motion.div>
  );
}
