# Agent Development Guide

## Commands
- **Frontend**: `cd Frontend && npm run dev` (dev), `npm run build` (build), `npm run lint` (lint), `npm run type-check` (typecheck), `npm test` (test with vitest)
- **Backend Node**: `cd backend-node && npm run dev` (dev with nodemon + tsx)
- **Backend Python**: `cd backend-python && python main.py` (dev), requires Ollama running: `ollama serve`
- **Docker**: `docker-compose up -d` (all services)

## Architecture
- **3-tier**: Frontend (React+Vite+TypeScript), Backend-Node (Express+WS), Backend-Python (FastAPI+WebSocket+Ollama)
- **Database**: SQLite/PostgreSQL in backend-python
- **Real-time**: WebSocket for collaboration and agent workflows
- **AI**: 12 specialized Ollama agents (Mike, Bob, Front Engineer, etc.)
- **Code execution**: Docker sandbox isolation

## Code Style
- **React**: Function components with hooks, TypeScript strict mode
- **Imports**: Named imports from `../types`, ES6 modules
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Files**: .tsx for React components, .ts for utilities
- **Error handling**: Try/catch blocks, proper error types
- **Formatting**: ESLint + TypeScript rules, no semicolons preference from config
