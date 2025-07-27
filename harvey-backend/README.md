# Harvey Backend - Intelligent Conversational Assistant

Harvey is an advanced conversational assistant developed with Node.js and TypeScript, which integrates artificial intelligence capabilities to facilitate interaction with all functionalities of the A-MINT ecosystem. It uses Google Gemini for natural language processing and orchestrates multiple services to provide interactive SaaS pricing analysis.

## 🎯 Main Features

### 🤖 Advanced Conversational Intelligence
- **Natural language processing**: Contextual understanding of complex queries
- **Tool orchestration**: Intelligent execution of multiple services
- **Session management**: Maintenance of persistent conversational context
- **Structured responses**: Intelligent formatting of analysis results

### 🔧 Analysis Capabilities
- **URL transformation**: Automatic conversion of pricing pages to YAML
- **Configuration analysis**: Interactive CSP analysis of specifications
- **File management**: Upload and validation of iPricing YAML files
- **Strategic recommendations**: Pricing advice based on analysis

### 🌐 Complete Integration
- **A-MINT API**: Web page transformations to structured specifications
- **Analysis API**: CSP analysis and configuration optimization
- **Gemini AI**: Advanced natural language processing
- **File management**: Secure handling of uploads and session context

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Harvey Backend                          │
├─────────────────────────────────────────────────────────────┤
│  API Layer (Express.js + TypeScript)                       │
│  ├─ Chat endpoints                                          │
│  ├─ File upload handling                                    │
│  ├─ Session management                                      │
│  └─ Health checks                                           │
├─────────────────────────────────────────────────────────────┤
│  Core Services                                             │
│  ├─ GeminiService (conversational AI)                       │
│  ├─ ToolOrchestrationService (coordination)                 │
│  ├─ FileManager (file management)                           │
│  └─ SessionManager (persistent context)                     │
├─────────────────────────────────────────────────────────────┤
│  External API Clients                                      │
│  ├─ AnalysisAPIClient                                       │
│  ├─ TransformationAPIClient                                 │
│  └─ ChocolateAPIClient                                      │
├─────────────────────────────────────────────────────────────┤
│  Storage Layer                                             │
│  ├─ Session data                                            │
│  ├─ Uploaded files                                          │
│  ├─ Conversation history                                    │
│  └─ Transformation results                                  │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Installation and Configuration

### Environment Variables Configuration

```bash
# Main configuration
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# External APIs
PRICING_ANALYSIS_API_BASE_URL=http://analysis-api:3000
TRANSFORMATION_API_BASE_URL=http://a-mint-api:8000

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# File configuration
MAX_FILE_SIZE=50MB
UPLOAD_DIRECTORY=./uploads
```

### Local Development

```bash
# 1. Navigate to directory
cd harvey-backend

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your configurations

# 4. Run in development mode
npm run dev

# 5. Build for production
npm run build
npm start
```

### Using Docker

```bash
# Build image
docker build -t harvey-backend .

# Run container
docker run -p 3000:3000 \
  -e GEMINI_API_KEY=your-key \
  -e PRICING_ANALYSIS_API_BASE_URL=http://analysis-api:3000 \
  -v $(pwd)/uploads:/app/uploads \
  harvey-backend
```

## 💬 Chat API

### Main Endpoint

**POST** `/api/chat`

Main endpoint to interact with Harvey through natural conversation.

```bash
curl -X POST "http://localhost:3000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Analiza esta URL de precios: https://ejemplo.com/pricing",
    "sessionId": "usuario_123"
  }'
```

**Parámetros de entrada**:
```typescript
interface ChatRequest {
  message: string;           // Mensaje del usuario
  sessionId: string;         // ID único de la sesión
  fileId?: string;          // ID de archivo opcional para contexto
  options?: {
    model?: string;         // Modelo específico a usar
    temperature?: number;   // Control de creatividad (0.0-1.0)
    maxTokens?: number;     // Límite de tokens en respuesta
  };
}
```

**Respuesta típica**:
```json
{
  "response": "He iniciado el análisis de la URL que proporcionaste. La transformación está en progreso con el ID de tarea: task_abc123. Te notificaré cuando esté completa.",
  "sessionId": "usuario_123",
  "toolsUsed": [
    {
      "name": "initiatePricingPageTransformation",
      "success": true,
      "data": {
        "task_id": "task_abc123",
        "status": "PENDING"
      }
    }
  ],
  "context": {
    "activeTasks": ["task_abc123"],
    "uploadedFiles": [],
    "transformationFiles": []
  },
  "suggestions": [
    "Mientras la transformación está en progreso, puedes subir un archivo YAML existente para análisis inmediato",
    "¿Te gustaría que configure notificaciones cuando la transformación esté completa?"
  ]
}
```

### Upload de Archivos

**POST** `/api/upload`

Subir archivos iPricing YAML para análisis.

```bash
curl -X POST "http://localhost:3000/api/upload" \
  -F "file=@mi-pricing.yaml" \
  -F "sessionId=usuario_123"
```

**Respuesta**:
```json
{
  "success": true,
  "fileId": "file_xyz789",
  "originalName": "mi-pricing.yaml",
  "size": 2048,
  "validationResult": {
    "isValid": true,
    "saasName": "MiSaaS",
    "planCount": 3,
    "featureCount": 15
  },
  "message": "Archivo subido y validado exitosamente. Ya está disponible para análisis."
}
```

## 🛠️ Herramientas Disponibles

Harvey puede ejecutar automáticamente las siguientes herramientas basándose en el contexto de la conversación:

### 1. Transformación de URLs a YAML

**Herramienta**: `initiatePricingPageTransformation`

Convierte páginas web de precios en especificaciones iPricing YAML estructuradas.

**Casos de uso**:
- "Analiza esta página de precios: https://ejemplo.com/pricing"
- "Convierte a YAML la información de precios de esta URL"
- "Transforma esta página web en formato estructurado"

### 2. Obtención de Resúmenes de Precios

**Herramienta**: `getPricingSummary`

Genera resúmenes estadísticos de especificaciones de precios.

**Casos de uso**:
- "Dame un resumen del archivo que subí"
- "¿Cuáles son las estadísticas principales de este pricing?"
- "Muéstrame un análisis general de los precios"

### 3. Análisis CSP Avanzado

**Herramienta**: `startPricingAnalysisJob`

Inicia análisis de satisfacción de restricciones para optimización y validación.

**Casos de uso**:
- "Encuentra la configuración más barata que incluya estas características"
- "Valida si este pricing es matemáticamente coherente"
- "¿Cuáles son todas las configuraciones posibles bajo 50 dólares?"

### 4. Seguimiento de Estado

**Herramienta**: `getTransformationTaskStatus`

Verifica el progreso de transformaciones en curso.

**Casos de uso**:
- "¿Cómo va la transformación que iniciaste?"
- "¿Ya está lista la conversión de la URL?"
- "Verifica el estado de la tarea pendiente"

### 5. Consejos Estratégicos

**Herramienta**: `getPricingStrategyAdvice`

Proporciona recomendaciones estratégicas basadas en mejores prácticas.

**Casos de uso**:
- "¿Qué opinas de esta estrategia de precios?"
- "Dame consejos para mejorar mi modelo de precios"
- "¿Cómo podría optimizar estos precios?"

