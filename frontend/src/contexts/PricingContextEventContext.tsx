import React, { createContext, useContext, useCallback, useRef } from 'react';

interface PricingContextEventContextType {
  triggerRefresh: () => void;
  subscribeToRefresh: (callback: () => void) => () => void;
}

const PricingContextEventContext = createContext<PricingContextEventContextType | undefined>(undefined);

export const PricingContextEventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const callbacksRef = useRef<Set<() => void>>(new Set());

  const triggerRefresh = useCallback(() => {
    // Notify all subscribers
    callbacksRef.current.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in pricing context refresh callback:', error);
      }
    });
  }, []);

  const subscribeToRefresh = useCallback((callback: () => void) => {
    callbacksRef.current.add(callback);
    
    // Return unsubscribe function
    return () => {
      callbacksRef.current.delete(callback);
    };
  }, []);

  return (
    <PricingContextEventContext.Provider value={{ triggerRefresh, subscribeToRefresh }}>
      {children}
    </PricingContextEventContext.Provider>
  );
};

export function usePricingContextEvents() {
  const context = useContext(PricingContextEventContext);
  if (!context) {
    // Return dummy functions if provider is not available (for backwards compatibility)
    return {
      triggerRefresh: () => {},
      subscribeToRefresh: () => () => {}
    };
  }
  return context;
}
