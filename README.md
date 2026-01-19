# VoChat - Voice to Text AI Companion

Speak naturally, get polished text instantly. Works everywhere - terminal, native apps, browsers.

## Project Structure

```
vochat.io/
├── apps/
│   ├── web/          # Next.js web dashboard (Vercel)
│   └── desktop/      # Tauri desktop app (Windows/Mac/Linux)
├── supabase/
│   └── migrations/   # Database schema + RLS policies
├── PRD.md           # Complete product spec + implementation plan
└── pnpm-workspace.yaml
```

## Tech Stack

- **Web**: Next.js 15 + TypeScript + Tailwind CSS
- **Desktop**: Tauri 2 + Rust + TypeScript
- **Backend**: Supabase (Auth + Postgres + RLS)
- **Deployment**: Vercel (web) + GitHub Releases (desktop)
- **STT**: Deepgram or AssemblyAI (ephemeral tokens)
- **LLM**: Claude API or OpenAI

## Prerequisites

- Node.js 18+
- pnpm 8+
- **For desktop app**: [Rust](https://www.rust-lang.org/tools/install)

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Environment setup

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

### 3. Apply Supabase migrations

```bash
npx supabase db push
```

### 4. Development

**Web dashboard:**
```bash
pnpm web
# Opens http://localhost:3000
```

**Desktop app:**
```bash
# Install Rust first: https://www.rust-lang.org/tools/install
pnpm desktop
```

## Current Status: Phase 0 ✓

- [x] Monorepo setup with pnpm workspaces
- [x] Next.js web app structure
- [x] Tauri desktop app structure
- [x] Supabase migration files (init, RLS, usage tracking)

## Next Steps: Phase 1

See [PRD.md](./PRD.md) for the complete implementation plan.

**Phase 1 - Supabase Setup:**
- Apply migrations to Supabase project
- Test RLS policies
- Create seed data (default app profiles)

**Phase 2 - Web App:**
- Supabase Auth integration
- Protected dashboard routes
- Settings UI

## Key Features (MVP)

- **Global Hotkey**: Ctrl + Windows (configurable)
- **Works Everywhere**: Terminal, browsers, native apps
- **App Profiles**: Custom tone/format per app (Slack, Gmail, Docs, etc.)
- **Usage Limits**: Free tier (2,000 words/week) + Pro (unlimited)
- **Privacy**: Optional privacy mode, no audio storage

## Commands

```bash
# Development
pnpm web              # Start web dashboard
pnpm desktop          # Start desktop app (requires Rust)
pnpm dev              # Start both in parallel

# Build
pnpm build            # Build all apps
pnpm desktop:build    # Build desktop app for production
```

## Architecture

**Client Flow:**
1. User presses Ctrl+Win (global hotkey)
2. Overlay appears, mic captures audio
3. Client streams to STT provider (ephemeral token from backend)
4. Final transcript → `/api/refine` → polished text
5. Text inserted via clipboard + Ctrl+V simulation

**Backend:**
- Supabase: Auth, profiles, usage tracking, billing
- Vercel: API routes (STT token, refine, Stripe webhooks)
- STT Provider: Direct client connection (budget-friendly)

## License

Private - All rights reserved
