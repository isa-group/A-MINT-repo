# A-MINT: Automated Modeling of iPricings from Natural Text

[![License](https://img.shields.io/badge/License-CC%20BY--SA%204.0-lightgrey.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Node 18+](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-required-blue.svg)](https://www.docker.com/)

A-MINT is an advanced artificial intelligence platform that automates the extraction, analysis, and transformation of SaaS pricing information from natural web pages into structured specifications in iPricing YAML format. The system combines advanced web scraping techniques, natural language processing (NLP), and analysis with constraint satisfaction problem (CSP) algorithms to offer a complete pricing management and intelligence solution.

## 🎯 Main Features

### 🤖 Intelligent AI Processing
- **Automated extraction**: Conversion of pricing pages in natural language to structured iPricing YAML specifications
- **Multiple AI providers**: Compatible with OpenAI, Gemini, Azure OpenAI and other OpenAI-compatible providers
- **Intelligent validation**: Automatic verification and correction of iPricing specifications
- **Semantic alignment**: Validation that generated specifications maintain coherence with original content

### 🔍 Advanced Pricing Analysis
- **CSP Engine (Constraint Satisfaction Problem)**: Mathematical analysis of pricing configurations using MiniZinc/Choco
- **Configuration space**: Complete enumeration of all possible combinations of plans and add-ons
- **Subscription optimization**: Identification of optimal configurations according to specific criteria
- **Smart filtering**: Search for configurations that meet specific requirements

### 🌐 Microservices Architecture
- **A-MINT API**: Main pricing transformation engine
- **Analysis API**: Specialized service for configuration analysis and validation
- **Web Frontend**: Modern and responsive user interface
- **Choco API**: Complementary CSP validation service

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        A-MINT ECOSYSTEM                        │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (React + Vite)                                       │
│  ├─ Interactive dashboard                                       │
│  ├─ Analysis visualization                                     │
│  └─ Pricing file management                                    │
├─────────────────────────────────────────────────────────────────┤
│  Analysis API (Node.js + TypeScript)                           │
│  ├─ CSP analysis with MiniZinc                                 │
│  ├─ iPricing specification validation                           │
│  ├─ Configuration space calculation                             │
│  └─ Subscription optimization                                  │
├─────────────────────────────────────────────────────────────────┤
│  A-MINT API (Python + FastAPI)                                 │
│  ├─ Web data extraction                                        │
│  ├─ HTML → Markdown → YAML transformation                      │
│  ├─ YAML validation and correction                             │
│  └─ Multiple AI provider integration                           │
├─────────────────────────────────────────────────────────────────┤
│  Choco API (Java + Spring Boot)                                │
│  ├─ Additional CSP specification validation                     │
│  ├─ Complementary constraint analysis                          │
│  └─ Validation support services                                │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Installation and Configuration

### Prerequisites

- **Docker & Docker Compose**: To run all services
- **Python 3.11+**: For local A-MINT engine development
- **Node.js 18+**: For local API and frontend development
- **AI API Keys**: Gemini, OpenAI or other compatible providers

If installing locally, it is recommended to use docker compose. The Makefile allows you to start all systems easily: `make start-api`.

### Environment Variables Configuration

1. **For any provider compatible with the OpenAI client** (we have used Gemini 2.5):
```bash
export OPENAI_API_KEY="your-openai-api-key"
# For automatic rotation of multiple keys:
export OPENAI_API_KEYS="key1,key2,key3"

```


### Docker Installation (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/organization/A-MINT.git
cd A-MINT

# 2. Create Docker network
docker network create a-mint-network

# 3. Start all services
docker compose up --build -d

# 4. Verify all services are running
docker compose ps
```

### Available Services

Once started, you will have access to:

- **Frontend**: http://localhost:80 - Main web interface
- **A-MINT API**: http://localhost:8001 - Pricing transformation API
- **Analysis API**: http://localhost:8002 - CSP analysis API
- **Choco API**: http://localhost:8000 - Complementary validation API

## 🔧 System Usage

### 1. Pricing Page Transformation

#### Via REST API

```bash
# Start transformation of a URL
curl -X POST "http://localhost:8001/api/v1/transform" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/pricing",
    "model": "gemini-2.5-flash",
    "max_tries": 50,
    "temperature": 0.7
  }'
```

### 2. Pricing Configuration Analysis

#### Get Pricing Summary

```bash
curl -X POST "http://localhost:8002/api/v1/pricing/summary" \
  -F "pricingFile=@my-pricing-file.yaml"
```

#### Start CSP Analysis

```bash
curl -X POST "http://localhost:8002/api/v1/pricing/analysis" \
  -F "pricingFile=@my-pricing-file.yaml" \
  -F "operation=optimal" \
  -F "solver=minizinc" \
  -F "objective=minimize"
```

## 📊 Data Structure and Specifications

### Feature Types

- **AUTOMATION**: Task automation (BOT, FILTERING, TRACKING, TASK_AUTOMATION)
- **DOMAIN**: Main domain functionalities
- **GUARANTEE**: Technical or service commitments (requires `docUrl`)
- **INFORMATION**: Data and insights exposure
- **INTEGRATION**: External integrations (API, EXTENSION, IDENTITY_PROVIDER, WEB_SAAS, MARKETPLACE, EXTERNAL_DEVICE)
- **MANAGEMENT**: Administrative functionalities
- **PAYMENT**: Payment methods (CARD, GATEWAY, INVOICE, ACH, WIRE_TRANSFER, OTHER)
- **SUPPORT**: Customer support and documentation

### Usage Limit Types

- **NON_RENEWABLE**: One-time limits that don't renew
- **RENEWABLE**: Limits that renew according to billing period

### Captured Metrics

- **LLM Model Costs**: Detailed analysis of expenses by AI provider
- **Token Usage**: Tracking of input and output tokens per operation
- **Preprocessing Efficiency**: HTML size reduction and cost impact
- **Processing Times**: Performance analysis per operation
- **Success Rates**: Success and failure statistics of transformations

### Specification Validation

The system includes automatic validation at multiple levels:

1. **Syntactic Validation**: Valid YAML structure verification
2. **Semantic Validation**: iPricing v2.1 specification conformity
3. **CSP Validation**: Mathematical constraint coherence
4. **Alignment Validation**: Correspondence with original content

## 🔄 Workflows and Pipelines

### Complete Transformation Pipeline

1. **Web Extraction**: Intelligent scraping of pricing pages
2. **HTML Preprocessing**: Content cleaning and optimization
3. **Markdown Conversion**: Structured HTML transformation
4. **Component Extraction**: Identification of plans, features and add-ons
5. **YAML Generation**: Serialization to iPricing format
6. **Validation and Correction**: Automatic verification and corrections
7. **Alignment Analysis**: Semantic correspondence validation

### CSP Analysis Pipeline

1. **Specification Loading**: iPricing YAML file parsing
2. **DZN Conversion**: Transformation to MiniZinc format
3. **CSP Resolution**: Solver execution to obtain solutions
4. **Post-processing**: Result interpretation and formatting
5. **Report Generation**: Creation of detailed reports

## 📂 Project Structure

```
A-MINT/
├── README.md                         # This file
├── LICENSE                          # Project license
├── docker-compose.yml               # Main Docker configuration
├── requirements.txt                 # Main Python dependencies
├── .env.example                     # Environment variables example
├── .gitignore                       # Git ignore file
│
├── src/                            # A-MINT main source code
│   ├── amint/                      # Main package
│   │   ├── api/                    # FastAPI endpoints
│   │   ├── ai/                     # AI clients and configuration
│   │   ├── extractors/             # Data extractors
│   │   ├── models/                 # Data models
│   │   ├── prompts/                # AI prompt templates
│   │   ├── transformers/           # Data transformers
│   │   ├── utils/                  # General utilities
│   │   └── validators/             # Data validators
│   └── Dockerfile                  # Docker image for A-MINT API
│
├── analysis_api/                   # CSP Analysis API
│   ├── src/                        # TypeScript source code
│   │   ├── api/                    # API controllers
│   │   ├── models/                 # MiniZinc models
│   │   ├── services/               # Business logic
│   │   ├── types.ts                # Type definitions
│   │   └── utils/                  # Utilities
│   ├── tests/                      # Test suite (78 test cases)
│   ├── package.json                # Node.js dependencies
│   ├── tsconfig.json               # TypeScript configuration
│   └── Dockerfile                  # Docker image
│
├── frontend/                       # React Web Interface
│   ├── src/                        # React + TypeScript source code
│   │   ├── components/             # Reusable components
│   │   ├── pages/                  # Main pages
│   │   ├── services/               # API clients
│   │   └── utils/                  # Frontend utilities
│   ├── public/                     # Static resources
│   ├── package.json                # React dependencies
│   ├── tailwind.config.js          # Tailwind CSS configuration
│   ├── vite.config.ts              # Vite configuration
│   └── Dockerfile                  # Docker image
│
├── csp/                           # Choco API (Java Spring Boot)
│   ├── src/main/                   # Java source code
│   ├── pom.xml                     # Maven dependencies
│   └── Dockerfile                  # Docker image
```

## 🤝 Contributing

### Development Environment Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/organization/A-MINT.git
cd A-MINT

# 2. Configure environment variables for development
cp .env.example .env
# Edit .env with your API keys

# 3. Install dependencies for local development
pip install -r requirements.txt
cd analysis_api && npm install && cd ..
cd frontend && npm install && cd ..
```

## 📚 Additional Documentation

### APIs and Specifications

- **A-MINT API**: Swagger UI available at http://localhost:8001/docs
- **Analysis API**: ReDoc at http://localhost:8002/redoc

## 📄 License

This project is licensed under the Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0). See the [LICENSE](LICENSE) file for more details.
