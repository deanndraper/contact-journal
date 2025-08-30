#!/bin/bash

# =============================================================================
# CONTACT JOURNAL APPLICATION STARTUP SCRIPT
# =============================================================================
#
# APPLICATION OVERVIEW:
# The Contact Journal is a mobile-friendly web application designed for 
# tracking social interactions, specifically created for hypnotherapy client 
# use. The application is stateless and uses URL-based user identification 
# with no login required. It is built for simplicity with only 3 users 
# expected and focuses on therapeutic support for social anxiety treatment.
#
# CORE FUNCTIONALITY:
# The application allows users to log social interactions across 5 categories:
# Initiated Conversation, Responded Positively, Met New Person, Did a Favor,
# and Listened Intently. Each interaction includes a 5-level comfort scale
# from Very Comfortable to Very Uncomfortable, plus optional notes. The app
# integrates with OpenRouter's GPT-4o model to provide real-time AI therapeutic
# feedback after each logged interaction, offering encouragement and insights
# in a supportive, professional tone.
#
# TECHNICAL ARCHITECTURE:
# Frontend: React 18 with TypeScript and Tailwind CSS providing a mobile-first
# responsive design. The frontend is stateless and extracts user identification
# from URL paths like /abc123. Backend: Express.js server with TypeScript that
# handles RESTful API endpoints for users and interactions. Data storage uses
# JSONL file format with one file per user containing both interactions and
# AI feedback in chronological order. AI integration connects to OpenRouter
# API for therapeutic response generation using configurable prompts.
#
# USER IDENTIFICATION SYSTEM:
# The application uses a unique URL-based user identification where each user
# is identified by a key in the URL path such as /abc123. User keys are mapped
# to names in users.json file. This eliminates traditional authentication
# while maintaining user separation and privacy.
#
# DATA STORAGE STRUCTURE:
# The backend data directory contains users.json for user key to name mapping
# and an interactions subdirectory with individual JSONL files per user. Each
# JSONL file stores both interaction records and AI feedback records with
# timestamps, allowing chronological display of user progress and insights.
#
# DIRECTORY STRUCTURE:
# Project root contains src directory with React frontend components including
# App.tsx main component, api.ts service layer, and styling files. The backend
# directory contains src subdirectory with server.ts, routes for API endpoints,
# services for business logic and AI integration, and types for TypeScript
# definitions. Backend also has prompts directory for AI configuration,
# data directory for storage with users.json and interactions subdirectory,
# plus .env file for OpenRouter API key configuration. Root level has public
# directory for static assets, package.json for frontend dependencies,
# tailwind.config.js and postcss.config.js for styling configuration, and
# tsconfig.json for TypeScript settings.
#
# REQUIRED ENVIRONMENT:
# Backend requires .env file with OPENROUTER_API_KEY for AI functionality,
# OPENROUTER_BASE_URL set to https://openrouter.ai/api/v1, and PORT set to
# 3001. Frontend runs on port 3000 and communicates with backend for all
# data operations and AI feedback generation.
#
# OPERATIONAL FILES:
# Key files for operation include backend/src/server.ts as main server entry,
# backend/src/routes for API endpoints, backend/src/services for AI and storage
# logic, backend/prompts/feedback-prompt.md for AI prompt configuration,
# backend/data/users.json for user mapping, src/App.tsx for main frontend
# component, src/api.ts for backend communication, and package.json files
# in both root and backend for dependency management.
#
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Process names to look for
FRONTEND_PROCESS="react-scripts start"
BACKEND_PROCESS="npm run dev"

# Ports
FRONTEND_PORT=3000
BACKEND_PORT=3001

echo -e "${BLUE}Contact Journal Application Startup${NC}"
echo "========================================"

# Function to check if a port is in use
check_port() {
    local port=$1
    lsof -ti :$port 2>/dev/null
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(check_port $port)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}Killing existing process on port $port (PID: $pid)${NC}"
        kill -9 $pid 2>/dev/null || true
        sleep 2
    fi
}

# Function to check if npm processes are running
check_npm_processes() {
    # Check for React dev server
    local react_pid=$(pgrep -f "react-scripts start" 2>/dev/null || echo "")
    # Check for backend dev server (look for tsx watch which is what actually runs)
    local backend_pid=$(pgrep -f "tsx watch src/server.ts" 2>/dev/null || echo "")
    local npm_backend_pid=$(pgrep -f "npm.*run.*dev" 2>/dev/null || echo "")
    
    if [ ! -z "$react_pid" ]; then
        echo -e "${YELLOW}Found React dev server (PID: $react_pid), killing...${NC}"
        kill -9 $react_pid 2>/dev/null || true
    fi
    
    if [ ! -z "$backend_pid" ]; then
        echo -e "${YELLOW}Found backend dev server (PID: $backend_pid), killing...${NC}"
        kill -9 $backend_pid 2>/dev/null || true
    fi
    
    if [ ! -z "$npm_backend_pid" ]; then
        echo -e "${YELLOW}Found npm backend process (PID: $npm_backend_pid), killing...${NC}"
        kill -9 $npm_backend_pid 2>/dev/null || true
    fi
}

# Check for existing processes and kill them
echo "Checking for existing processes..."
check_npm_processes
kill_port $FRONTEND_PORT
kill_port $BACKEND_PORT

# Wait a moment for processes to fully terminate
sleep 3

# Verify environment setup
echo -e "${BLUE}Verifying environment setup...${NC}"

# Check if backend .env exists
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}Error: backend/.env file not found${NC}"
    echo "Please copy backend/.env.example to backend/.env and configure your OpenRouter API key"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd backend && npm install && cd ..
fi

echo -e "${GREEN}Environment verified successfully${NC}"

# Create logs directory
mkdir -p logs

# Start logging this script's output
STARTUP_LOG="logs/startup-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$STARTUP_LOG") 2>&1
echo "STARTUP.sh log started at $(date)"

# Start backend server with logging
echo -e "${BLUE}Starting backend server on port $BACKEND_PORT...${NC}"
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID (logging to logs/backend.log)"
cd ..

# Give backend time to start
sleep 5

# Start frontend server with logging
echo -e "${BLUE}Starting frontend server on port $FRONTEND_PORT...${NC}"
npm start > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID (logging to logs/frontend.log)"

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

# Check if services are running
backend_running=$(check_port $BACKEND_PORT)
frontend_running=$(check_port $FRONTEND_PORT)

if [ ! -z "$backend_running" ]; then
    echo -e "${GREEN}✓ Backend server running on http://localhost:$BACKEND_PORT${NC}"
else
    echo -e "${RED}✗ Backend server failed to start${NC}"
fi

if [ ! -z "$frontend_running" ]; then
    echo -e "${GREEN}✓ Frontend server running on http://localhost:$FRONTEND_PORT${NC}"
else
    echo -e "${RED}✗ Frontend server failed to start${NC}"
fi

echo ""
echo -e "${BLUE}Contact Journal Application Started${NC}"
echo "========================================"
echo -e "Frontend: ${GREEN}http://localhost:$FRONTEND_PORT${NC}"
echo -e "Backend API: ${GREEN}http://localhost:$BACKEND_PORT${NC}"
echo -e "Access as user: ${GREEN}http://localhost:$FRONTEND_PORT/{userKey}${NC}"
echo -e "Example: ${GREEN}http://localhost:$FRONTEND_PORT/abc123${NC}"
echo ""
echo "Press Ctrl+C to stop both servers (before 30-second countdown)"

# Function to cleanup only when interrupted (Ctrl+C)
cleanup_on_interrupt() {
    echo -e "\n${YELLOW}Script interrupted. Shutting down servers...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    kill_port $BACKEND_PORT
    kill_port $FRONTEND_PORT
    
    # Also kill any lingering processes
    pkill -f "tsx watch src/server.ts" 2>/dev/null || true
    pkill -f "react-scripts start" 2>/dev/null || true
    
    echo -e "${GREEN}Servers stopped${NC}"
    exit 0
}

# Only cleanup on interrupt (Ctrl+C), not on normal exit
trap cleanup_on_interrupt INT TERM

echo ""
echo -e "${GREEN}Servers are running in background.${NC}"
echo -e "${YELLOW}Logs available at:${NC}"
echo -e "  Backend: logs/backend.log"
echo -e "  Frontend: logs/frontend.log"
echo ""
echo -e "${BLUE}Monitor logs with:${NC}"
echo -e "  tail -f logs/backend.log"
echo -e "  tail -f logs/frontend.log"
echo ""
echo -e "${YELLOW}Script will exit in 30 seconds, leaving servers running independently.${NC}"
echo -e "${YELLOW}To stop servers later: 'pkill -f \"tsx watch\"' and 'pkill -f \"react-scripts\"'${NC}"
echo ""

# Wait for 30 seconds then exit (servers continue running)
for i in {30..1}; do
    echo -ne "\r${BLUE}Script will exit in $i seconds... (servers will keep running)${NC}"
    sleep 1
done

echo -e "\n${GREEN}STARTUP.sh completed. Servers are running independently.${NC}"
echo -e "Check logs/backend.log and logs/frontend.log for server output."