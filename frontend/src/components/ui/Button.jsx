import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export function Button({ children, variant = 'primary', className, ...props }) {
  const baseClasses = "inline-flex items-center justify-center rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] focus:ring-primary",
    secondary: "bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 focus:ring-white/20",
    danger: "bg-error/20 hover:bg-error/30 text-error border border-error/50 focus:ring-error",
    ghost: "hover:bg-white/5 text-gray-300 hover:text-white"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const sizeClass = sizes[props.size] || sizes.md;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(baseClasses, variants[variant], sizeClass, className)}
      {...props}
    >
      {children}
    </motion.button>
  );
}
