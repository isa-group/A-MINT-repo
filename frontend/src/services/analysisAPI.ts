import api from './api';

export interface FilterObject {
  minPrice?: number;
  maxPrice?: number;
  features?: string[];
  usageLimits?: Record<string, number>;
}

export interface ParsedFiltersResponse {
  filters: FilterObject;
  explanation: string;
  suggestions?: string[];
}

export const analysisAPI = {
  async getSummary(file: File) {
    const formData = new FormData();
    formData.append('pricingFile', file);
    const res = await api.post('/pricing/summary', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async startAnalysisJob(params: {
    file: File;
    operation: string;
    solver: string;
    filters?: FilterObject;
    objective?: string;
  }) {
    const formData = new FormData();
    formData.append('pricingFile', params.file);
    formData.append('operation', params.operation);
    formData.append('solver', params.solver);
    if (params.filters) formData.append('filters', JSON.stringify(params.filters));
    if (params.objective) formData.append('objective', params.objective);
    const res = await api.post('/pricing/analysis', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async getJobStatus(jobId: string) {
    const res = await api.get(`/pricing/analysis/${jobId}`);
    return res.data;
  },

  /**
   * Parse natural language input into structured filters using AI
   * @param naturalLanguageInput - User's natural language description of their needs
   * @param pricingFile - The YAML file to analyze for context
   * @returns Structured filters object with explanation
   */
  async parseNaturalLanguageFilters(naturalLanguageInput: string, pricingFile: File): Promise<ParsedFiltersResponse> {
    const formData = new FormData();
    formData.append('pricingFile', pricingFile);
    formData.append('naturalLanguageInput', naturalLanguageInput);
    
    const res = await api.post('/pricing/parse-filters', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  /**
   * Get available features and usage metrics from a pricing YAML file
   * @param pricingFile - The YAML file to analyze
   * @returns Available features and usage metrics for autocomplete/suggestions
   */
  async getAvailableMetrics(pricingFile: File) {
    const formData = new FormData();
    formData.append('pricingFile', pricingFile);
    
    const res = await api.post('/pricing/metrics', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};
