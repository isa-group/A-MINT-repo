import { useEffect, useRef, useState } from 'react';

interface JobStatus {
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  result?: any;
  error?: string;
}

export function useAsyncJob<T extends JobStatus = JobStatus>(jobId: string | null, fetchStatus: (jobId: string) => Promise<T>, options?: { interval?: number }) {
  const [status, setStatus] = useState<JobStatus['status'] | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!jobId) return;
    setStatus('PENDING');
    setResult(null);
    setError(null);

    const poll = async () => {
      try {
        const data = await fetchStatus(jobId);
        setStatus(data.status);
        if (data.status === 'COMPLETED') {
          setResult(data.result || data);
          if (intervalRef.current) window.clearInterval(intervalRef.current);
        } else if (data.status === 'FAILED') {
          setError(data.error || 'Job failed');
          if (intervalRef.current) window.clearInterval(intervalRef.current);
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching job status');
        if (intervalRef.current) window.clearInterval(intervalRef.current);
      }
    };

    poll();
    intervalRef.current = window.setInterval(poll, options?.interval || 2000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [jobId]);

  return { status, result, error };
}
