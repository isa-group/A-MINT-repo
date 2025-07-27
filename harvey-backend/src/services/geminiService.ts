import { GoogleGenerativeAI, GenerativeModel, Content, Part, FunctionDeclaration, GenerateContentResult, SchemaType } from '@google/generative-ai';
import { config } from '../config';
import { 
  ChatMessage, 
  GeminiChatResponse,
  SessionFile, 
  FunctionCall, 
  FunctionResult,
  FunctionResponse 
} from '../interfaces/chat.types';
import { ToolOrchestrationService } from './toolOrchestrationService';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model!: GenerativeModel; // Using definite assignment assertion
  private toolOrchestration: ToolOrchestrationService;
  private currentPricingContent?: string;
  private currentPricingFileName?: string;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    this.toolOrchestration = new ToolOrchestrationService();
    this.initializeModel();
    console.log('🤖 Gemini service initialized with function calling capabilities');
  }

  private initializeModel(pricingContent?: string, pricingFileName?: string) {
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
      tools: [{
        functionDeclarations: this.getToolDefinitions()
      }],
      systemInstruction: this.getSystemPrompt(pricingContent, pricingFileName)
    });
  }

  /**
   * System prompt defining HARVEY's persona and capabilities
   */
  private getSystemPrompt(pricingContent?: string, pricingFileName?: string): string {
    const pricing2YamlSpecification = `# The Pricing2Yaml Syntax

**Pricing2Yaml** (previously known as Yaml4SaaS) emerges as a pragmatic application of the *Pricing4SaaS model*, aligning with the overarching objective of formalizing and structuring pricing information for SaaS platforms. Building upon the foundational principles articulated in *Pricing4SaaS*, Pricing2Yaml embodies a simplified and versatile YAML-based syntax designed for serializing comprehensive details about SaaS offerings. The essence of Pricing2Yaml lies in its capacity to encapsulate pricing plans, add-ons, features and usage limits within a concise and human-readable YAML format.

## Key Structure Elements:

### Features
Enumerate all the functionalities encompassed in the pricing, classifying them into types:
- INFORMATION, INTEGRATION, DOMAIN, AUTOMATION, MANAGEMENT, GUARANTEE, SUPPORT, PAYMENT
- Each feature has: description, valueType (BOOLEAN, NUMERIC, TEXT), defaultValue, type
- Additional fields depending on type (integrationType, automationType, docUrl, pricingUrls)

### Usage Limits
Expounds on limitations affecting plans, add-ons, or features:
- Types: NON_RENEWABLE, RENEWABLE, RESPONSE_DRIVEN, TIME_DRIVEN
- Each limit has: description, valueType, defaultValue, unit, linkedFeatures

### Plans
Comprehensive details about distinct pricing plans:
- Each plan has: description, price, unit, features, usageLimits
- Features and usageLimits override defaultValues when specified

### Add-ons
Additional offerings beyond core plans:
- Each add-on has: description, availableFor, price, unit, features, usageLimits, usageLimitsExtensions
- Can extend existing usage limits or provide new features

### Billing Options
Price reductions based on billing periods:
- Map of billing periods to reduction factors (0..1]
- Example: monthly: 1, annual: 0.90 (10% discount)

For complete specification details, refer to the Pricing2Yaml v2.1 documentation.`;

    const currentPricingSection = pricingContent ? `

## CURRENT PRICING FILE CONTEXT
You are currently working with the following pricing configuration file${pricingFileName ? ` (${pricingFileName})` : ''}:

\`\`\`yaml
${pricingContent}
\`\`\`

This is the active pricing configuration that users are asking about. Use this content to:
- Answer specific questions about features, plans, and pricing structure
- Provide detailed analysis of the current pricing model
- Suggest improvements or modifications based on the existing configuration
- Compare different plans and their feature sets
- Explain usage limits and their implications
- Validate the pricing structure against Pricing2Yaml specifications

When users ask about "this file", "the current pricing", or refer to specific features/plans, they are referring to this YAML content above.` : '';

    return `You are H.A.R.V.E.Y. (Holistic Analysis and Regulation Virtual Expert for You), an expert AI assistant specializing in pricing analysis and strategy. You are helpful, analytical, precise, and professional.

## PRICING2YAML SPECIFICATION CONTEXT

${pricing2YamlSpecification}

${currentPricingSection}

## Core Capabilities

1. **Pricing Analysis**: Get summaries and perform detailed analysis of pricing configurations
2. **File Management**: Help users upload and manage YAML pricing files
3. **URL Transformation**: Transform public pricing page URLs into structured YAML files
4. **Strategy Advice**: Provide general pricing strategy guidance and best practices
5. **Job Tracking**: Monitor and report on asynchronous analysis operations
6. **Intelligent Filter Processing**: Understand natural language requirements and translate them into structured pricing filters

## Key Guidelines

- Always confirm which file to use before performing operations that require a pricing YAML file
- For operations requiring a file, check if the user has uploaded one in this session
- If no file is available but the user wants analysis, ask if they have a public pricing page URL you can transform
- When a user uploads a file, proactively suggest relevant analysis operations they might find useful
- Provide clear explanations of analysis results and their business implications
- When a transformation task completes successfully, the resulting YAML file is automatically saved and set as the pricing context for the conversation
- Users will be notified when pricing context has been automatically updated after a successful transformation
- Be proactive in suggesting next steps based on analysis results
- If you detect file context in the conversation, use the uploaded file ID for analysis operations
- When a transformation completes, inform users that the resulting file has been automatically set as their pricing context and is ready for analysis

## File Handling

When handling files:
- Confirm successful uploads with a clear message including the file ID
- Always use the file ID when calling tools that require a pricing file
- Inform users about file validation results
- When a file is mentioned in context, offer specific analysis suggestions like:
  * "I can analyze this file's pricing structure with getPricingSummary"
  * "Would you like me to validate the pricing configuration?"
  * "I can find optimal subscription plans for specific requirements"

## Analysis Operations

For analysis operations:
- Explain what each operation type does before starting
- Provide context for job IDs and how to check status later
- Interpret results in business terms, not just technical output
- Suggest follow-up analyses based on initial results
- You must assume minizinc solver as the default unless specified otherwise

## Intelligent Filter Processing

When users provide natural language requirements for filtering (e.g., "I need something with lots of API calls", "find the cheapest plan with GitHub integration", "I want unlimited storage"), you must process these internally within the startPricingAnalysisJob function call:

1. **Understand the Context**: Analyze the user's natural language to identify key requirements
2. **Convert to Structured Filters**: Transform vague terms into specific filter criteria:
   - "lots of API calls" → {"usageLimits": [{"apiCalls": 1000}]}
   - "GitHub integration" → {"features": ["github", "version-control"]}
   - "unlimited storage" → {"usageLimits": [{"storage": 1000000000}]} // Assume this number for unlimited
   - "cheapest" or "budget-friendly" → {"maxPrice": reasonable_threshold}
   - "premium features" → {"features": ["advanced_feature1", "premium_feature2"]}

3. **Create Structured Filters**: Generate valid filters in JSON format:
   {
     "minPrice": number,
     "maxPrice": number,
     "features": ["featureKey1", "featureKey2"],
     "usageLimits": [{"limitKey1": minimumValue1}, {"limitKey2": minimumValue2}]
   }

4. **Pass to startPricingAnalysisJob**: Include the structured filters as a JSON string in the filters parameter when calling the analysis function

5. **If you need to use a number for unlimited storage, infinite quota or similar, use 1000000000**.

Remember: Natural language processing is handled internally - you don't need separate function calls for filter parsing. Just include well-structured filters based on user requirements directly in your startPricingAnalysisJob calls.

Remember: You help users understand their pricing strategy, not just run technical operations. Always be helpful and suggest relevant next steps based on available files and user context.`;
  }

  /**
   * Define function tools for Gemini to call
   */
  private getToolDefinitions(): FunctionDeclaration[] {
    return [
      {
      name: 'getPricingSummary',
      description: 'Uploads a pricing configuration YAML file and returns a synchronous summary of its key metrics. Use this for quick overviews of pricing structure.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
        pricingFileId: {
          type: SchemaType.STRING,
          description: 'The unique identifier of a previously uploaded YAML file that the user confirmed to use for this operation.'
        }
        },
        required: ['pricingFileId']
      }
      },
      {
      name: 'startPricingAnalysisJob',
        description: 'Uploads a pricing YAML file and starts an asynchronous analysis job (validate, optimal, subscriptions, filter). Returns a job ID to track status.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
        pricingFileId: {
          type: SchemaType.STRING,
          description: 'The unique identifier of a previously uploaded YAML file.'
        },
        operation: {
          type: SchemaType.STRING,
          format: "enum" as const,
          enum: ['validate', 'optimal', 'subscriptions', 'filter'],
          description: 'The type of analysis to perform.'
        },
        solver: {
          type: SchemaType.STRING,
          description: 'The solver to use (e.g., "minizinc", "choco").'
        },
        filters: {
          type: SchemaType.OBJECT,
          properties: {
          minPrice: {
            type: SchemaType.NUMBER,
            description: 'Minimum price threshold for filtering plans.'
          },
          maxPrice: {
            type: SchemaType.NUMBER,
            description: 'Maximum price threshold for filtering plans.'
          },
          features: {
            type: SchemaType.ARRAY,
            items: {
            type: SchemaType.STRING,
            description: 'List of feature keys to filter plans by.'
            },
            description: 'List of feature keys to include in the filter criteria.'
          },
          usageLimits: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {},
              description: 'Each object represents a single usage limit type (e.g., {"apiCalls": 10000}).'
              },
            description: 'Array of objects, each with a single key-value pair: [{"limitKey1": minimumValue1}, {"limitKey2": minimumValue2}, ...]'
          }
          },
          description: 'Optional JSON string containing filter criteria. Structure: {"minPrice": number, "maxPrice": number, "features": ["featureKey1"], "usageLimits": [{"limitKey1": minimumValue1}, {"limitKey2": minimumValue2}]} . When user provides natural language requirements, parse them using the pricing file context to create this structured format.'
        },
        objective: {
          type: SchemaType.STRING,
          format: "enum" as const,
          enum: ['minimize', 'maximize'],
          description: 'Optimization objective for optimal operations.'
        },
        jobSpecificPayload: {
          type: SchemaType.STRING,
          description: 'Optional JSON string with operation-specific parameters.'
        }
        },
        required: ['pricingFileId', 'operation', 'solver']
      }
      },
      {
      name: 'getPricingAnalysisJobStatus',
      description: 'Retrieves the status and results (if completed) of a previously started asynchronous pricing analysis job.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
        jobId: {
          type: SchemaType.STRING,
          description: 'The unique identifier of the analysis job to check.'
        }
        },
        required: ['jobId']
      }
      },
      {
      name: 'initiatePricingPageTransformation',
      description: 'Takes a public URL of a SaaS pricing page and initiates transformation into a structured YAML pricing file. This is an asynchronous process.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
        url: {
          type: SchemaType.STRING,
          description: 'The public URL of the pricing page to transform.'
        },
        model: {
          type: SchemaType.STRING,
          description: 'Optional AI model for transformation (e.g., "gemini-2.0-flash").'
        },
        max_tries: {
          type: SchemaType.INTEGER,
          description: 'Optional maximum number of tries for fixing YAML syntax.'
        }
        },
        required: ['url']
      }
      },
      {
      name: 'getTransformationTaskStatus',
      description: 'Check the status of a URL-to-YAML transformation task and retrieve results when completed.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
        taskId: {
          type: SchemaType.STRING,
          description: 'The unique identifier of the transformation task to check.'
        }
        },
        required: ['taskId']
      }
      },
      {
      name: 'getPricingStrategyAdvice',
      description: 'Provides general advice, best practices, or explanations about pricing strategies, concepts, or how to interpret analysis results. Does not call external APIs.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
        topic: {
          type: SchemaType.STRING,
          description: 'The specific pricing topic, concept, or question the user needs advice about.'
        }
        },
        required: ['topic']
      }
      }
    ];
  }

  /**
   * Convert internal ChatMessage format to Gemini Content format
   */
  private convertToGeminiContent(messages: ChatMessage[]): Content[] {
    console.log('[GeminiService] convertToGeminiContent: Entered with messages count:', messages.length);
    const geminiContents = messages.map(msg => {
      const parts: Part[] = msg.parts.map(part => {
        if (part.text) {
          return { text: part.text };
        } else if (part.functionCall) {
          return {
            functionCall: {
              name: part.functionCall.name,
              args: part.functionCall.arguments
            }
          };
        } else if (part.functionResponse) {
          return {
            functionResponse: {
              name: part.functionResponse.name,
              response: part.functionResponse.response // Ensure this is an object
            }
          };
        }
        console.error('[GeminiService] convertToGeminiContent: Invalid message part type encountered:', part);
        throw new Error('Invalid message part type');
      });

      return {
        role: msg.role === 'model' ? 'model' : msg.role === 'tool' ? 'function' : 'user',
        parts
      };
    });
    console.log('[GeminiService] convertToGeminiContent: Conversion result:', JSON.stringify(geminiContents, null, 2));
    return geminiContents;
  }

  /**
   * Main method to generate responses from chat messages
   */
  async generateResponse(chatHistory: ChatMessage[], sessionContext?: any): Promise<GeminiChatResponse> {
    console.log('[GeminiService] generateResponse: Entered with chatHistory count:', chatHistory.length);
    console.log('[GeminiService] generateResponse: Session context provided:', !!sessionContext);
    try {
      console.log('[GeminiService] generateResponse: Converting chat history to Gemini content...');
      const conversationHistory = this.convertToGeminiContent(chatHistory);
      
      // Determinar qué modelo usar basado en el contexto de precios de la sesión
      let modelToUse = this.model;
      if (sessionContext?.pricingContext) {
        console.log('[GeminiService] generateResponse: Using session-specific pricing context');
        modelToUse = this.createModelWithSessionContext(
          sessionContext.pricingContext.content,
          sessionContext.pricingContext.fileName
        );
      } else {
        console.log('[GeminiService] generateResponse: Using default model without session pricing context');
      }
      
      console.log('[GeminiService] generateResponse: Sending content to Gemini for generation (1st call). History:', JSON.stringify(conversationHistory, null, 2));
      const result = await modelToUse.generateContent({
        contents: conversationHistory
      });
      console.log('[GeminiService] generateResponse: Received response from Gemini (1st call).');

      const response = result.response;
      const functionCalls = response.functionCalls(); // This is a method call

      if (functionCalls && functionCalls.length > 0) {
        const fc = functionCalls[0]; // Assuming one function call for now
        console.log(`[GeminiService] generateResponse: Function call detected: ${fc.name}`, JSON.stringify(fc.args, null, 2));
        
        const functionCallToExecute = {
          name: fc.name,
          arguments: fc.args || {}
        };

        console.log('[GeminiService] generateResponse: Executing tool via toolOrchestrationService...');
        // Use actual session context if provided, otherwise use default
        const contextToUse = sessionContext || { sessionId: 'temp-session-for-tool', files: new Map() };
        const toolResult = await this.toolOrchestration.executeFunctionCalls(
          [functionCallToExecute],
          contextToUse // Pass the session context with files
        );
        const actualToolResult = toolResult[0]; // Assuming executeFunctionCalls returns an array of results

        console.log('[GeminiService] generateResponse: Tool executed. Result:', JSON.stringify(actualToolResult, null, 2));
        
        console.log('[GeminiService] generateResponse: Sending tool result back to Gemini...');
        const finalResponseText = await this.sendToolResultBackToGemini(
          functionCallToExecute,
          actualToolResult, // Pass the actual result from the array
          chatHistory, // Pass the original chat history
          modelToUse // Pass the model instance that was used
        );
        console.log('[GeminiService] generateResponse: Received final response from Gemini after tool execution:', finalResponseText);

        return {
          content: finalResponseText,
          functionCalls: [functionCallToExecute], // Return the original function call that was made
          usage: {
            promptTokens: response.usageMetadata?.promptTokenCount || 0,
            completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
            totalTokens: response.usageMetadata?.totalTokenCount || 0
            // Note: This usage might only be for the first call. Consider summing up if needed.
          }
        };
      } else {
        const content = response.text();
        console.log('[GeminiService] generateResponse: No function call. Direct response:', content);
        return {
          content: content,
          usage: {
            promptTokens: response.usageMetadata?.promptTokenCount || 0,
            completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
            totalTokens: response.usageMetadata?.totalTokenCount || 0
          }
        };
      }
    } catch (error: any) {
      console.error('[GeminiService] generateResponse: Caught error:', error.message, error.stack, error.errorDetails || '');
      throw new Error(`Failed to generate response: ${error.message}`);
    } finally {
      console.log('[GeminiService] generateResponse: Exited');
    }
  }

  /**
   * Send tool result back to Gemini and get final response
   */
  public async sendToolResultBackToGemini(
    functionCall: FunctionCall, // This is our internal FunctionCall type
    toolResult: any,
    chatHistory: ChatMessage[], // Original chat history
    modelToUse: GenerativeModel // The model instance to use for the final response
  ): Promise<string> {
    console.log('[GeminiService] sendToolResultBackToGemini: Entered.');
    console.log('[GeminiService] sendToolResultBackToGemini: FunctionCall:', JSON.stringify(functionCall, null, 2));
    console.log('[GeminiService] sendToolResultBackToGemini: ToolResult:', JSON.stringify(toolResult, null, 2));

    try {
      // Construct the history for Gemini, including the original function call from the model,
      // and the function response from the tool.
      const messagesWithToolResponse: ChatMessage[] = [
        ...chatHistory, // All previous messages
        { // The model's request to call the function
          role: 'model',
          parts: [{
            functionCall: { // Matches Gemini's expected structure for a call
              name: functionCall.name,
              arguments: functionCall.arguments,
            }
          }]
        },
        { // The result of executing the function
          role: 'tool',
          parts: [{
            functionResponse: {
              name: functionCall.name,
              response: { result: toolResult } // Ensure 'response' is an object
            }
          }]
        }
      ];
      
      console.log('[GeminiService] sendToolResultBackToGemini: Converting updated history to Gemini content...');
      const conversationHistoryForFinalResponse = this.convertToGeminiContent(messagesWithToolResponse);

      console.log('[GeminiService] sendToolResultBackToGemini: Sending content to Gemini for final response (2nd call). History:', JSON.stringify(conversationHistoryForFinalResponse, null, 2));
      const result = await modelToUse.generateContent({
        contents: conversationHistoryForFinalResponse,
      });
      console.log('[GeminiService] sendToolResultBackToGemini: Received final response from Gemini.');

      const finalContent = result.response.text();
      console.log('[GeminiService] sendToolResultBackToGemini: Final content text:', finalContent);
      return finalContent;
    } catch (error: any) {
      console.error('[GeminiService] sendToolResultBackToGemini: Error sending tool result or getting final response:', error.message, error.stack, error.errorDetails || '');
      throw new Error(`Failed to process tool result: ${error.message}`);
    } finally {
      console.log('[GeminiService] sendToolResultBackToGemini: Exited');
    }
  }

  /**
   * Update the model context with new pricing file content
   */
  public updatePricingContext(pricingContent: string, pricingFileName?: string): void {
    console.log('[GeminiService] updatePricingContext: Updating model context with new pricing file');
    this.currentPricingContent = pricingContent;
    this.currentPricingFileName = pricingFileName;
    
    // Reinitialize the model with the new context
    this.initializeModel(pricingContent, pricingFileName);
    console.log('[GeminiService] updatePricingContext: Model reinitialized with pricing context');
  }

  /**
   * Clear the current pricing context
   */
  public clearPricingContext(): void {
    console.log('[GeminiService] clearPricingContext: Clearing pricing context');
    this.currentPricingContent = undefined;
    this.currentPricingFileName = undefined;
    
    // Reinitialize the model without pricing context
    this.initializeModel();
    console.log('[GeminiService] clearPricingContext: Model reinitialized without pricing context');
  }

  /**
   * Get current pricing context info
   */
  public getCurrentPricingContext(): { content?: string; fileName?: string } {
    return {
      content: this.currentPricingContent,
      fileName: this.currentPricingFileName
    };
  }

  /**
   * Create a temporary model with session-specific pricing context
   */
  private createModelWithSessionContext(pricingContent?: string, pricingFileName?: string): GenerativeModel {
    return this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
      tools: [{
        functionDeclarations: this.getToolDefinitions()
      }],
      systemInstruction: this.getSystemPrompt(pricingContent, pricingFileName)
    });
  }

  /**
   * Process function result and get final response using session-specific context
   */
  public async processToolResultWithSessionContext(
    functionCall: FunctionCall,
    toolResult: any,
    chatHistory: ChatMessage[],
    sessionPricingContext?: { content: string; fileName: string }
  ): Promise<string> {
    // Determinar qué modelo usar basado en el contexto de precios de la sesión
    let modelToUse = this.model;
    if (sessionPricingContext) {
      console.log('[GeminiService] processToolResultWithSessionContext: Using session-specific pricing context');
      modelToUse = this.createModelWithSessionContext(
        sessionPricingContext.content,
        sessionPricingContext.fileName
      );
    }
    
    return await this.sendToolResultBackToGemini(
      functionCall,
      toolResult,
      chatHistory,
      modelToUse
    );
  }
}

export const geminiService = new GeminiService();