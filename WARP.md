# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Contact Journal is a therapeutic web application for tracking social interactions, designed specifically for hypnotherapy client use. The app is stateless, privacy-first, and uses URL-based user identification without traditional authentication. It serves as a tool to help users build confidence and self-awareness through mindful logging of their daily social experiences.

**Key Characteristics:**
- Mobile-first responsive design for use during therapy sessions
- URL-based authentication (no login required)
- AI-powered therapeutic feedback via OpenRouter API
- JSONL file-based storage for simplicity
- Production deployment on transformativehelp.com with Caddy reverse proxy

## Architecture Overview

### Tech Stack
- **Frontend**: React 18 with TypeScript, Tailwind CSS v3
- **Backend**: Express.js with TypeScript, OpenRouter API integration  
- **Storage**: JSONL file-based data storage (one file per user)
- **AI Integration**: OpenRouter API with GPT-4o for therapeutic insights
- **Production**: Caddy reverse proxy with automatic HTTPS, PM2 process management

### Multi-Tier Architecture
The application uses a clean separation between frontend and backend:

```
Frontend (React/TypeScript)
├── URL-based routing (/userKey)
├── Configuration-driven UI components
├── Real-time AI feedback display
└── Mobile-optimized therapeutic interface

Backend (Express/TypeScript)
├── RESTful API endpoints (/api/*)
├── Configuration management system
├── AI service integration (OpenRouter)
├── JSONL storage service
└── User and interaction management

Production Infrastructure
├── Caddy (reverse proxy + HTTPS)
├── PM2 (process management)
├── Multi-subdomain architecture
└── Automated deployment scripts
```

### Data Flow Architecture
The app follows this interaction pattern:
1. User accesses personalized URL (e.g., `/abc123`)
2. Frontend loads app configuration based on URL context
3. User logs social interactions via dynamic form interface
4. Backend stores interaction and triggers AI analysis
5. AI feedback is generated and stored alongside interaction
6. Recent entries display both interactions and AI insights chronologically

### Configuration-Driven Design
The application uses a sophisticated configuration system that allows multiple therapeutic apps to share the same codebase:
- **App Configurations**: Located in `/backend/configs/` (JSON files)
- **Dynamic UI**: Interaction types, comfort levels, themes all configurable
- **AI Prompts**: Customizable per application type (located in `/backend/prompts/`)
- **Theming**: Support for different color schemes per therapeutic focus

## Development Commands

### Environment Setup
The project uses a Python virtual environment rule but is primarily Node.js-based:

```bash
# Ensure you're using the Python venv from parent directory (rule)
source ../venv/bin/activate  # if Python components are needed

# Frontend dependencies
npm install

# Backend dependencies  
cd backend && npm install
```

### Backend Development
```bash
cd backend

# Development server with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Production server (requires build first)
npm start

# Environment setup (required for AI features)
cp .env.example .env
# Edit .env to add OPENROUTER_API_KEY
```

### Frontend Development  
```bash
# Development server (from project root)
npm start

# Production build
npm run build

# Run tests
npm test

# Build analysis
npm run build -- --analyze
```

### Full Stack Development
```bash
# Terminal 1: Start backend
cd backend && npm run dev

# Terminal 2: Start frontend (from project root)  
npm start

# Access application at http://localhost:3000/{userKey}
# Example: http://localhost:3000/abc123
```

### Production Deployment
```bash
# Automated deployment script
./deploy.sh initial    # First-time server setup
./deploy.sh update     # Update existing deployment
./deploy.sh rollback   # Rollback to previous version

# Manual deployment components
npm run build                    # Build frontend
cd backend && npm run build      # Build backend
pm2 start ecosystem.config.js   # Start with PM2
sudo systemctl reload caddy     # Reload reverse proxy
```

## Code Organization Patterns

### Backend Structure (`/backend/src/`)
```
routes/           # API endpoint handlers
├── users.ts      # User management endpoints
├── interactions.ts # Interaction CRUD operations  
├── config.ts     # Configuration management API

services/         # Business logic layer
├── ai.ts         # OpenRouter API integration
├── config.ts     # Configuration loading/caching
├── storage.ts    # JSONL file operations

types/           # TypeScript definitions
├── index.ts     # Core data models
├── config.ts    # Configuration interfaces
```

### Frontend Structure (`/src/`)
```
App.tsx          # Main application component
├── URL-based user identification
├── Configuration-driven UI rendering
├── Real-time interaction logging
├── AI feedback display integration

api.ts           # Backend service layer
├── RESTful API client
├── TypeScript interfaces
├── Environment-aware base URLs

AppRouter.tsx    # React Router configuration
Privacy.tsx      # Data usage information page
```

### Configuration System
The app supports multiple therapeutic focuses through configuration:

```
configs/         # App configuration files
├── social.json      # Social interaction tracking
├── addiction.json   # Addiction recovery support  
├── schema.json      # Configuration validation schema

prompts/         # AI prompt templates
├── feedback-prompt.md        # General therapeutic feedback
├── social-interaction-prompt.md  # Social-specific prompts
├── addiction-recovery-prompt.md  # Recovery-specific prompts
```

## Data Models & Storage

### Core Data Structures
```typescript
// Interaction Record
interface InteractionRecord {
  id: string;
  timestamp: string;
  recordType: 'interaction';
  interactionType: string;  // Dynamic based on config
  comfortLevel: string;     // Dynamic based on config  
  notes?: string;
}

// AI Feedback Record
interface AIFeedbackRecord {
  id: string;
  timestamp: string;
  recordType: 'ai_feedback';
  relatedTo: string[];      // Related interaction IDs
  feedback: string;         // Therapeutic response
  insightType: 'encouragement' | 'suggestion' | 'observation' | 'milestone';
}
```

### Storage Architecture
- **User Data**: `/backend/data/users.json` (userKey → name mapping)
- **Interactions**: `/backend/data/interactions/{userKey}.jsonl` (one file per user)
- **Format**: JSONL (JSON Lines) for append-only operations
- **Backup**: Production deployment includes automated backup scripts

### URL-Based User System
The application uses URL paths for user identification:
- **Format**: `https://domain.com/{userKey}` 
- **Example**: `https://journal.transformativehelp.com/abc123`
- **Security**: Privacy through obscure URLs (no traditional authentication)
- **Scaling**: Designed for small user bases (3-10 users per deployment)

## AI Integration Architecture

### OpenRouter API Integration
```typescript
// AI Service Configuration
{
  OPENROUTER_API_KEY: string;     // Required environment variable
  OPENROUTER_BASE_URL: string;    // Default: https://openrouter.ai/api/v1
  model: "gpt-4o";               // Configurable per app
  temperature: 0.7;              // Therapeutic tone balance
  max_tokens: 150;               // Concise therapeutic responses
}
```

### Therapeutic Response Generation
- **Context-Aware**: AI receives user's recent interaction history
- **App-Specific**: Different prompts for social vs addiction recovery contexts
- **Real-Time**: Feedback generated immediately after interaction logging
- **Inline Display**: AI insights appear chronologically with interactions

## Production Infrastructure

### Multi-Subdomain Architecture
```
journal.transformativehelp.com → React frontend (static files)
api.transformativehelp.com     → Express backend (reverse proxy)
```

### Automated Deployment Pipeline
The `deploy.sh` script handles complete production deployment:
1. **Server Setup**: Installs Node.js, PM2, Caddy, configures firewall
2. **Application Build**: Builds both frontend and backend locally
3. **File Deployment**: Copies built files to production server
4. **Service Configuration**: Configures PM2 process management and Caddy reverse proxy
5. **Health Checks**: Verifies all services are running correctly

### Process Management (PM2)
```javascript
// ecosystem.config.js
{
  name: 'journal-backend',
  script: './backend/dist/server.js',
  instances: 1,
  autorestart: true,
  max_memory_restart: '512M',
  env: {
    NODE_ENV: 'production',
    PORT: 3001,
    // OpenRouter API credentials from .env
  }
}
```

### Reverse Proxy (Caddy)
- **Automatic HTTPS**: Let's Encrypt certificate management
- **CORS Handling**: Configured for journal → api subdomain requests  
- **Security Headers**: HSTS, X-Frame-Options, CSP configured
- **Rate Limiting**: 100 requests per minute per IP

## Development Guidelines

### Therapeutic Application Principles
- **Privacy-First**: Collapsible recent entries, no local storage persistence
- **Mobile-Optimized**: All components designed for therapy session use
- **Supportive Language**: Positive, encouraging, professional tone throughout
- **Simplicity**: Minimal UI to reduce cognitive load during vulnerable moments

### Configuration-Driven Development
When adding new therapeutic focuses:
1. Create new configuration file in `/backend/configs/`
2. Add app-specific AI prompts in `/backend/prompts/`
3. Configure interaction types, comfort levels, and theming
4. Test with URL-based app identification

### Code Style & Patterns
- **TypeScript**: Strict typing throughout both frontend and backend
- **Error Handling**: Comprehensive error boundaries and API error responses
- **Async/Await**: Consistent async pattern, avoid callback hell
- **Component Architecture**: Functional components with hooks, avoid class components

### Environment Variables
Required backend environment variables:
```bash
OPENROUTER_API_KEY=your_api_key_here      # Required for AI features
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
PORT=3001                                  # Backend server port
CORS_ORIGIN=https://journal.transformativehelp.com  # Production only
```

## Testing & Quality Assurance

### Available Test Commands
```bash
# Frontend tests (React Testing Library + Jest)
npm test

# Backend testing (manual API testing recommended)
# Use tools like Postman or curl to test API endpoints
curl http://localhost:3001/api/health

# Production health checks
curl https://api.transformativehelp.com/api/health
curl https://journal.transformativehelp.com/
```

### Quality Assurance Practices
- **Type Safety**: TypeScript strict mode enabled
- **API Testing**: Manual testing recommended for therapeutic application accuracy
- **User Experience**: Mobile-first testing on actual therapy session devices
- **AI Response Quality**: Regular review of therapeutic feedback appropriateness

## Troubleshooting Common Issues

### Backend Won't Start
```bash
# Check PM2 logs
pm2 logs journal-backend

# Verify environment variables
cat backend/.env

# Check port availability
netstat -tulpn | grep 3001
```

### AI Features Not Working
```bash
# Verify OpenRouter API key is set
echo $OPENROUTER_API_KEY

# Check AI service logs for API errors
tail -f /var/log/pm2/journal-backend-error.log

# Test API connectivity
curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
     https://openrouter.ai/api/v1/models
```

### Frontend Build Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npx tsc --noEmit

# Verify environment-specific API URLs
npm run build
```

### Production Deployment Issues
```bash
# Check Caddy configuration
sudo caddy validate --config /etc/caddy/Caddyfile

# Verify DNS resolution
dig journal.transformativehelp.com
dig api.transformativehelp.com

# Check SSL certificate status
curl -I https://journal.transformativehelp.com
```

This documentation provides the essential context for working effectively with the Contact Journal codebase, focusing on its unique architecture as a therapeutic application with sophisticated configuration management and production deployment automation.

<citations>
<document>
<document_type>RULE</document_type>
<document_id>OVyx7BamjUKjpZirWgkrhF</document_id>
</document>
</citations>
