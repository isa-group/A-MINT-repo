import axios, { AxiosInstance, AxiosResponse } from 'axios';
import FormData = require('form-data');
import * as fs from 'fs';
import { config } from '../config';
import {
    PricingSummaryResponse,
    AnalysisJobRequest,
    JobCreationResponse,
    GetJobDetailsResponse,
    JobOperationType,
    JobSolverType
} from '../interfaces/pricingAPI.types';

export interface FilterCriteria {
  minPrice?: number;
  maxPrice?: number;
  features?: string[];
  usageLimits?: Record<string, number>[];
}

export class AnalysisAPIClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: config.pricingAnalysisApiBaseUrl,
            timeout: 30000, // 30 seconds
            headers: {
                'Accept': 'application/json',
            }
        });

        // Add request interceptor for logging
        this.client.interceptors.request.use(
            (config) => {
                console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                console.error('❌ API Request Error:', error);
                return Promise.reject(error);
            }
        );

        // Add response interceptor for logging
        this.client.interceptors.response.use(
            (response) => {
                console.log(`📥 API Response: ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                console.error(`❌ API Response Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
                return Promise.reject(error);
            }
        );
    }

    /**
     * Get pricing summary from uploaded YAML file
     */
    async getSummary(filePath: string): Promise<PricingSummaryResponse> {
        try {
            const formData = new FormData();
            formData.append('pricingFile', fs.createReadStream(filePath));

            const response: AxiosResponse<PricingSummaryResponse> = await this.client.post(
                '/api/v1/pricing/summary',
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                    }
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('Error getting pricing summary:', error.response?.data || error.message);
            throw new Error(`Failed to get pricing summary: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Start an analysis job with the uploaded YAML file
     */
    async startAnalysisJob(
        filePath: string,
        operation: JobOperationType,
        solver: JobSolverType,
        filters?: FilterCriteria,
        objective?: 'minimize' | 'maximize',
        jobSpecificPayload?: string
    ): Promise<JobCreationResponse> {
        try {
            const formData = new FormData();
            formData.append('pricingFile', fs.createReadStream(filePath));
            formData.append('operation', operation);
            formData.append('solver', solver);
            
            if (filters) {
                formData.append('filters', JSON.stringify(filters));
            }
            if (objective) {
                formData.append('objective', objective);
            }
            if (jobSpecificPayload) {
                formData.append('jobSpecificPayload', jobSpecificPayload);
            }

            const response: AxiosResponse<JobCreationResponse> = await this.client.post(
                '/api/v1/pricing/analysis',
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                    }
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('Error starting analysis job:', error.response?.data || error.message);
            throw new Error(`Failed to start analysis job: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Get the status and results of an analysis job
     */
    async getJobStatus(jobId: string): Promise<GetJobDetailsResponse> {
        try {
            const response: AxiosResponse<GetJobDetailsResponse> = await this.client.get(
                `/api/v1/pricing/analysis/${jobId}`
            );

            return response.data;
        } catch (error: any) {
            console.error('Error getting job status:', error.response?.data || error.message);
            throw new Error(`Failed to get job status: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Health check for the Analysis API
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await this.client.get('/api/v1/health');
            return response.data.status === 'UP';
        } catch (error) {
            console.error('Analysis API health check failed:', error);
            return false;
        }
    }
}
