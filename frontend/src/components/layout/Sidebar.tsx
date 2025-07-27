import React from 'react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { Home, BarChart3, Settings2, Sparkles } from 'lucide-react';

interface SidebarProps {
  onOpenChat: () => void;
}

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/analysis', icon: BarChart3, label: 'Analysis' },
  { to: '/transform', icon: Settings2, label: 'Transform' },
];

export const Sidebar: React.FC<SidebarProps> = () => {
  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed left-0 top-0 h-full w-20 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 shadow-xl flex flex-col items-center py-6 z-50"
    >
      {/* Logo */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
        className="mb-8 p-3 bg-gradient-to-br from-accent-100 to-accent-200 rounded-2xl shadow-lg border border-accent-300"
      >
        <Sparkles className="w-8 h-8 text-accent-700" />
      </motion.div>

      {/* Navigation */}
      <nav className="flex flex-col gap-4 flex-1">
        {navItems.map((item, index) => (
          <motion.div
            key={item.to}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
          >
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-1 px-3 py-4 rounded-2xl transition-all duration-300 group ${
                  isActive
                    ? 'bg-gradient-to-br from-accent-100 to-accent-200 text-accent-800 shadow-lg border border-accent-300'
                    : 'text-gray-600 hover:text-accent-700 hover:bg-gray-100/80'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-6 h-6 transition-transform group-hover:scale-110 ${isActive ? 'scale-110' : ''}`} />
                  <span className="text-xs font-medium mt-1">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-br from-accent-100 to-accent-200 rounded-2xl -z-10 border border-accent-300"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* Bottom decoration */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-auto w-8 h-1 bg-gradient-to-r from-accent-400 to-accent-600 rounded-full"
      />
    </motion.aside>
  );
};
