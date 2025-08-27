# Contact Journal

A therapeutic web application for tracking social interactions, designed to help users build confidence and self-awareness through mindful logging of their daily social experiences.

## 🌟 Features

- **URL-based Authentication**: No login required - users access their journal via personalized URLs
- **Social Interaction Tracking**: Log 5 different types of interactions with comfort level ratings
- **AI-Powered Feedback**: Receive encouraging, therapeutic feedback after each entry
- **Privacy-First Design**: Collapsible recent entries section for discretion
- **Mobile Responsive**: Optimized for use on phones during therapy sessions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- OpenRouter API key (for AI feedback)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/deanndraper/contact-journal.git
cd contact-journal
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
npm install
```

4. Set up environment variables:
```bash
# In backend/.env
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
PORT=3001
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. In a new terminal, start the frontend:
```bash
npm start
```

3. Access the application at `http://localhost:3000/{userKey}`
   - Example: `http://localhost:3000/abc123`

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 18 with TypeScript, Tailwind CSS
- **Backend**: Express.js with TypeScript
- **Storage**: JSONL file-based storage (one file per user)
- **AI Integration**: OpenRouter API with GPT-4o model

### Project Structure

```
contact-journal/
├── src/                  # React frontend
├── backend/
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic & AI
│   │   └── types/        # TypeScript definitions
│   ├── prompts/          # AI prompt configurations
│   └── data/             # JSONL storage files
└── public/               # Static assets
```

## 📊 Data Model

### Interaction Record
```json
{
  "id": "int_xxx",
  "timestamp": "2024-01-15T10:30:00Z",
  "recordType": "interaction",
  "interactionType": "Initiated Conversation",
  "comfortLevel": "Comfortable",
  "notes": "Optional notes"
}
```

### AI Feedback Record
```json
{
  "id": "ai_xxx",
  "timestamp": "2024-01-15T10:30:01Z",
  "recordType": "ai_feedback",
  "relatedTo": ["int_xxx"],
  "feedback": "Encouraging message",
  "insightType": "observation"
}
```

## 🔧 Configuration

### Users

Edit `/backend/data/users.json` to configure users:
```json
{
  "abc123": {"name": "Sarah", "created": "2024-01-01T00:00:00Z"},
  "def456": {"name": "Michael", "created": "2024-01-02T00:00:00Z"}
}
```

### AI Prompts

Modify `/backend/prompts/feedback-prompt.md` to customize AI responses:
- Change the model (default: GPT-4o)
- Adjust temperature and token limits
- Customize therapeutic guidelines

## 📱 Usage

1. Share personalized URLs with users (e.g., `yoursite.com/abc123`)
2. Users log interactions throughout their day
3. AI provides immediate, encouraging feedback
4. Data persists in JSONL files for long-term tracking

## 🔒 Privacy & Security

- No user authentication system - security through obscure URLs
- All data stored locally on your server
- AI API keys stored in environment variables
- .gitignore configured to exclude sensitive data

## 🚧 Future Enhancements

- [ ] Scheduled deep analysis reports
- [ ] Export functionality for therapy sessions
- [ ] Progress visualizations and statistics
- [ ] Additional interaction types
- [ ] Multi-language support

## 📝 License

This project is private and intended for therapeutic use.

## 👥 Contributing

This is a private project. For questions or access requests, please contact the repository owner.

## 🙏 Acknowledgments

- Built with assistance from Claude AI
- Designed for therapeutic intervention support
- OpenRouter for unified AI model access