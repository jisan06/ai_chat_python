# AI Chat App

A full-stack AI-powered chat application built with Next.js, FastAPI, and Google's Gemini API. This project explores practical AI Engineering concepts, including LLM integration, AI provider abstraction, streaming responses, conversation management, and persistent storage.

## Features

- **AI-powered chat:** Generate responses using a hosted large language model.
- **Streaming responses:** Display AI-generated text progressively as it arrives.
- **Conversation management:** Create new conversations and switch between existing chats.
- **Persistent chat history:** Store conversations and messages in SQLite.
- **Provider abstraction:** Separate AI provider logic from application services to support future integrations.
- **REST API:** Connect the frontend and backend through HTTP endpoints.
- **Modular architecture:** Organize code into components, hooks, services, and provider layers.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Python, FastAPI |
| AI Model | Google Gemini |
| AI SDK | Google Gen AI SDK |
| Database | SQLite |
| ORM | SQLAlchemy |
| API Style | REST |
| Streaming | HTTP streaming (SSE, if used by the implementation) |

## Project Architecture

```text
ai_chat_app/
├── backend/
│   ├── app/
│   │   ├── providers/
│   │   ├── services/
│   │   └── db/
│   ├── data/
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   └── lib/
│   └── package.json
│
└── README.md
```

*This is a simplified overview of the main architectural areas. Refer to the actual project files for the complete structure.*

## How It Works

1. The user sends a message through the Next.js frontend.
2. FastAPI receives and validates the request.
3. The AI service delegates generation to the configured AI provider.
4. The Gemini model generates a response.
5. The backend streams text chunks to the frontend.
6. The frontend progressively updates the assistant's message.
7. The completed response is saved to SQLite alongside the conversation history.

## Getting Started

### Prerequisites

- Python version compatible with the backend dependencies
- Node.js and npm
- A Google Gemini API key

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd ai_chat_app
```

Replace `<your-repository-url>` with your repository URL.

### 2. Set Up the Backend

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment.

**Windows — Command Prompt:**

```cmd
.venv\Scripts\activate.bat
```

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file inside the `backend` directory:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_supported_gemini_model
```

Replace the placeholders with your API key and a Gemini model available to your account.

**Security:** Never commit your `.env` file or expose your API key in frontend code.

### 4. Run the Backend

From the `backend` directory, with the virtual environment activated:

```bash
python -m uvicorn main:app --reload
```

- Backend: http://127.0.0.1:8000
- Interactive API documentation: http://127.0.0.1:8000/docs

### 5. Set Up and Run the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

Ensure the frontend's API configuration points to the running backend.

## Database

The application uses SQLite with SQLAlchemy.

**Local database location:**

```text
backend/data/chat.db
```

The database stores conversations and their associated messages. The backend initializes the database according to the existing database configuration.

The local database file should remain excluded from Git.

## AI Engineering Concepts

### 1. LLM API Integration

Connected a hosted large language model to the application using the Gemini API.

Concepts learned:
- LLM inference through an API
- Prompt and response handling
- API credentials and environment configuration
- Provider error handling

### 2. AI Provider Abstraction

Separated provider-specific code from the main application using an AI provider interface, provider implementation, factory, and service layer.

Concepts learned:
- Abstraction and separation of concerns
- Interface-based design
- Factory pattern
- Maintainable AI service architecture

This approach makes adding other supported providers easier without rewriting the entire application.

### 3. Streaming LLM Responses

Implemented progressive response delivery so users can see generated text before the model finishes producing the complete answer.

Concepts learned:
- Asynchronous generation
- HTTP streaming
- Stream parsing and incremental rendering
- Completion and error handling

### 4. Conversation Management

Implemented multiple conversations and the ability to switch between them while retaining their message histories.

Concepts learned:
- Conversation identifiers
- Message ordering
- Application state management
- Persistent conversation history

### 5. Database Persistence

Used SQLite and SQLAlchemy to store conversations and messages.

Concepts learned:
- Relational data modeling
- ORM operations
- Database relationships
- Transaction management
- Data persistence across page refreshes

### 6. Full-Stack AI Integration

Integrated the frontend, backend, AI provider, and database into one application.

Concepts learned:
- REST API design
- Frontend-backend communication
- Request validation
- Asynchronous processing
- Error handling across application layers

## AI Request Flow

```text
User
 |
 v
Next.js Frontend
 |
 v
FastAPI REST API
 |
 v
AI Service
 |
 v
AI Provider Interface
 |
 v
Gemini API
 |
 v
Streaming Response
 |
 v
Frontend Updates the Message
 |
 v
Completed Response Saved to SQLite
```

## Future Improvements

Potential next steps for expanding the project and learning additional AI Engineering concepts:

- Conversation-aware prompting using previous messages
- Prompt engineering and structured outputs
- Retrieval-Augmented Generation (RAG)
- Embeddings and vector databases
- Document upload and question answering
- AI tool calling and agents
- LLM evaluation and monitoring
- Usage and latency tracking
- Automated testing and production deployment
- AI security and rate limiting

## Learning Objectives

This project is designed to develop practical skills in building applications powered by large language models.

The main objectives are to understand how to integrate existing AI models into maintainable software, manage conversational data, stream model responses, and connect AI capabilities with conventional backend and frontend systems.

This project focuses on **AI application engineering**, rather than training a machine learning model from scratch.

## License

No license has been specified yet. Choose an appropriate license before distributing the project publicly.
