import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { GeminiService } from '../services/geminiService';
import { FileManager } from '../utils/fileManager';
import { ToolOrchestrationService } from '../services/toolOrchestrationService';
import { AppError } from '../utils/errorHandler';
import { 
  ChatSession, 
  ChatMessage,
  SessionFile, 
  ChatRequest,
  ChatResponse,
  FunctionCall,
  FunctionResult,
  GeminiChatResponse
} from '../interfaces/chat.types';

export class ChatController {
  private geminiService: GeminiService;
  private fileManager: FileManager;
  private toolOrchestrationService: ToolOrchestrationService;
  private sessions: Map<string, ChatSession>;

  constructor() {
    this.geminiService = new GeminiService();
    this.fileManager = new FileManager();
    this.toolOrchestrationService = new ToolOrchestrationService();
    this.sessions = new Map();
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Initializes a new chat session
   */
  public async initializeSession(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionId = uuidv4();
      const session: ChatSession = {
        id: sessionId,
        sessionId, // For compatibility
        createdAt: new Date(),
        lastActivity: new Date(),
        messages: [],
        files: [],
        jobs: [],
        activeJobs: [], // For compatibility - point to jobs
        transformationTasks: []
      };

      this.sessions.set(sessionId, session);

      // Clear any previous pricing context before initializing a new session
      this.geminiService.clearPricingContext();
      console.log('🆕 New session started, pricing context cleared');

      res.status(201).json({
        success: true,
        sessionId,
        message: 'Chat session initialized successfully'
      });
    } catch (error) {
      next(new AppError('Failed to initialize chat session', 500));
    }
  }

  /**
   * Handles chat conversations with HARVEY
   */
  public async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId, message } = req.body as ChatRequest;
      
      if (!sessionId || !message) {
        return next(new AppError('SessionId and message are required', 400));
      }

      const session = this.sessions.get(sessionId);
      if (!session) {
        return next(new AppError('Session not found', 404));
      }

      // Update last activity
      session.lastActivity = new Date();

      // Process uploaded files if they exist
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        const files = req.files as Express.Multer.File[];
        
        for (const file of files) {
          const savedFile = await this.fileManager.saveUploadedFile(file);
          const sessionFile: SessionFile = {
            id: savedFile.id,
            fileId: savedFile.id, // For compatibility
            originalName: file.originalname,
            filename: savedFile.filename,
            path: savedFile.path,
            size: file.size,
            uploadedAt: new Date(),
            status: 'uploaded'
          };
          session.files.push(sessionFile);

          // Detect if it's a pricing YAML file and update the session context
          if (this.isPricingYamlFile(file.originalname, savedFile.path)) {
            try {
              const pricingContent = fs.readFileSync(savedFile.path, 'utf-8');
              // Set the specific pricing context for this session
              session.pricingContext = {
                content: pricingContent,
                fileName: file.originalname,
                fileId: savedFile.id
              };
              console.log('🔄 Pricing context updated for session with file:', file.originalname);
            } catch (contextError) {
              console.error('⚠️ Error updating pricing context:', contextError);
              // Do not fail the file upload due to this error
            }
          }
        }
      }

      // Create user message
      const userMessage: ChatMessage = {
        role: 'user',
        parts: [{ text: message }]
      };

      // Add message to history
      session.messages.push(userMessage);

      // Prepare conversation history for Gemini with session context
      const sessionContext = {
        sessionId: session.id,
        files: new Map(session.files.map(file => [file.id, file])),
        pricingContext: session.pricingContext // Include session-specific pricing context
      };
      
      const geminiResponse = await this.geminiService.generateResponse(session.messages, sessionContext);

      // Create model response message
      const modelMessage: ChatMessage = {
        role: 'model',
        parts: [{ text: geminiResponse.content }]
      };

      // Add response to history
      session.messages.push(modelMessage);

      // Handle function calls if they exist
      let functionResults: FunctionResult[] = [];
      
      if (geminiResponse.functionCalls && geminiResponse.functionCalls.length > 0) {
        // Execute function calls
        for (const functionCall of geminiResponse.functionCalls) {
          const result = await this.toolOrchestrationService.executeFunctionCalls([functionCall], session);
          
          functionResults.push({
            name: functionCall.name,
            result: result[0]
          });
        }

        // If there are function calls, get the final response
        if (functionResults.length > 0) {
          const finalResponse = await this.geminiService.processToolResultWithSessionContext(
            geminiResponse.functionCalls[0],
            functionResults[0].result,
            session.messages,
            session.pricingContext
          );

          // Update the model message with the final response
          modelMessage.parts = [{ text: finalResponse }];
        }
      }

      // Update activeJobs for compatibility
      session.activeJobs = session.jobs.filter(job => job.status === 'pending' || job.status === 'running');

      const response: ChatResponse = {
        sessionId,
        reply: geminiResponse.content,
        timestamp: new Date(),
        hasAttachments: session.files.length > 0,
        activeJobsCount: session.activeJobs.length,
        functionCalls: geminiResponse.functionCalls,
        functionResults,
        usage: geminiResponse.usage
      };

      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      console.error('Error in chat:', error);
      
      const errorResponse: ChatResponse = {
        sessionId: req.body.sessionId || 'unknown',
        reply: 'Sorry, an internal error has occurred. Please try again.',
        timestamp: new Date(),
        hasAttachments: false,
        activeJobsCount: 0,
        error: 'Internal error while generating response'
      };

      res.status(500).json({
        success: false,
        data: errorResponse
      });
    }
  }

  /**
   * Uploads files to a specific session
   */
  public async uploadFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      
      console.log('⬆️ File upload request for session:', sessionId);
      console.log('📄 Received file information:', req.file);
      
      if (!req.file) {
        console.error('❌ Error: No file provided');
        return next(new AppError('No file was provided', 400));
      }

      const session = this.sessions.get(sessionId);
      if (!session) {
        console.error('❌ Error: Session not found:', sessionId);
        // Clean up the uploaded file if the session doesn't exist
        try {
          if (req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
            console.log(`🗑️ File deleted due to session not found: ${req.file.path}`);
          }
        } catch (unlinkError) {
          console.error('Error deleting temporary file:', unlinkError);
        }
        return next(new AppError('Session not found', 404));
      }

      console.log('✅ Session found, saving file...');
      
      try {
        const savedFile = await this.fileManager.saveUploadedFile(req.file);
        console.log('💾 File saved:', savedFile);
        
        const sessionFile: SessionFile = {
          id: savedFile.id,
          fileId: savedFile.id, // For compatibility
          originalName: req.file.originalname,
          filename: savedFile.filename,
          path: savedFile.path,
          size: req.file.size || (fs.existsSync(savedFile.path) ? fs.statSync(savedFile.path).size : 0),
          uploadedAt: new Date(),
          status: 'uploaded'
        };

        session.files.push(sessionFile);
        session.lastActivity = new Date();

        // Detect if it's a pricing YAML file and update Gemini's context
        if (this.isPricingYamlFile(req.file.originalname, savedFile.path)) {
          try {
            const pricingContent = fs.readFileSync(savedFile.path, 'utf-8');
            this.geminiService.updatePricingContext(pricingContent, req.file.originalname);
            console.log('🔄 Pricing context updated in Gemini with file:', req.file.originalname);
          } catch (contextError) {
            console.error('⚠️ Error updating pricing context:', contextError);
            // Do not fail the file upload due to this error
          }
        }

        console.log('✅ File added to session successfully');
        
        res.status(201).json({
          success: true,
          data: {
            sessionId: session.id,
            fileId: savedFile.id,
            originalName: req.file.originalname,
            size: sessionFile.size,
            uploadedAt: sessionFile.uploadedAt,
            activeJobsCount: session.activeJobs?.length || 0,
            message: 'File uploaded successfully'
          }
        });
      } catch (fileError: any) {
        console.error('❌ Error processing file:', fileError);
        return next(new AppError(`Error processing file: ${fileError.message}`, 500));
      }

    } catch (error: any) {
      console.error('❌ Detailed error in uploadFile:', error);
      next(new AppError(`Error uploading file: ${error.message}`, 500));
    }
  }

  /**
   * Gets the session status
   */
  public async getSessionStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      
      const session = this.sessions.get(sessionId);
      if (!session) {
        return next(new AppError('Session not found', 404));
      }

      res.json({
        success: true,
        data: {
          sessionId: session.id,
          filesCount: session.files.length,
          activeJobsCount: session.activeJobs.length,
          transformationTasksCount: session.transformationTasks.length,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity
        }
      });

    } catch (error) {
      next(new AppError('Error getting session status', 500));
    }
  }

  /**
   * Gets the files from the session
   */
  public async getSessionFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      
      const session = this.sessions.get(sessionId);
      if (!session) {
        return next(new AppError('Session not found', 404));
      }

      res.json({
        success: true,
        data: session.files
      });

    } catch (error) {
      next(new AppError('Error getting session files', 500));
    }
  }

  /**
   * Deletes a file from the session
   */
  public async deleteSessionFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId, fileId } = req.params;
      
      const session = this.sessions.get(sessionId);
      if (!session) {
        return next(new AppError('Session not found', 404));
      }

      const fileIndex = session.files.findIndex(f => f.id === fileId);
      if (fileIndex === -1) {
        return next(new AppError('File not found', 404));
      }

      const file = session.files[fileIndex];
      
      // Delete file from the file system
      await this.fileManager.deleteFile(file.path);
      
      // Remove from the session
      session.files.splice(fileIndex, 1);
      session.lastActivity = new Date();

      res.json({
        success: true,
        message: 'File deleted successfully'
      });

    } catch (error) {
      next(new AppError('Error deleting file', 500));
    }
  }

  /**
   * Deletes a complete session
   */
  public async deleteSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      
      const session = this.sessions.get(sessionId);
      if (!session) {
        return next(new AppError('Session not found', 404));
      }

      // Delete all files from the session
      for (const file of session.files) {
        try {
          await this.fileManager.deleteFile(file.path);
        } catch (error) {
          console.warn(`Could not delete file: ${file.path}`, error);
        }
      }

      // Delete session
      this.sessions.delete(sessionId);

      res.json({
        success: true,
        message: 'Session deleted successfully'
      });

    } catch (error) {
      next(new AppError('Error deleting session', 500));
    }
  }

  /**
   * Cleans up inactive sessions (called periodically)
   */
  public async cleanupInactiveSessions() {
    const now = new Date();
    const inactiveThreshold = 24 * 60 * 60 * 1000; // 24 hours

    const sessionsToDelete: string[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      const inactiveTime = now.getTime() - session.lastActivity.getTime();
      
      if (inactiveTime > inactiveThreshold) {
        console.log(`Cleaning up inactive session: ${sessionId}`);
        
        // Delete files
        for (const file of session.files) {
          try {
            await this.fileManager.deleteFile(file.path);
          } catch (error) {
            console.warn(`Could not delete file: ${file.path}`, error);
          }
        }

        sessionsToDelete.push(sessionId);
      }
    }

    // Delete sessions after iterating
    for (const sessionId of sessionsToDelete) {
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Builds the context for Gemini based on the session
   */
  private buildContextForGemini(session: ChatSession, message: string): string {
    let context = `User: ${message}\n\n`;

    // Add information about files if they exist
    if (session.files.length > 0) {
      context += `Available files in the session (${session.files.length}):\n`;
      session.files.forEach((file, index) => {
        context += `${index + 1}. ${file.originalName} (ID: ${file.id})\n`;
      });
      context += '\n';
    }

    // Add information about active jobs
    if (session.activeJobs.length > 0) {
      context += `Active analysis jobs (${session.activeJobs.length}):\n`;
      session.activeJobs.forEach((job, index) => {
        context += `${index + 1}. Job ID: ${job.id}, Status: ${job.status}\n`;
      });
      context += '\n';
    }

    // Add information about transformation tasks
    if (session.transformationTasks.length > 0) {
      context += `Active transformation tasks (${session.transformationTasks.length}):\n`;
      session.transformationTasks.forEach((task, index) => {
        context += `${index + 1}. Task ID: ${task.id}, Status: ${task.status}\n`;
      });
      context += '\n';
    }

    return context;
  }

  /**
   * Create a new chat session
   */
  public async createSession(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = this.generateSessionId();
      const session: ChatSession = {
        id: sessionId,
        sessionId, // For compatibility
        createdAt: new Date(),
        lastActivity: new Date(),
        messages: [],
        files: [],
        jobs: [],
        activeJobs: [], // For compatibility
        transformationTasks: []
      };

      // Store session in memory (in production, use a database)
      this.sessions.set(sessionId, session);

      // Clear any previous pricing context before creating a new session
      this.geminiService.clearPricingContext();
      console.log('🆕 New session created, pricing context cleared');

      res.json({
        success: true,
        data: {
          sessionId,
          createdAt: session.createdAt
        }
      });
    } catch (error) {
      console.error('Error creating session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create session'
      });
    }
  }

  /**
   * Send a message to the chat session
   */
  public async sendMessage(req: Request, res: Response): Promise<void> {
    console.log('[ChatController] sendMessage: Entered');
    try {
      const { sessionId } = req.params;
      const { message, context } = req.body;

      console.log(`[ChatController] sendMessage: Session ID: ${sessionId}`);
      console.log(`[ChatController] sendMessage: Received message: "${message}"`);
      console.log(`[ChatController] sendMessage: Context:`, context);

      if (!sessionId || !message) {
        console.log('[ChatController] sendMessage: Error - Session ID or message missing');
        res.status(400).json({ success: false, error: 'Session ID and message are required' });
        return;
      }

      const session = this.sessions.get(sessionId);
      if (!session) {
        console.log(`[ChatController] sendMessage: Error - Session not found for ID: ${sessionId}`);
        res.status(404).json({ success: false, error: 'Session not found' });
        return;
      }

      session.lastActivity = new Date();

      // Create user message, potentially enhanced with file context
      let userMessageText = message;
      if (context && context.uploadedFile) {
        userMessageText += `\n\n[Context: User has uploaded a file "${context.uploadedFile.originalName}" with ID "${context.uploadedFile.fileId}" that is available for pricing analysis.]`;
      }

      const userMessage: ChatMessage = {
        role: 'user',
        parts: [{ text: userMessageText }]
      };
      session.messages.push(userMessage);

      const chatHistory = [...session.messages];
      console.log('[ChatController] sendMessage: Preparing to call geminiService.generateResponse. Current chat history length:', chatHistory.length);

      // Pass session context to Gemini for tool calls
      const sessionContext = {
        sessionId: session.id,
        files: new Map(session.files.map(file => [file.id, file])),
        pricingContext: session.pricingContext // Include session-specific pricing context
      };

      const geminiResponse = await this.geminiService.generateResponse(chatHistory, sessionContext);
      console.log('[ChatController] sendMessage: Received response from geminiService:', geminiResponse);

      if (geminiResponse.content || geminiResponse.functionCalls) {
        const modelMessage: ChatMessage = {
          role: 'model',
          parts: []
        };
        if (geminiResponse.content) {
          modelMessage.parts.push({ text: geminiResponse.content });
        }
        if (geminiResponse.functionCalls && geminiResponse.functionCalls.length > 0) {
          // Store the fact that a function call was made, the actual execution result will be a separate 'tool' message
          modelMessage.parts.push(...geminiResponse.functionCalls.map(fc => ({ functionCall: fc })));
        }
        session.messages.push(modelMessage);
      }


      console.log('[ChatController] sendMessage: Sending success response to client.');
      res.status(200).json({
        success: true,
        data: {
          content: geminiResponse.content,
          functionCalls: geminiResponse.functionCalls,
          usage: geminiResponse.usage
        }
      });
    } catch (error: any) {
      console.error('[ChatController] sendMessage: Caught error:', error.message, error.stack);
      // Ensure a response is sent even if an unexpected error occurs
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Failed to send message due to an internal error' });
      }
    }
    console.log('[ChatController] sendMessage: Exited');
  }

  /**
   * Get session information
   */
  public async getSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const session = this.sessions.get(sessionId);

      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Session not found'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          sessionId: session.id,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity,
          messageCount: session.messages.length,
          fileCount: session.files.length,
          activeJobsCount: session.jobs.filter(job => job.status === 'running' || job.status === 'pending').length
        }
      });
    } catch (error) {
      console.error('Error getting session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get session'
      });
    }
  }

  /**
   * Get all messages from a session
   */
  public async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const session = this.sessions.get(sessionId);

      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Session not found'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          messages: session.messages,
          count: session.messages.length
        }
      });
    } catch (error) {
      console.error('Error getting messages:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get messages'
      });
    }
  }

  /**
   * Manually updates the pricing context of the Gemini service
   */
  public async updatePricingContext(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const { fileId } = req.body;

      if (!fileId) {
        return next(new AppError('FileId is required', 400));
      }

      const session = this.sessions.get(sessionId);
      if (!session) {
        return next(new AppError('Session not found', 404));
      }

      // Find the file in the session
      const sessionFile = session.files.find(f => f.id === fileId);
      if (!sessionFile) {
        return next(new AppError('File not found in the session', 404));
      }

      // Verify if the file exists physically
      if (!fs.existsSync(sessionFile.path)) {
        return next(new AppError('File not found in the system', 404));
      }

      // Read the file content and update the session-specific context
      try {
        const pricingContent = fs.readFileSync(sessionFile.path, 'utf-8');
        
        // Set the specific pricing context for this session
        session.pricingContext = {
          content: pricingContent,
          fileName: sessionFile.originalName,
          fileId: sessionFile.id
        };
        
        session.lastActivity = new Date();
        console.log(`🔧 Pricing context set for session ${sessionId}: ${sessionFile.originalName}`);

        res.json({
          success: true,
          message: `Pricing context updated with file: ${sessionFile.originalName}`,
          data: {
            sessionId,
            fileId,
            fileName: sessionFile.originalName,
            updatedAt: new Date()
          }
        });
      } catch (contextError) {
        console.error('Error updating pricing context:', contextError);
        return next(new AppError('Error updating pricing context', 500));
      }
    } catch (error) {
      console.error('Error in updatePricingContext:', error);
      next(new AppError('Internal error while updating pricing context', 500));
    }
  }

  /**
   * Clears the pricing context of the Gemini service
   */
  public async clearPricingContext(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;

      const session = this.sessions.get(sessionId);
      if (!session) {
        return next(new AppError('Session not found', 404));
      }

      // Clear the session-specific pricing context
      session.pricingContext = undefined;
      session.lastActivity = new Date();
      console.log(`🧹 Pricing context cleared for session ${sessionId}`);

      res.json({
        success: true,
        message: 'Pricing context cleared successfully',
        data: {
          sessionId,
          clearedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error in clearPricingContext:', error);
      next(new AppError('Internal error while clearing pricing context', 500));
    }
  }

  /**
   * Gets information about the current pricing context
   */
  public async getPricingContextInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;

      const session = this.sessions.get(sessionId);
      if (!session) {
        return next(new AppError('Session not found', 404));
      }

      // Get information from the session-specific context
      const hasContext = !!session.pricingContext;
      const fileName = session.pricingContext?.fileName || null;
      const contentLength = session.pricingContext?.content ? session.pricingContext.content.length : 0;

      res.json({
        success: true,
        data: {
          sessionId,
          hasContext,
          fileName,
          contentLength,
          retrievedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error in getPricingContextInfo:', error);
      next(new AppError('Internal error while getting context information', 500));
    }
  }

  /**
   * Detects if a file is a pricing YAML based on its name and content
   */
  private isPricingYamlFile(originalName: string, filePath: string): boolean {
    try {
      // Check file extension
      const fileExtension = originalName.toLowerCase();
      if (!fileExtension.endsWith('.yaml') && !fileExtension.endsWith('.yml')) {
        return false;
      }

      // Read a sample of the content to verify if it's a pricing file
      const content = fs.readFileSync(filePath, 'utf-8');
      const firstLines = content.split('\n').slice(0, 50).join('\n').toLowerCase();
      
      // Look for typical indicators of Pricing2Yaml files
      const pricingIndicators = [
        'version:',
        'features:',
        'plans:',
      ];

      const foundIndicators = pricingIndicators.filter(indicator => 
        firstLines.includes(indicator)
      );

      // If we find at least 3 indicators, we consider it a pricing file
      return foundIndicators.length >= 3;
    } catch (error) {
      console.error('Error detecting pricing YAML file:', error);
      return false;
    }
  }
}