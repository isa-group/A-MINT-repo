# Frontend A-MINT - Modern Web Interface

The A-MINT frontend is a modern web application developed with React, TypeScript and Vite, which provides an intuitive and responsive user interface to interact with all capabilities of the A-MINT ecosystem. It includes an interactive dashboard, visual analysis tools and an integrated conversational assistant.

## 🎯 Main Features

### 🎨 Modern and Responsive Interface
- **Modern design**: Contemporary UI/UX with Tailwind CSS
- **Responsive design**: Optimized for desktop, tablet and mobile
- **Dark/light theme**: Toggle between viewing modes
- **Reusable components**: Modular component library

### 📊 Interactive Dashboard
- **Data visualization**: Interactive charts and tables
- **Real-time analysis**: Automatic update of results
- **Dynamic filters**: Advanced search and filtering
- **Data export**: Download results in multiple formats

### 🤖 Harvey Integration
- **Conversational chat**: Integrated chat interface with Harvey
- **File upload**: Drag & drop for iPricing YAML files
- **Task tracking**: Real-time monitoring of transformations
- **Smart suggestions**: Contextual recommendations

### 🔄 Analysis Management
- **Analysis configuration**: Intuitive forms for CSP analysis
- **Visual results**: Graphical representation of optimal configurations
- **Price comparison**: Visual comparison tools
- **Analysis history**: Access to previous analyses

## 🏗️ Arquitectura Frontend

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Architecture                   │
├─────────────────────────────────────────────────────────────┤
│  React 19 + TypeScript + Vite                              │
│  ├─ Componentes funcionales con hooks                       │
│  ├─ Gestión de estado con Context API                       │
│  ├─ Routing con React Router v7                             │
│  └─ Hot Module Replacement (HMR)                            │
├─────────────────────────────────────────────────────────────┤
│  UI/UX Layer                                               │
│  ├─ Tailwind CSS para estilos                               │
│  ├─ Framer Motion para animaciones                          │
│  ├─ Lucide React para iconografía                           │
│  └─ React Hot Toast para notificaciones                     │
├─────────────────────────────────────────────────────────────┤
│  Data Management                                           │
│  ├─ Axios para HTTP requests                                │
│  ├─ React Query para cache y sincronización                 │
│  ├─ Zustand para estado global                              │
│  └─ Context providers para datos compartidos                │
├─────────────────────────────────────────────────────────────┤
│  Visualization Layer                                       │
│  ├─ Recharts para gráficos                                  │
│  ├─ React Markdown para renderizado                         │
│  ├─ Syntax highlighting para código                         │
│  └─ Tablas virtualizadas para grandes datasets              │
├─────────────────────────────────────────────────────────────┤
│  API Integration                                           │
│  ├─ Analysis API Client                                     │
│  ├─ Harvey Chat Client                                      │
│  ├─ Transformation API Client                               │
│  └─ File Upload Service                                     │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Instalación y Configuración

### Configuración de Variables de Entorno

```bash
# .env.local
VITE_API_URL=http://localhost:8002/api/v1
VITE_TRANSFORMATION_API_URL=http://localhost:8001/api/v1
VITE_HARVEY_API_URL=http://localhost:3001/api/chat
VITE_APP_TITLE=A-MINT Dashboard
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=true
```

### Desarrollo Local

```bash
# 1. Navegar al directorio
cd frontend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus configuraciones

# 4. Ejecutar en modo desarrollo
npm run dev

# 5. Construir para producción
npm run build

# 6. Preview de build de producción
npm run preview
```

### Comandos de Desarrollo

```bash
# Desarrollo con hot reload
npm run dev

# Construcción para producción
npm run build

# Linting de código
npm run lint

# Preview de producción local
npm run preview

# Análisis de bundle
npm run analyze
```

## 📱 Estructura de Componentes

### Páginas Principales

```
src/pages/
├── Dashboard/              # Dashboard principal
│   ├── index.tsx          # Página principal del dashboard
│   ├── Overview.tsx       # Resumen general
│   ├── Analytics.tsx      # Análisis y métricas
│   └── RecentActivity.tsx # Actividad reciente
├── Analysis/              # Herramientas de análisis
│   ├── index.tsx          # Página principal de análisis
│   ├── ConfigurationForm.tsx # Formulario de configuración
│   ├── ResultsViewer.tsx  # Visualizador de resultados
│   └── ComparisonTool.tsx # Herramienta de comparación
├── Transformation/        # Transformación de URLs
│   ├── index.tsx          # Página de transformación
│   ├── URLInput.tsx       # Input para URLs
│   ├── TaskMonitor.tsx    # Monitor de tareas
│   └── ResultsDisplay.tsx # Visualización de resultados
├── Chat/                  # Interfaz de Harvey
│   ├── index.tsx          # Chat principal
│   ├── ChatWindow.tsx     # Ventana de conversación
│   ├── FileUpload.tsx     # Upload de archivos
│   └── SuggestionPanel.tsx # Panel de sugerencias
└── Settings/              # Configuración
    ├── index.tsx          # Página de configuración
    ├── APISettings.tsx    # Configuración de APIs
    └── Preferences.tsx    # Preferencias de usuario
```

### Componentes Reutilizables

```typescript
// src/components/ui/
export { Button } from './Button';
export { Card } from './Card';
export { Input } from './Input';
export { Modal } from './Modal';
export { Table } from './Table';
export { Chart } from './Chart';
export { FileUploader } from './FileUploader';
export { LoadingSpinner } from './LoadingSpinner';
export { ErrorBoundary } from './ErrorBoundary';
export { Notification } from './Notification';
```

## 🚀 Despliegue

### Build para Producción

```bash
# Build optimizado
npm run build

# Análisis del bundle
npm run analyze

# Preview local del build
npm run preview
```
