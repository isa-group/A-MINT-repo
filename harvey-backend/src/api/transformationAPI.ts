import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { config } from '../config';

// Types for Transformation API (based on conceptual API)
export interface TransformRequest {
    url: string;
    model?: string;
    max_tries?: number;
}

export interface TransformResponse {
    task_id: string;
    status: string;
    message: string;
}

export interface TaskStatusResponse {
    task_id?: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    progress?: number;
    message?: string;
    result?: {
        yaml_content?: string;
        file_path?: string;
    };
    error?: string;
    created_at?: string;
    updated_at?: string;
}

export interface TransformationResult {
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    yamlContent?: string;
    error?: string;
    canBeUsedForAnalysis?: boolean;
}

export class TransformationAPIClient {
    private client: AxiosInstance;

    constructor() {
        if (!config.transformationApiBaseUrl) {
            throw new Error('Transformation API base URL not configured');
        }

        this.client = axios.create({
            baseURL: config.transformationApiBaseUrl,
            timeout: 60000, // 60 seconds for transformation operations
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
        });

        // Add request interceptor for logging
        this.client.interceptors.request.use(
            (config) => {
                console.log(`📤 Transform API Request: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                console.error('❌ Transform API Request Error:', error);
                return Promise.reject(error);
            }
        );

        // Add response interceptor for logging
        this.client.interceptors.response.use(
            (response) => {
                console.log(`📥 Transform API Response: ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                console.error(`❌ Transform API Response Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
                return Promise.reject(error);
            }
        );
    }

    /**
     * Start transformation of a pricing page URL to YAML
     */
    async startTransformation(
        url: string,
        model?: string,
        max_tries?: number
    ): Promise<TransformResponse> {
        try {
            const payload: TransformRequest = {
                url,
                ...(model && { model }),
                ...(max_tries && { max_tries })
            };

            const response: AxiosResponse<TransformResponse> = await this.client.post(
                '/api/v1/transform',
                payload
            );

            return response.data;
        } catch (error: any) {
            console.error('Error starting transformation:', error.response?.data || error.message);
            throw new Error(`Failed to start transformation: ${error.response?.data?.detail || error.message}`);
        }
    }

    /**
     * Get the status and result of a transformation task
     * Handles both JSON responses (for pending/failed) and file responses (for completed)
     */
    async getTransformationStatus(taskId: string): Promise<TransformationResult> {
        try {
            const response = await this.client.get(
                `/api/v1/transform/status/${taskId}`,
                {
                    responseType: 'arraybuffer', // Handle both text and binary responses
                    validateStatus: (status) => status < 500 // Accept 4xx responses
                }
            );

            // Check content type to determine response format
            const contentType = response.headers['content-type'] || '';
            
            if (contentType.includes('application/json')) {
                // JSON response for pending/failed tasks
                const jsonData = JSON.parse(Buffer.from(response.data).toString('utf8'));
                return {
                    status: jsonData.status,
                    error: jsonData.error,
                    canBeUsedForAnalysis: false
                };
            } else if (contentType.includes('application/x-yaml') || contentType.includes('text/plain')) {
                // File response for completed tasks
                const yamlContent = Buffer.from(response.data).toString('utf8');
                return {
                    status: 'COMPLETED',
                    yamlContent: yamlContent,
                    canBeUsedForAnalysis: true
                };
            } else {
                throw new Error(`Unexpected content type: ${contentType}`);
            }
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new Error('Task not found');
            }
            console.error('Error getting transformation status:', error.response?.data || error.message);
            throw new Error(`Failed to get transformation status: ${error.response?.data?.detail || error.message}`);
        }
    }

    /**
     * Health check for the Transformation API
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await this.client.get('/health');
            return response.data.status === 'UP' || response.status === 200;
        } catch (error) {
            console.error('Transformation API health check failed:', error);
            return false;
        }
    }
}
