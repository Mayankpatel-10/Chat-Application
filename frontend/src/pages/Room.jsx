import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Copy, Check, Send, Users, MessageSquare, Video as VideoIcon, Mic, MicOff, VideoOff, Hash, Paperclip, Loader2, File as FileIcon, Image as ImageIcon, Film, Music, FileText, Menu, X } from 'lucide-react';
import { useWebSocket } from '../context/WebSocketContext';
import { useWebRTC } from '../hooks/useWebRTC';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';

export function Room() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const getFileUrl = (url) => url.startsWith('http') ? url : `${apiUrl}${url}`;
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const userName = location.state?.userName || 'Anonymous';
  
  const { connect, disconnect, isConnected, messages, users, sendMessage, sendFileMessage, clientId } = useWebSocket();
  const [localStream, setLocalStream] = useState(null);
  const { peers, disconnectAll } = useWebRTC(localStream);
  
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const messagesEndRef = useRef(null);
  const localVideoRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    connect(roomId, userName);
    return () => {
      disconnect();
      disconnectAll();
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);


  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => t.enabled = !isMuted);
      localStream.getVideoTracks().forEach(t => t.enabled = !isVideoOff);
    }
  }, [isMuted, isVideoOff, localStream]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, hasActiveCalls]);

  const startCall = async (withVideo) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: withVideo, audio: true });
      setLocalStream(stream);
      setIsVideoOff(!withVideo);
      setIsMuted(false);
    } catch (err) {
      console.error("Failed to get media", err);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendMessage(chatInput);
      setChatInput('');
    }
  };

  const handleAttachmentSelect = (acceptType) => {
    setShowAttachmentMenu(false);
    if (fileInputRef.current) {
      fileInputRef.current.accept = acceptType;
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${apiUrl}/api/upload/${roomId}`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      sendFileMessage(data);
    } catch(err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleLeave = () => {
    navigate('/');
  };

  const hasActiveCalls = Object.keys(peers).length > 0 || (localStream && !isVideoOff);
  const totalVideos = (localStream ? 1 : 0) + Object.keys(peers).length;

  return (
    <>
      <div className="h-[100dvh] flex bg-background text-white overflow-hidden w-full relative">
        
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Left Sidebar */}
        <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out flex w-[280px] md:w-72 bg-bg-secondary flex-col shrink-0 border-r border-white/5 shadow-2xl z-40`}>
          <div className="p-4 border-b border-black/20 shadow-sm flex items-center justify-between bg-bg-secondary/80 backdrop-blur-md">
            <div className="flex items-center">
              <img src="/logo.png" alt="Schatten" className="w-6 h-6 rounded-md mr-2 shadow-[0_0_10px_rgba(255,217,0,0.2)]" />
              <h2 className="font-bold text-base flex items-center text-highlight-soft">
                <span className="truncate max-w-[120px]">{roomId}</span>
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={handleCopyLink} className="p-1.5 h-auto text-highlight-dark hover:text-white hover:bg-white/10">
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1.5 h-auto text-highlight-dark hover:text-white hover:bg-white/10">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
            <h3 className="text-[11px] font-bold text-highlight-dark uppercase tracking-wider mb-3 px-2 mt-2">
              Online — {users.length}
            </h3>
            <AnimatePresence>
              {users.map(u => (
                <motion.div 
                  key={u.client_id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-card-hover transition-colors cursor-default group"
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-xs shadow-sm text-white">
                      {u.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-[2px] border-bg-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-highlight-soft group-hover:text-white truncate transition-colors">
                      {u.name} {u.client_id === clientId && <span className="text-highlight-dark text-xs ml-1">(You)</span>}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="p-3 bg-card border-t border-black/20 flex items-center justify-between shadow-[0_-10px_20px_rgba(0,0,0,0.2)] z-10">
            <div className="flex items-center gap-2 truncate">
              <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-primary font-bold text-xs shrink-0 shadow-inner">
                {userName.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-[13px] font-bold truncate text-white">{userName}</span>
                <span className="text-[10px] font-semibold text-success uppercase">Connected</span>
              </div>
            </div>
            
            {!localStream ? (
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" className="p-2 h-auto text-highlight-soft hover:text-white hover:bg-white/10" onClick={() => startCall(false)} title="Start Voice Call"><Mic className="w-4 h-4" /></Button>
                <Button variant="ghost" className="p-2 h-auto text-highlight-soft hover:text-white hover:bg-white/10" onClick={() => startCall(true)} title="Start Video Call"><VideoIcon className="w-4 h-4" /></Button>
                <Button variant="ghost" className="p-2 h-auto text-error hover:bg-error/20" onClick={handleLeave} title="Leave Room"><LogOut className="w-4 h-4" /></Button>
              </div>
            ) : (
              <div className="flex gap-1 shrink-0">
                <Button 
                  variant="ghost"
                  className={`p-2 h-auto rounded-md hover:bg-card-hover ${isMuted ? 'text-error' : 'text-highlight-soft'}`}
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Button 
                  variant="ghost"
                  className={`p-2 h-auto rounded-md hover:bg-card-hover ${isVideoOff ? 'text-error' : 'text-highlight-soft'}`}
                  onClick={() => setIsVideoOff(!isVideoOff)}
                >
                  {isVideoOff ? <VideoOff className="w-4 h-4" /> : <VideoIcon className="w-4 h-4" />}
                </Button>
                <Button 
                  variant="ghost"
                  className="p-2 h-auto rounded-md hover:bg-error/20 text-error"
                  onClick={handleLeave}
                  title="Leave Room"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-background relative min-w-0 shadow-inner overflow-hidden">
          
          <div className="h-14 border-b border-white/5 shadow-sm flex items-center px-4 shrink-0 bg-background z-10">
            <Button variant="ghost" size="sm" className="md:hidden mr-3 p-1.5 h-auto text-highlight-soft hover:text-white hover:bg-white/10" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <img src="/logo.png" alt="Schatten" className="w-6 h-6 rounded-md mr-2 hidden md:block shadow-[0_0_10px_rgba(255,217,0,0.2)]" />
            <Hash className="w-5 h-5 text-highlight-dark mr-1 hidden md:block" />
            <h2 className="font-bold text-base text-white">general</h2>
          </div>

          <AnimatePresence>
            {hasActiveCalls && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`shrink-0 bg-black/40 backdrop-blur-md border-b border-white/5 p-4 shadow-inner max-h-[60vh] overflow-y-auto w-full ${totalVideos === 1 ? 'flex justify-center' : 'grid gap-4'}`}
                style={totalVideos > 1 ? { gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' } : {}}
              >
                {localStream && (
                  <div className={`relative aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] group ${totalVideos === 1 ? 'w-full max-w-3xl max-h-[50vh]' : 'w-full'}`}>
                    <video 
                      ref={localVideoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className={`w-full h-full object-cover transform -scale-x-100 ${isVideoOff ? 'hidden' : 'block'}`}
                    />
                    {isVideoOff && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-secondary">
                        <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center text-highlight font-bold text-2xl mb-2 shadow-inner">
                          {userName.substring(0, 2).toUpperCase()}
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <div className="bg-background/80 px-3 py-1 rounded-md text-[13px] backdrop-blur-md text-white font-bold truncate max-w-[150px] border border-white/10 shadow-sm">
                        {userName} (You)
                      </div>
                      {(isMuted || isVideoOff) && (
                        <div className="flex gap-2">
                          {isMuted && <div className="bg-error/90 p-1.5 rounded-full shadow-sm"><MicOff className="w-4 h-4 text-white" /></div>}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {Object.entries(peers).map(([id, peer]) => {
                  const uName = users.find(u => u.client_id === id)?.name || 'Unknown';
                  return (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={id} 
                      className={`relative aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] group ${totalVideos === 1 ? 'w-full max-w-3xl max-h-[50vh]' : 'w-full'}`}
                    >
                      <VideoPlayer stream={peer.stream} />
                      <div className="absolute bottom-3 left-3 bg-background/80 px-3 py-1 rounded-md text-[13px] backdrop-blur-md text-white font-bold truncate max-w-[200px] border border-white/10 shadow-sm">
                        {uName}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
            <div className="mt-4 md:mt-8 mb-8 md:mb-12 px-2">
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ type: "spring", bounce: 0.5, delay: 0.5 }}
                className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-4 md:mb-6 border border-primary/30"
              >
                <Hash className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </motion.div>
              <h1 className="text-2xl md:text-4xl font-black mb-2 md:mb-3 text-white">Welcome to #{roomId}!</h1>
              <p className="text-highlight-soft text-sm md:text-base">This is the start of the temporary #{roomId} room. Messages and files are ephemeral and will disappear when the room is destroyed.</p>
            </div>

            {messages.map((msg, i) => {
              const isSystem = msg.type === 'system';
              const isSequential = i > 0 && messages[i-1].sender_id === msg.sender_id && !isSystem && messages[i-1].type !== 'system';

              if (isSystem) {
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={i} 
                    className="flex items-center justify-center py-2"
                  >
                    <span className="text-[12px] font-bold text-highlight-dark tracking-wide">{msg.content}</span>
                  </motion.div>
                );
              }

              return (
                <motion.div 
                  initial={!isSequential ? { opacity: 0, y: 10 } : { opacity: 1 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i} 
                  className={`flex gap-4 hover:bg-bg-secondary/30 px-4 py-2 -mx-4 rounded-xl transition-colors ${isSequential ? 'mt-1' : 'mt-6'}`}
                >
                  <div className="w-10 shrink-0 flex justify-center">
                    {!isSequential ? (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-sm shadow-md cursor-pointer hover:scale-105 transition-transform text-white">
                        {msg.sender_name.substring(0, 2).toUpperCase()}
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-highlight-dark opacity-0 group-hover:opacity-100 self-center">
                        {new Date(msg.timestamp * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 group">
                    {!isSequential && (
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-bold text-[15px] hover:underline cursor-pointer text-white">{msg.sender_name}</span>
                        <span className="text-xs font-semibold text-highlight-dark">
                          {new Date(msg.timestamp * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    )}
                    
                    {msg.type === 'file' ? (
                      <div className="mt-2">
                        {msg.file_type?.startsWith('image/') && (
                          <a href={getFileUrl(msg.file_url)} target="_blank" rel="noopener noreferrer">
                            <img src={getFileUrl(msg.file_url)} alt={msg.file_name} className="max-w-[200px] sm:max-w-xs rounded-lg border border-white/10 hover:opacity-90 transition-opacity" />
                          </a>
                        )}
                        {msg.file_type?.startsWith('video/') && (
                          <video src={getFileUrl(msg.file_url)} controls className="max-w-[200px] sm:max-w-xs rounded-lg border border-white/10" />
                        )}
                        {msg.file_type?.startsWith('audio/') && (
                          <audio src={getFileUrl(msg.file_url)} controls className="w-full max-w-[200px] sm:max-w-xs rounded-lg border border-white/10" />
                        )}
                        {!msg.file_type?.startsWith('image/') && !msg.file_type?.startsWith('video/') && !msg.file_type?.startsWith('audio/') && (
                          <a href={getFileUrl(msg.file_url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors w-max">
                            <div className="p-2 bg-primary/20 rounded-lg"><FileIcon className="w-6 h-6 text-primary" /></div>
                            <div>
                              <p className="text-sm font-semibold text-white truncate max-w-[150px]">{msg.file_name}</p>
                              <p className="text-[10px] text-gray-400 uppercase">{msg.file_type || 'Unknown Type'}</p>
                            </div>
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="text-[15px] text-highlight-soft leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} className="h-4" />
          </div>

          <div className="p-4 pt-0 shrink-0 relative">
            {/* Attachment Menu */}
            <AnimatePresence>
              {showAttachmentMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-[80px] left-4 bg-card border border-white/10 shadow-2xl rounded-xl p-2 flex flex-col gap-1 z-50 w-48"
                >
                  <Button type="button" variant="ghost" onClick={() => handleAttachmentSelect('image/*')} className="justify-start gap-3 w-full hover:bg-white/5 text-white">
                    <ImageIcon className="w-4 h-4 text-primary" /> Image
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => handleAttachmentSelect('video/*')} className="justify-start gap-3 w-full hover:bg-white/5 text-white">
                    <Film className="w-4 h-4 text-success" /> Video
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => handleAttachmentSelect('audio/*')} className="justify-start gap-3 w-full hover:bg-white/5 text-white">
                    <Music className="w-4 h-4 text-warning" /> Audio
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSend} className="bg-bg-secondary rounded-xl p-1.5 md:p-2 flex items-end shadow-lg border border-white/5 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
              <Button 
                type="button" 
                variant="ghost" 
                className={`p-1.5 md:p-2 h-9 w-9 md:h-10 md:w-10 shrink-0 mb-0.5 ml-0.5 rounded-lg transition-colors ${showAttachmentMenu ? 'text-primary bg-primary/20' : 'text-highlight-dark hover:text-white hover:bg-white/10'}`}
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                disabled={isUploading}
              >
                {isUploading ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Paperclip className="w-4 h-4 md:w-5 md:h-5" />}
              </Button>
              <textarea 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder={`Message #${roomId}`}
                className="w-full bg-transparent border-none focus:ring-0 text-[14px] md:text-[15px] text-white resize-none max-h-32 min-h-[36px] py-2 md:py-3 px-2 md:px-3 placeholder:text-highlight-dark scrollbar-hide font-medium"
                rows={1}
              />
              <Button 
                type="submit" 
                disabled={!chatInput.trim()} 
                variant="ghost"
                className="p-1.5 md:p-2 h-9 w-9 md:h-10 md:w-10 shrink-0 mb-0.5 mr-0.5 text-primary hover:bg-primary/20 hover:text-primary rounded-lg disabled:hover:bg-transparent disabled:opacity-50"
              >
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </form>
            <div className="mt-2 md:mt-3 text-[9px] md:text-[11px] font-bold text-highlight-dark text-center flex justify-center items-center gap-1.5 uppercase tracking-wider px-2">
              <LogOut className="w-2 h-2 md:w-3 md:h-3 shrink-0" /> <span className="truncate">Messages are ephemeral and will not be saved</span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

function VideoPlayer({ stream }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);
  return <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />;
}
