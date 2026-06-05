import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Landing } from './pages/Landing'
import { RoomSetup } from './pages/RoomSetup'
import { Room } from './pages/Room'

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/join" element={<RoomSetup />} />
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-white selection:bg-primary/30 font-sans">
        <AnimatedRoutes />
      </div>
    </BrowserRouter>
  )
}

export default App
