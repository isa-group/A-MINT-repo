import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './App';
import './index.css';
import { SessionProvider } from './contexts/SessionContext';
import { PricingContextEventProvider } from './contexts/PricingContextEventContext';

document.body.className = 'bg-gradient-to-br from-white/80 via-slate-100/80 to-accent/10 min-h-screen font-sans antialiased';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SessionProvider>
      <PricingContextEventProvider>
        <Router>
          <AppRoutes />
        </Router>
      </PricingContextEventProvider>
    </SessionProvider>
  </React.StrictMode>
);
