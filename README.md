
# Gravon.ai

AI for Growth-Driven Businesses. No-code WhatsApp AI Assistant Platform. Connect WhatsApp, choose a template, and launch your AI assistant in under 60 seconds.

## Project Structure

```
gravon-ai/
├── frontend/          React + TypeScript + Vite (Landing page & Dashboard)
├── backend/           Python + FastAPI (API & AI Wrappers)
├── docker-compose.yml Run both services together
└── README.md          You are here
```

## Quick Start

### Frontend

```bash
cd frontend
npm install
npm run dev          # → http://localhost:8080
```

### Backend

```bash
cd backend
pip install -e ".[dev]"
cp .env.example .env   # Add your API keys
uvicorn app.main:app --reload --port 8000
```

### Both (Docker)

```bash
docker-compose up
```

## AI Providers Supported

| Provider  | Wrapper                          | Default Model            |
| --------- | -------------------------------- | ------------------------ |
| OpenAI    | `app/wrappers/openai_wrapper`    | gpt-4o                   |
| Anthropic | `app/wrappers/anthropic_wrapper` | claude-sonnet-4-20250514 |
| Google    | `app/wrappers/gemini_wrapper`    | gemini-2.0-flash         |

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend:** Python 3.10+, FastAPI, Pydantic
- **AI SDKs:** OpenAI, Anthropic, Google Generative AI

## License

MIT
