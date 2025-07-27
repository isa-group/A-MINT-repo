import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ChatWindow } from '../specific/ChatWindow';
import { MessageCircle } from 'lucide-react';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const handleOpenChat = () => setIsChatOpen(true);
  const handleCloseChat = () => setIsChatOpen(false);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl"></div>
      </div>

      <Sidebar onOpenChat={handleOpenChat} />
      
      <div className="flex-1 flex flex-col min-h-screen ml-20 relative z-10 overflow-x-hidden">
        <Header />
        
        <main className="flex-1 flex flex-col items-stretch justify-start px-4 py-8 pt-24 relative overflow-auto max-w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-7xl mx-auto min-h-[60vh] bg-white text-gray-900 rounded-xl shadow-md p-6"
          >
            {children}
          </motion.div>
        </main>

        {/* Floating Chat Button */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-full p-4 shadow-xl hover:shadow-2xl transition-all duration-300 group border border-black bg-white/80 backdrop-blur-xl"
          onClick={handleOpenChat}
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform text-black" />
        </motion.button>
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {isChatOpen && <ChatWindow onClose={handleCloseChat} />}
      </AnimatePresence>
    </div>
  );
};
