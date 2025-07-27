import axios from 'axios';

const transformationApi = axios.create({
  baseURL: import.meta.env.VITE_TRANSFORMATION_API_URL,
  withCredentials: false,
});

export const transformationAPI = {
  async startTransformation({ url, model, max_tries }: { url: string; model?: string; max_tries?: number }) {
    const res = await transformationApi.post('/transform', { url, model, max_tries });
    return res.data;
  },
  async startTransformationMultipart(formData: FormData) {
    const res = await transformationApi.post('/transform', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  async getStatus(taskId: string) {
    try {
      const res = await transformationApi.get(`/transform/status/${taskId}`, {
        responseType: 'text', // Accept both JSON and text responses
        validateStatus: (status) => status < 500 // Accept 4xx responses
      });
      
      // Check if response is YAML (completed task) or JSON (pending/failed)
      const contentType = res.headers['content-type'] || '';
      
      if (contentType.includes('application/x-yaml') || contentType.includes('text/plain') || 
          (typeof res.data === 'string' && res.data.includes('name:'))) {
        // This is a YAML file response, meaning the task is completed
        return {
          status: 'COMPLETED',
          yamlContent: res.data
        };
      } else {
        // This is a JSON status response
        const jsonData = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
        return jsonData;
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Task not found');
      }
      throw error;
    }
  },
  async downloadYaml(taskId: string) {
    const res = await transformationApi.get(`/transform/download/${taskId}`, { responseType: 'blob' });
    return res.data;
  },
};
