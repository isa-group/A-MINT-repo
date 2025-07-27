import axios from 'axios';

const harveyApi = axios.create({
  baseURL: import.meta.env.VITE_HARVEY_API_URL,
  withCredentials: false,
});

export const harveyChatAPI = {
  async createSession(): Promise<{ sessionId: string }> {
    const res = await harveyApi.post('/session');
    return res.data.data || res.data;
  },
  async postMessage(sessionId: string, message: string, context?: any): Promise<{ content: string }> {
    const payload: any = { message };
    if (context) {
      payload.context = context;
    }
    const res = await harveyApi.post(`/session/${sessionId}/message`, payload);
    return res.data.data || res.data;
  },
  async uploadFile(sessionId: string, file: File): Promise<{ 
    fileId: string; 
    originalName: string; 
    size: number; 
    uploadedAt: string;
    sessionId: string;
    activeJobsCount: number;
    message: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await harveyApi.post(`/session/${sessionId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data || res.data;
  },
  async getMessages(sessionId: string): Promise<any[]> {
    const res = await harveyApi.get(`/session/${sessionId}/messages`);
    return res.data.data?.messages || [];
  },
  async getFiles(sessionId: string): Promise<any[]> {
    const res = await harveyApi.get(`/session/${sessionId}/files`);
    return res.data.data || [];
  },

  // Pricing Context Management
  async updatePricingContext(sessionId: string, fileId: string): Promise<{
    sessionId: string;
    fileId: string;
    fileName: string;
    updatedAt: string;
    message: string;
  }> {
    const res = await harveyApi.put(`/session/${sessionId}/pricing-context`, { fileId });
    return res.data.data || res.data;
  },

  async clearPricingContext(sessionId: string): Promise<{
    sessionId: string;
    clearedAt: string;
    message: string;
  }> {
    const res = await harveyApi.delete(`/session/${sessionId}/pricing-context`);
    return res.data.data || res.data;
  },

  async getPricingContextInfo(sessionId: string): Promise<{
    sessionId: string;
    hasContext: boolean;
    fileName: string | null;
    contentLength: number;
    retrievedAt: string;
  }> {
    const res = await harveyApi.get(`/session/${sessionId}/pricing-context`);
    return res.data.data || res.data;
  },
};
