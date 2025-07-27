import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    geminiApiKey: process.env.GEMINI_API_KEY!,
    port: process.env.PORT || '3001',
    pricingAnalysisApiBaseUrl: process.env.PRICING_ANALYSIS_API_BASE_URL!,
    transformationApiBaseUrl: process.env.TRANSFORMATION_API_BASE_URL,
    uploadsDir: './uploads',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000', // React frontend default
};

// Validate essential config values
if (!config.geminiApiKey || !config.pricingAnalysisApiBaseUrl) {
    console.error("FATAL ERROR: Missing essential environment variables.");
    console.error("Required: GEMINI_API_KEY, PRICING_ANALYSIS_API_BASE_URL");
    process.exit(1);
}

console.log('✅ Configuration loaded successfully');
console.log(`🚀 Server will run on port: ${config.port}`);
console.log(`🔗 Pricing Analysis API: ${config.pricingAnalysisApiBaseUrl}`);
if (config.transformationApiBaseUrl) {
    console.log(`🔗 Transformation API: ${config.transformationApiBaseUrl}`);
}
