import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Paperclip, MessageCircle, Sparkles } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { PricingContextManager } from './PricingContextManager';
import { PricingContextIndicator } from './PricingContextIndicator';

interface ChatWindowProps {
  onClose: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onClose }) => {
  const { messages, isLoading, sendMessage, files } = useChat();
  const [input, setInput] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !file) return;
    await sendMessage(input, file || undefined);
    setInput('');
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] || null);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-2xl h-[85vh] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-gradient-to-r from-accent-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary-800">Chat with H.A.R.V.E.Y. (Holistic Analysis and Regulation Virtual Expert for You)</h2>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">AI-powered pricing assistant</p>
                <PricingContextIndicator />
              </div>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            onClick={onClose}
          >
            <X className="w-5 h-5 text-gray-500" />
          </motion.button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {/* Files Section - Show uploaded files if any */}
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-accent-50 to-blue-50 rounded-2xl p-4 border border-accent-200/50"
            >
              <div className="flex items-center gap-2 mb-3">
                <Paperclip className="w-4 h-4 text-accent-600" />
                <span className="text-sm font-medium text-accent-800">
                  Available Files for Analysis ({files.length})
                </span>
              </div>
              <div className="space-y-2">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white rounded-lg p-3 border border-accent-200/30"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">{file.originalName}</span>
                      {file.size && (
                        <span className="text-xs text-gray-500">
                          ({Math.round(file.size / 1024)} KB)
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-accent-600 font-medium">Ready</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-accent-600 mt-2">
                💡 These files can be automatically used by H.A.R.V.E.Y. for pricing analysis
              </p>
            </motion.div>
          )}

          {/* Pricing Context Manager */}
          {files.length > 0 && (
            <PricingContextManager className="mb-4" />
          )}

          <AnimatePresence>
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-full text-center space-y-4"
              >
                <div className="p-4 bg-gradient-to-br from-accent-100 to-blue-100 rounded-full">
                  <Sparkles className="w-8 h-8 text-accent-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-primary-800">Hi, I'm H.A.R.V.E.Y!</h3>
                  <p className="text-gray-600">
                    Ask me anything about your pricing strategies, upload YAML files for analysis, or get useful insights.
                  </p>
                  {files.length > 0 && (
                    <p className="text-accent-600 font-medium text-sm">
                      ✨ I can see you have {files.length} file{files.length > 1 ? 's' : ''} ready for analysis!
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs text-gray-500 max-w-md">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-accent-500 rounded-full"></div>
                    <span>Upload YAML files for automated pricing analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-accent-500 rounded-full"></div>
                    <span>Transform pricing pages into structured data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-accent-500 rounded-full"></div>
                    <span>Get strategic pricing advice and recommendations</span>
                  </div>
                </div>
              </motion.div>
            )}
            
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-accent-500 to-accent-600 text-black rounded-br-md'
                      : msg.role === 'system'
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 text-green-800 rounded-bl-md'
                      : 'bg-white border border-gray-200/50 text-primary-800 rounded-bl-md'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <div className="text-sm leading-relaxed whitespace-pre-line">
                      {msg.content}
                    </div>
                  ) : (
                    <MarkdownRenderer 
                      content={msg.content} 
                      className={msg.role === 'system' ? '' : ''}
                    />
                  )}
                  {msg.fileName && (
                    <div className="mt-2 flex items-center gap-1 text-xs opacity-75">
                      <Paperclip className="w-3 h-3" />
                      <span>{msg.fileName}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-white border border-gray-200/50 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                        className="w-2 h-2 bg-accent-500 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 bg-accent-500 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 bg-accent-500 rounded-full"
                      />
                    </div>
                    <span className="text-sm text-gray-500">H.A.R.V.E.Y. is thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <div className="p-6 border-t border-gray-200/50 bg-gray-50/50">
          {file && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-3 bg-white rounded-xl border border-gray-200/50 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{file.name}</span>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
          
          <form onSubmit={handleSend} className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask H.A.R.V.E.Y. anything about pricing..."
                className="w-full px-4 py-3 bg-white border border-gray-200/50 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent placeholder-gray-400 text-sm"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              />
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              accept=".yaml,.yml,.json,.txt"
              className="hidden"
            />
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              <Paperclip className="w-5 h-5 text-gray-600" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={!input.trim() && !file}
              className="p-3 bg-gradient-to-br from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};
