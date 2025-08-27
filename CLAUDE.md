# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A mobile-friendly web application for tracking social interactions, designed for hypnotherapy client use. The app is stateless, uses URL-based user identification (no login required), and is built for simplicity with only 3 users expected.

## Current Implementation Status

### ✅ Completed Features

1. **React TypeScript Frontend**
   - Mobile-first responsive design using Tailwind CSS
   - URL-based user identification system (extracts key from path like `/abc123`)
   - Personalized interface showing user's name

2. **Interaction Tracking Interface**
   - 5 interaction types: Initiated Conversation, Responded Positively, Met New Person, Did a Favor, Listened Intently
   - 5-level comfort scale (Very Comfortable → Very Uncomfortable)
   - Optional notes field for additional context
   - Form validation and clearing after submission

3. **Privacy Features**
   - Recent entries section is collapsed by default
   - Click to expand/collapse for privacy protection

### 🚧 To Be Implemented

1. **Backend API** (Express/TypeScript)
   - User management with key-to-name mapping
   - JSONL file storage for interaction data
   - Data retrieval endpoints

2. **Claude API Integration**
   - Personalized insights based on interaction history
   - Therapeutic progress tracking

3. **Data Persistence**
   - Save interactions to backend
   - Fetch and display user's actual history

## Technical Stack

- **Frontend**: React 18 with TypeScript, Tailwind CSS v3
- **State Management**: React hooks (useState, useEffect)
- **Styling**: Tailwind CSS with custom purple/blue therapeutic color scheme
- **Backend**: Express.js with TypeScript
- **Storage**: JSONL file-based data storage (one file per user)
- **AI Integration**: Claude API for therapeutic insights

## Development Commands

### Backend (Express/TypeScript)

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Run development server (runs on http://localhost:3001)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### React Frontend

```bash
# Install dependencies (from project root)
npm install

# Run development server (runs on http://localhost:3000)
npm start

# Build for production
npm run build

# Run tests
npm test
```

### Running Both Services

```bash
# Terminal 1: Start backend
cd backend && npm run dev

# Terminal 2: Start frontend (from project root)
npm start
```

### Git Commands

```bash
# Check status
git status

# Add and commit changes
git add .
git commit -m "message"

# View commit history
git log --oneline
```

## Project Structure

```
contact-journal/
├── src/                  # Frontend React application
│   ├── App.tsx           # Main app component with all UI logic
│   ├── App.css           # Custom slider styles
│   └── index.css         # Tailwind imports
├── backend/              # Express.js backend
│   ├── src/
│   │   ├── server.ts     # Express server setup
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   └── types/        # TypeScript type definitions
│   └── data/
│       ├── users.json    # User key → name mapping
│       └── interactions/ # User interaction JSONL files
├── public/               # Static assets
├── tailwind.config.js    # Tailwind configuration
├── postcss.config.js     # PostCSS configuration
└── tsconfig.json         # TypeScript configuration
```

## URL Structure

The app uses URL-based user identification:
- Format: `https://domain.com/{userKey}`
- Example: `http://localhost:3000/abc123`
- The userKey is extracted and used to fetch user data from backend

## UI Components

1. **Header**: Personalized welcome message with user's name
2. **Interaction Type Selection**: 5 buttons with icons
3. **Comfort Level Grid**: 2x2 grid plus full-width neutral option
4. **Notes Textarea**: Optional text input
5. **Submit Button**: Validates and saves the experience
6. **Recent Entries**: Collapsible list for privacy
7. **Progress Insights**: AI-powered feedback section

## Data Model

### JSONL Storage Structure

Each user has their own JSONL file (`/backend/data/interactions/{userKey}.jsonl`) containing both interactions and AI feedback in chronological order:

#### Interaction Record
```json
{
  "id": "int_1",
  "timestamp": "2024-01-15T10:30:00Z",
  "recordType": "interaction",
  "interactionType": "Initiated Conversation",
  "comfortLevel": "Comfortable",
  "notes": "Coffee shop with old friend"
}
```

#### AI Feedback Record
```json
{
  "id": "ai_1",
  "timestamp": "2024-01-15T14:21:00Z",
  "recordType": "ai_feedback",
  "relatedTo": ["int_1", "int_2"],
  "feedback": "Great progress today! You're showing courage...",
  "insightType": "encouragement"
}
```

### User Mapping Structure

The `/backend/data/users.json` file maps user keys to names:
```json
{
  "abc123": {"name": "Sarah", "created": "2024-01-01"},
  "def456": {"name": "Michael", "created": "2024-01-02"},
  "ghi789": {"name": "Emma", "created": "2024-01-03"}
}
```

## Architecture Guidelines

- **URL-based Authentication**: No login required; user identified by URL key
- **Mobile-First Design**: All components optimized for mobile screens
- **Stateless Frontend**: No local storage; all data from server
- **Privacy-First**: Recent entries hidden by default
- **Therapeutic Language**: Supportive, professional, compassionate tone

## Key Implementation Notes

- The app is designed for therapeutic use with supportive language throughout
- Interface is minimal and intuitive for use during therapy sessions
- Focus on simplicity - only 3 users expected
- Comfort scale ordered with positive options first to encourage optimistic framing
- All user data should be handled securely with no client-side persistence