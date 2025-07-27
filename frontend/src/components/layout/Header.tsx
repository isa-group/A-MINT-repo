import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-20 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm flex items-center px-8 z-40"
    >
      <div className="flex items-center gap-3">
        <motion.div
          initial={{ rotate: -180, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
        >
          <Sparkles className="w-7 h-7 text-accent-500" />
        </motion.div>
        {/* <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-800 to-accent-600 bg-clip-text text-transparent">
            H.A.R.V.E.Y.
          </h1>
        </motion.div> */}
      </div>

      <div className="ml-auto flex items-center gap-6">
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="hidden md:block"
        >
          <span className="text-sm text-gray-600 font-medium">
            AI-Powered Pricing Platform
          </span>
        </motion.div>
        
        {/* <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 260, damping: 20 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-100 to-accent-200 flex items-center justify-center text-accent-700 shadow-lg hover:shadow-xl transition-all duration-300 border border-accent-300"
        >
          <User className="w-5 h-5" />
        </motion.button> */}
      </div>
    </motion.header>
  );
};
