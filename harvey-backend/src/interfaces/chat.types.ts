/**
 * TypeScript interfaces for HARVEY chat functionality
 */

// Function calling interfaces
export interface FunctionCall {
    name: string;
    arguments: Record<string, any>;
}

export interface FunctionResult {
    name: string;
    result: any;
}

export interface FunctionResponse {
    name: string;
    response: any; // Cambiado para ser compatible con la API de Gemini
}

// Chat message interfaces - Compatible with Gemini format
export interface MessagePart {
    text?: string;
    functionCall?: FunctionCall;
    functionResponse?: FunctionResponse;
}

export interface ChatMessage {
    role: 'user' | 'model' | 'tool';
    parts: MessagePart[];
}

// Chat response from Gemini
export interface GeminiChatResponse {
    content: string;
    functionCalls?: FunctionCall[];
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

// Session file management
export interface SessionFile {
    id: string;
    fileId: string; // Added for compatibility
    originalName: string;
    filename: string;
    path: string;
    size: number;
    uploadedAt: Date;
    status: 'uploaded' | 'processing' | 'analyzed' | 'error';
}

// Job tracking
export interface SessionJob {
    id: string;
    type: 'analysis' | 'transformation';
    status: 'pending' | 'running' | 'completed' | 'failed';
    fileId?: string;
    createdAt: Date;
    completedAt?: Date;
    result?: any;
    error?: string;
}

// Transformation task
export interface SessionTransformationTask {
    id: string;
    taskId: string; // Added for compatibility
    fileId: string;
    transformationType: string;
    parameters: Record<string, any>;
    status: 'pending' | 'running' | 'completed' | 'failed';
    createdAt: Date;
    completedAt?: Date;
    result?: any;
    error?: string;
}

// Main session interface
export interface ChatSession {
    id: string;
    sessionId: string; // Added for compatibility
    createdAt: Date;
    lastActivity: Date;
    messages: ChatMessage[];
    files: SessionFile[];
    jobs: SessionJob[];
    activeJobs: SessionJob[]; // Added for compatibility
    transformationTasks: SessionTransformationTask[];
    // Pricing context specific to this session
    pricingContext?: {
        content: string;
        fileName: string;
        fileId: string;
    };
}

// API Request/Response interfaces
export interface ChatRequest {
    sessionId: string;
    message: string;
}

export interface UploadFileResponse {
    success: boolean;
    data?: {
        fileId: string;
        originalName: string;
        size: number;
        uploadedAt: Date;
    };
    error?: string;
}

export interface ChatMessageResponse {
    success: boolean;
    data?: {
        messageId: string;
        content: string;
        timestamp: Date;
        functionCalls?: FunctionCall[];
        functionResults?: FunctionResult[];
        usage?: {
            promptTokens: number;
            completionTokens: number;
            totalTokens: number;
        };
        error?: string;
    };
    error?: string;
}

// Error response
export interface ErrorResponse {
    success: false;
    error: string;
    message?: string;
    statusCode?: number;
}

// Additional interfaces for the new implementation
export interface ChatResponse {
    sessionId: string;
    reply: string;
    timestamp: Date;
    hasAttachments: boolean;
    activeJobsCount: number;
    functionCalls?: FunctionCall[];
    functionResults?: FunctionResult[];
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    error?: string;
}

// Updated ChatMessage with optional properties for backward compatibility
export interface LegacyChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    functionCalls?: FunctionCall[];
    functionResults?: FunctionResult[];
}
