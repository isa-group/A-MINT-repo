import { AnalysisAPIClient } from '../api/analysisAPI';
import { TransformationAPIClient } from '../api/transformationAPI';
import { FileManager } from '../utils/fileManager';
import { FunctionCall } from '../interfaces/chat.types';
import { SessionFile } from '../interfaces/chat.types';
import { JobOperationType, JobSolverType } from '../interfaces/pricingAPI.types';

export class ToolOrchestrationService {
    private analysisAPI: AnalysisAPIClient;
    private transformationAPI: TransformationAPIClient | null;
    private fileManager: FileManager;
    private taskUrlMap: Map<string, string>; // Store original URLs for tasks

    constructor() {
        this.analysisAPI = new AnalysisAPIClient();
        this.fileManager = new FileManager();
        this.taskUrlMap = new Map();
        
        // Initialize transformation API only if configured
        try {
            this.transformationAPI = new TransformationAPIClient();
            console.log('🔗 Transformation API client initialized');
        } catch (error) {
            console.log('⚠️ Transformation API not configured, URL transformation will be unavailable');
            this.transformationAPI = null;
        }

        console.log('🔧 Tool orchestration service initialized');
    }

    /**
     * Handle function calls from Gemini
     */
    async handleToolCall(
        functionCall: FunctionCall, // This is our internal FunctionCall type
        currentSessionFiles: Map<string, SessionFile> // Assuming this context is passed or managed
    ): Promise<any> {
        console.log(`[ToolOrchestrationService] handleToolCall: Entered for function: ${functionCall.name}`);
        console.log(`[ToolOrchestrationService] handleToolCall: Arguments:`, JSON.stringify(functionCall.arguments, null, 2));
        
        try {
            let result;
            switch (functionCall.name) {
                case 'getPricingSummary':
                    console.log('[ToolOrchestrationService] handleToolCall: Routing to handleGetPricingSummary.');
                    result = await this.handleGetPricingSummary(functionCall.arguments, currentSessionFiles);
                    break;
                case 'startPricingAnalysisJob':
                    console.log('[ToolOrchestrationService] handleToolCall: Routing to handleStartPricingAnalysisJob.');
                    result = await this.handleStartPricingAnalysisJob(functionCall.arguments, currentSessionFiles);
                    break;
                case 'getPricingAnalysisJobStatus':
                    console.log('[ToolOrchestrationService] handleToolCall: Routing to handleGetPricingAnalysisJobStatus.');
                    result = await this.handleGetPricingAnalysisJobStatus(functionCall.arguments);
                    break;
                case 'initiatePricingPageTransformation':
                    console.log('[ToolOrchestrationService] handleToolCall: Routing to handleInitiatePricingPageTransformation.');
                    result = await this.handleInitiatePricingPageTransformation(functionCall.arguments);
                    break;
                case 'getTransformationTaskStatus':
                    console.log('[ToolOrchestrationService] handleToolCall: Routing to handleGetTransformationTaskStatus.');
                    result = await this.handleGetTransformationTaskStatus(functionCall.arguments);
                    break;
                case 'getPricingStrategyAdvice':
                    console.log('[ToolOrchestrationService] handleToolCall: Routing to handleGetPricingStrategyAdvice.');
                    result = await this.handleGetPricingStrategyAdvice(functionCall.arguments);
                    break;
                case 'getAvailableTransformationFiles':
                    console.log('[ToolOrchestrationService] handleToolCall: Routing to handleGetAvailableTransformationFiles.');
                    result = await this.handleGetAvailableTransformationFiles(functionCall.arguments);
                    break;
                default:
                    console.error(`[ToolOrchestrationService] handleToolCall: Unknown function call name: ${functionCall.name}`);
                    throw new Error(`Unknown function call: ${functionCall.name}`);
            }
            console.log(`[ToolOrchestrationService] handleToolCall: Result for ${functionCall.name}:`, JSON.stringify(result, null, 2));
            return result;
        } catch (error: any) {
            console.error(`[ToolOrchestrationService] handleToolCall: Error during execution of ${functionCall.name}:`, error.message, error.stack);
            // It's important that this error is propagated or handled in a way that Gemini can understand
            // For now, rethrowing to be caught by GeminiService
            throw error; 
        } finally {
            console.log(`[ToolOrchestrationService] handleToolCall: Exited for function: ${functionCall.name}`);
        }
    }

    /**
     * Handle pricing summary request
     */
    private async handleGetPricingSummary(
        args: any,
        currentSessionFiles: Map<string, SessionFile>
    ): Promise<any> {
        const { pricingFileId } = args;
        
        if (!pricingFileId) {
            return {
                error: true,
                message: 'Missing required parameter: pricingFileId'
            };
        }

        // First try to find in current session files
        let sessionFile = currentSessionFiles.get(pricingFileId);
        
        // If not found in session, try to find in transformation files
        if (!sessionFile) {
            const transformationFiles = await this.getAvailableTransformationFiles();
            sessionFile = transformationFiles.find(file => file.id === pricingFileId);
            
            if (!sessionFile) {
                return {
                    error: true,
                    message: `File with ID ${pricingFileId} not found in current session or transformation files. Please upload a pricing YAML file or complete a transformation first.`
                };
            }
        }

        // Validate file exists and is accessible
        const filePath = sessionFile.path;
        const validation = this.fileManager.validateYamlFile(filePath);
        if (!validation.isValid) {
            return {
                error: true,
                message: `Invalid YAML file: ${validation.error}`
            };
        }

        try {
            const summary = await this.analysisAPI.getSummary(filePath);
            return {
                success: true,
                data: summary,
                fileName: sessionFile.originalName,
                fileSource: currentSessionFiles.has(pricingFileId) ? 'session' : 'transformation',
                message: 'Pricing summary generated successfully'
            };
        } catch (error: any) {
            return {
                error: true,
                message: `Failed to get pricing summary: ${error.message}`
            };
        }
    }

    /**
     * Handle starting an analysis job
     */
    private async handleStartPricingAnalysisJob(
        args: any,
        currentSessionFiles: Map<string, SessionFile>
    ): Promise<any> {
        const { pricingFileId, operation, solver, filters, objective, jobSpecificPayload } = args;
        
        // Validate required parameters
        if (!pricingFileId || !operation || !solver) {
            return {
                error: true,
                message: 'Missing required parameters: pricingFileId, operation, and solver are required'
            };
        }

        // First try to find in current session files
        let sessionFile = currentSessionFiles.get(pricingFileId);
        
        // If not found in session, try to find in transformation files
        if (!sessionFile) {
            const transformationFiles = await this.getAvailableTransformationFiles();
            sessionFile = transformationFiles.find(file => file.id === pricingFileId);
            
            if (!sessionFile) {
                return {
                    error: true,
                    message: `File with ID ${pricingFileId} not found in current session or transformation files. Please upload a pricing YAML file or complete a transformation first.`
                };
            }
        }

        // Validate operation type
        const validOperations: JobOperationType[] = ['validate', 'optimal', 'subscriptions', 'filter'];
        if (!validOperations.includes(operation)) {
            return {
                error: true,
                message: `Invalid operation type. Must be one of: ${validOperations.join(', ')}`
            };
        }

        try {
            const jobResponse = await this.analysisAPI.startAnalysisJob(
                sessionFile.path,
                operation as JobOperationType,
                solver as JobSolverType,
                filters,
                objective,
                jobSpecificPayload
            );

            return {
                success: true,
                data: jobResponse,
                fileName: sessionFile.originalName,
                fileSource: currentSessionFiles.has(pricingFileId) ? 'session' : 'transformation',
                message: `Analysis job started successfully. Job ID: ${jobResponse.jobId}`
            };
        } catch (error: any) {
            return {
                error: true,
                message: `Failed to start analysis job: ${error.message}`
            };
        }
    }

    /**
     * Handle getting job status
     */
    private async handleGetPricingAnalysisJobStatus(args: any): Promise<any> {
        const { jobId } = args;
        
        if (!jobId) {
            return {
                error: true,
                message: 'Missing required parameter: jobId'
            };
        }

        try {
            const jobStatus = await this.analysisAPI.getJobStatus(jobId);
            return {
                success: true,
                data: jobStatus,
                message: `Job status retrieved for ${jobId}`
            };
        } catch (error: any) {
            return {
                error: true,
                message: `Failed to get job status: ${error.message}`
            };
        }
    }

    /**
     * Handle URL to YAML transformation
     */
    private async handleInitiatePricingPageTransformation(args: any): Promise<any> {
        const { url, model, max_tries } = args;
        
        if (!url) {
            return {
                error: true,
                message: 'Missing required parameter: url'
            };
        }

        if (!this.transformationAPI) {
            return {
                error: true,
                message: 'Transformation service is not available. Please contact the administrator.'
            };
        }

        // Validate URL format
        try {
            new URL(url);
        } catch {
            return {
                error: true,
                message: 'Invalid URL format. Please provide a valid HTTP/HTTPS URL.'
            };
        }

        try {
            const transformResponse = await this.transformationAPI.startTransformation(url, model, max_tries);
            
            // Store the original URL for later use when the task completes
            this.taskUrlMap.set(transformResponse.task_id, url);
            
            return {
                success: true,
                data: transformResponse,
                message: `Transformation started for ${url}. Task ID: ${transformResponse.task_id}. This process may take a few minutes.`
            };
        } catch (error: any) {
            return {
                error: true,
                message: `Failed to start transformation: ${error.message}`
            };
        }
    }

    /**
     * Handle getting transformation task status
     */
    private async handleGetTransformationTaskStatus(args: any): Promise<any> {
        const { taskId } = args;
        
        if (!taskId) {
            return {
                error: true,
                message: 'Missing required parameter: taskId'
            };
        }

        if (!this.transformationAPI) {
            return {
                error: true,
                message: 'Transformation service is not available.'
            };
        }

        try {
            const transformationResult = await this.transformationAPI.getTransformationStatus(taskId);
            
            // If completed successfully, save the result as a session file
            let additionalInfo = {};
            let savedFileInfo = null;
            
            if (transformationResult.status === 'COMPLETED' && transformationResult.yamlContent) {
                try {
                    // Get the original URL from our stored map, or use a default
                    const originalUrl = this.taskUrlMap.get(taskId) || `transformation-${taskId}`;
                    
                    savedFileInfo = this.fileManager.saveTransformationResult(
                        taskId, 
                        transformationResult.yamlContent, 
                        originalUrl
                    );
                    
                    // Clean up the stored URL after successful save
                    this.taskUrlMap.delete(taskId);
                    
                    // AUTO-SET AS PRICING CONTEXT: Update GeminiService with the new pricing file content
                    try {
                        // Import GeminiService here to avoid circular dependencies
                        const { geminiService } = await import('./geminiService');
                        geminiService.updatePricingContext(transformationResult.yamlContent, savedFileInfo.originalName);
                        console.log(`🤖 Transformation result automatically set as pricing context: ${savedFileInfo.originalName}`);
                    } catch (contextError: any) {
                        console.warn('Failed to automatically update pricing context:', contextError.message);
                        // Don't fail the entire operation if context update fails
                    }
                    
                    additionalInfo = {
                        yamlContentPreview: transformationResult.yamlContent.substring(0, 200) + '...',
                        yamlSize: transformationResult.yamlContent.length,
                        canBeUsedForAnalysis: true,
                        savedFile: {
                            fileId: savedFileInfo.id,
                            fileName: savedFileInfo.originalName,
                            path: savedFileInfo.path
                        },
                        contextAutoUpdated: true
                    };
                    
                    console.log(`📁 Transformation result saved as file: ${savedFileInfo.originalName} (ID: ${savedFileInfo.id})`);
                } catch (saveError: any) {
                    console.error('Error saving transformation result:', saveError.message);
                    // Still return the transformation result even if saving fails
                    additionalInfo = {
                        yamlContentPreview: transformationResult.yamlContent.substring(0, 200) + '...',
                        yamlSize: transformationResult.yamlContent.length,
                        canBeUsedForAnalysis: true,
                        saveError: `Failed to save file: ${saveError.message}`,
                        contextAutoUpdated: false
                    };
                }
            }

            return {
                success: true,
                data: { 
                    ...transformationResult, 
                    ...additionalInfo,
                    taskId: taskId
                },
                message: transformationResult.status === 'COMPLETED' 
                    ? `Transformation completed for ${taskId}${savedFileInfo ? '. File saved and automatically set as pricing context for this conversation.' : ''}`
                    : `Transformation task status retrieved for ${taskId}`
            };
        } catch (error: any) {
            return {
                error: true,
                message: `Failed to get transformation status: ${error.message}`
            };
        }
    }

    /**
     * Handle pricing strategy advice (this is handled directly by Gemini)
     */
    private async handleGetPricingStrategyAdvice(args: any): Promise<any> {
        console.log('[ToolOrchestrationService] handleGetPricingStrategyAdvice: Entered.');
        console.log('[ToolOrchestrationService] handleGetPricingStrategyAdvice: Args:', JSON.stringify(args, null, 2));
        const { topic } = args;
        
        if (!topic) {
            console.error('[ToolOrchestrationService] handleGetPricingStrategyAdvice: Error - Topic is required.');
            throw new Error('Topic is required for pricing strategy advice');
        }

        const response = {
            success: true,
            adviceRequested: true,
            topic: topic,
            message: `Generating pricing strategy advice for topic: ${topic}. The AI will provide this directly.`
        };
        console.log('[ToolOrchestrationService] handleGetPricingStrategyAdvice: Returning:', JSON.stringify(response, null, 2));
        console.log('[ToolOrchestrationService] handleGetPricingStrategyAdvice: Exited.');
        return response;
    }

    /**
     * Handle getting available transformation files
     */
    private async handleGetAvailableTransformationFiles(args: any): Promise<any> {
        try {
            const transformationFiles = await this.getAvailableTransformationFiles();
            
            return {
                success: true,
                data: {
                    files: transformationFiles,
                    count: transformationFiles.length
                },
                message: `Found ${transformationFiles.length} transformation file(s) available for analysis`
            };
        } catch (error: any) {
            return {
                error: true,
                message: `Failed to get transformation files: ${error.message}`
            };
        }
    }

    /**
     * Get available transformation files for the current session
     */
    async getAvailableTransformationFiles(): Promise<SessionFile[]> {
        try {
            return this.fileManager.getTransformationFiles();
        } catch (error: any) {
            console.error('Error getting transformation files:', error.message);
            return [];
        }
    }

    /**
     * Save completed transformation result to session files
     */
    async saveTransformationResult(
        taskId: string,
        yamlContent: string,
        originalUrl: string
    ): Promise<{ fileId: string; fileName: string }> {
        const fileInfo = this.fileManager.saveTransformationResult(taskId, yamlContent, originalUrl);
        
        return {
            fileId: fileInfo.id,
            fileName: fileInfo.originalName
        };
    }

    /**
     * Execute multiple function calls
     */
    async executeFunctionCalls(
        functionCalls: FunctionCall[], // Our internal FunctionCall type
        session: any // Session context, adjust as needed
    ): Promise<any[]> {
        console.log('[ToolOrchestrationService] executeFunctionCalls: Entered with call count:', functionCalls.length);
        console.log('[ToolOrchestrationService] executeFunctionCalls: Session context (summary):', { sessionId: session?.sessionId, fileCount: session?.files?.size });

        const results = [];
        for (const funcCall of functionCalls) {
            console.log(`[ToolOrchestrationService] executeFunctionCalls: Processing call: ${funcCall.name}`);
            // Assuming currentSessionFiles can be derived from 'session' or is globally accessible for this context
            // This part might need adjustment based on your actual session management for files.
            const currentSessionFiles = session.files || new Map<string, SessionFile>();
            const result = await this.handleToolCall(funcCall, currentSessionFiles);
            results.push(result);
        }
        console.log('[ToolOrchestrationService] executeFunctionCalls: All calls processed. Results count:', results.length);
        console.log('[ToolOrchestrationService] executeFunctionCalls: Exited.');
        return results;
    }
}

export const toolOrchestrationService = new ToolOrchestrationService();
