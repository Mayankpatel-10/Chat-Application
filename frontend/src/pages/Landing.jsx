import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Zap, Video, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AnimatedBackground } from '../components/ui/AnimatedBackground';

export function Landing() {
  const features = [
    { icon: <Shield className="w-8 h-8 text-primary" />, title: "Privacy First", description: "No permanent storage. Rooms and messages expire automatically." },
    { icon: <Zap className="w-8 h-8 text-secondary" />, title: "Real-time", description: "Instant messaging and presence powered by WebSockets." },
    { icon: <Video className="w-8 h-8 text-highlight" />, title: "HD Calls", description: "Crystal clear audio and video via P2P WebRTC." },
    { icon: <MessageSquare className="w-8 h-8 text-primary" />, title: "Clean UI", description: "Modern, distraction-free interface for better communication." }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', bounce: 0.5 } }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center bg-background">
      <AnimatedBackground />

      <main className="flex-1 w-full max-w-7xl px-6 py-24 flex flex-col items-center justify-center text-center z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ duration: 1, type: "spring", bounce: 0.4 }}
          className="max-w-4xl space-y-8 [perspective:1000px]"
        >
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter drop-shadow-2xl">
            Connect without a <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-highlight animate-pulse">trace.</span>
          </h1>
          <p className="text-xl md:text-2xl text-highlight-soft max-w-2xl mx-auto font-medium">
            Create instant, temporary rooms for text, voice, and video communication. 
            Once you leave, it's gone forever.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-12">
            <Link to="/join">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="w-full sm:w-auto px-10 py-5 text-xl rounded-2xl shadow-[0_0_40px_rgba(42,115,158,0.5)] border border-primary/50">
                  Create a Room
                </Button>
              </motion.div>
            </Link>
            <Link to="/join">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="secondary" size="lg" className="w-full sm:w-auto px-10 py-5 text-xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10">
                  Join Existing
                </Button>
              </motion.div>
            </Link>
          </div>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full mt-32"
        >
          {features.map((feature, i) => (
            <motion.div 
              key={i} 
              variants={itemVariants}
              whileHover={{ y: -10, rotateY: 5, rotateX: 5, boxShadow: "0 25px 50px -12px rgba(42,115,158,0.25)" }}
              className="bg-bg-secondary/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col items-start text-left space-y-6 group [perspective:1000px] transition-all duration-300"
            >
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 group-hover:scale-110 transition-transform duration-300 group-hover:border-primary/50 group-hover:bg-primary/10">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2 text-white">{feature.title}</h3>
                <p className="text-base text-highlight-soft leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
