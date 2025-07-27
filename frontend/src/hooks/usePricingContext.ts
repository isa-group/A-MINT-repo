import { useState, useEffect, useCallback } from 'react';
import { harveyChatAPI } from '../services/harveyChatAPI';
import { useSession } from '../contexts/SessionContext';
import { usePricingContextEvents } from '../contexts/PricingContextEventContext';

export interface PricingContextInfo {
  sessionId: string;
  hasContext: boolean;
  fileName: string | null;
  contentLength: number;
  retrievedAt: string;
}

export interface PricingContextUpdate {
  sessionId: string;
  fileId: string;
  fileName: string;
  updatedAt: string;
  message: string;
}

export interface PricingContextClear {
  sessionId: string;
  clearedAt: string;
  message: string;
}

export function usePricingContext() {
  const { sessionId } = useSession();
  const { subscribeToRefresh, triggerRefresh } = usePricingContextEvents();
  const [contextInfo, setContextInfo] = useState<PricingContextInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContextInfo = useCallback(async () => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const info = await harveyChatAPI.getPricingContextInfo(sessionId);
      setContextInfo(info);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al obtener información del contexto');
      console.error('Error fetching pricing context info:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Función para actualizar el contexto con un archivo específico
  const updateContext = useCallback(async (fileId: string): Promise<PricingContextUpdate | null> => {
    if (!sessionId) {
      setError('No hay sesión activa');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await harveyChatAPI.updatePricingContext(sessionId, fileId);
      // Refresh context info after update
      await fetchContextInfo();
      // Trigger refresh for other components
      triggerRefresh();
      return result;
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al actualizar contexto de precios');
      console.error('Error updating pricing context:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, fetchContextInfo]);

  const clearContext = useCallback(async (): Promise<PricingContextClear | null> => {
    if (!sessionId) {
      setError('No hay sesión activa');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await harveyChatAPI.clearPricingContext(sessionId);
      // Refresh context info after clearing
      await fetchContextInfo();
      // Trigger refresh for other components
      triggerRefresh();
      return result;
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al limpiar contexto de precios');
      console.error('Error clearing pricing context:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, fetchContextInfo]);

  useEffect(() => {
    if (sessionId) {
      fetchContextInfo();
    } else {
      setContextInfo(null);
      setError(null);
    }
  }, [sessionId, fetchContextInfo]);

  useEffect(() => {
    const unsubscribe = subscribeToRefresh(() => {
      if (sessionId) {
        fetchContextInfo();
      }
    });

    return unsubscribe;
  }, [sessionId, fetchContextInfo, subscribeToRefresh]);

  return {
    contextInfo,
    isLoading,
    error,
    updateContext,
    clearContext,
    refreshContextInfo: fetchContextInfo,
  };
}
