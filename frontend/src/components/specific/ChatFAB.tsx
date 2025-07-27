import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { ChatWindow } from '../specific/ChatWindow';

export const ChatFAB: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {open && (
          <ChatWindow onClose={() => setOpen(false)} />
        )}
      </AnimatePresence>
      <motion.button
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-br from-accent-100 to-accent-200 text-accent-700 rounded-full shadow-2xl p-4 hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-accent-500/30 transition-all duration-200 interactive-element border border-accent-300"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        aria-label="Open H.A.R.V.E.Y. Chat"
      >
        <MessageCircle className="w-7 h-7" />
      </motion.button>
    </>
  );
};
