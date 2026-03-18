# RAG Explorer

A full-stack Retrieval-Augmented Generation (RAG) demo application. Upload documents, index them into a vector database, and query them using natural language powered by Claude.

## Features

- **Document ingestion** — Upload PDF, TXT, or Markdown files (up to 10 MB)
- **Vector search** — Chunks are embedded with Voyage AI and stored in ChromaDB
- **Streaming chat** — Ask questions and get real-time answers from Claude with source citations
- **Conversation history** — Past conversations are saved and browsable
- **Auth** — JWT-based login with HTTP-only cookies
- **Admin panel** — User management for admin accounts

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Database | PostgreSQL via Prisma |
| Vector DB | ChromaDB |
| Object Storage | MinIO (S3-compatible) |
| LLM | Anthropic Claude (`claude-sonnet-4-20250514`) |
| Embeddings | Voyage AI (`voyage-3`) |
| Auth | JWT (HS256) in HTTP-only cookies |
| Styling | Tailwind CSS |

## Prerequisites

- Node.js ≥ 20
- pnpm
- Docker + Docker Compose
- Anthropic API key
- Voyage AI API key

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

```env
ANTHROPIC_API_KEY=sk-ant-...
VOYAGE_API_KEY=pa-...
JWT_SECRET=<random 64-char hex string>
```

### 3. Start local services

```bash
docker compose up -d
```

| Service | URL |
|---------|-----|
| PostgreSQL | `localhost:5433` |
| MinIO API | `localhost:9002` |
| MinIO Console | `localhost:9003` |
| ChromaDB | `localhost:8000` |

### 4. Run database migrations and seed

```bash
DATABASE_URL=postgresql://raguser:ragpass@localhost:5433/ragdemo pnpm prisma migrate dev
pnpm prisma db seed
```

### 5. Start the dev server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) and log in with:

| Username | Password |
|----------|----------|
| `admin` | `admin123` |

## Usage

1. **Upload documents** — Go to Documents, drag and drop a PDF/TXT/MD file. The app will chunk and embed it automatically.
2. **Chat** — Go to Chat, create a new conversation, and ask questions. Optionally filter which documents are queried using the pill selectors above the input.
3. **Sources** — Each assistant response includes expandable source citations showing the exact chunk and relevance score.

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Public login page
│   ├── (protected)/           # Dashboard, Documents, Chat, Settings
│   └── api/                   # REST + SSE API routes
├── lib/
│   ├── auth.ts                # JWT sign/verify, cookie helpers
│   ├── chroma.ts              # ChromaDB client
│   ├── embeddings.ts          # Voyage AI embedding generation
│   ├── ingestion.ts           # Document chunking + indexing pipeline
│   ├── prisma.ts              # Prisma singleton
│   ├── rag.ts                 # Retrieval + prompt + Claude streaming
│   ├── rate-limit.ts          # In-memory rate limiter (20 req/min)
│   ├── storage.ts             # S3/MinIO file operations
│   └── validators.ts          # Zod schemas
├── components/                # React components
├── hooks/                     # Custom React hooks
└── types/                     # Shared TypeScript types
prisma/
├── schema.prisma              # DB schema
└── seed.ts                    # Admin user seed
```

## API Overview

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |
| GET | `/api/documents` | List documents |
| POST | `/api/documents/upload` | Upload a document |
| DELETE | `/api/documents/:id` | Delete a document |
| GET | `/api/conversations` | List conversations |
| POST | `/api/conversations` | Create conversation |
| GET | `/api/conversations/:id` | Get conversation with messages |
| POST | `/api/chat` | Send query (SSE streaming response) |
| GET | `/api/admin/users` | List all users (admin only) |

## Commands Reference

| Task | Command |
|------|---------|
| Install dependencies | `pnpm install` |
| Start services | `docker compose up -d` |
| Run migrations | `pnpm prisma migrate dev` |
| Seed database | `pnpm prisma db seed` |
| Start dev server | `pnpm dev` |
| Build for production | `pnpm build` |
| Type check | `pnpm tsc --noEmit` |
| Lint | `pnpm lint` |

## Deployment (Railway)

1. Create services: PostgreSQL, MinIO, ChromaDB (Docker image: `chromadb/chroma:latest`)
2. Set all environment variables from `.env.example` in the Railway dashboard
3. Build command: `pnpm install && pnpm prisma generate && pnpm prisma migrate deploy && pnpm build`
4. Start command: `pnpm start`
