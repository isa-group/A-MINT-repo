import { Routes, Route, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AnalysisTool from './pages/AnalysisTool';
import TransformTool from './pages/TransformTool';
import { AppLayout } from './components/layout/AppLayout';
import { AnimatePresence } from 'framer-motion';

function AppRoutes() {
  const location = useLocation();
  return (
    <AppLayout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analysis" element={<AnalysisTool />} />
          <Route path="/transform" element={<TransformTool />} />
        </Routes>
      </AnimatePresence>
    </AppLayout>
  );
}

export default AppRoutes;
