import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export function GlassCard({ children, className, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn("glass-card overflow-hidden", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
