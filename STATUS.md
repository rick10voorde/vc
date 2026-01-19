# VoChat - Project Status

## ✅ Completed Phases

### Phase 0: Monorepo Setup
- [x] pnpm workspace configuration
- [x] Next.js web app (TypeScript + Tailwind CSS)
- [x] Tauri desktop app structure
- [x] Supabase migration files (3 migrations ready)

**Status**: ✅ Complete

---

### Phase 1: Database Migrations
- [x] Migration files created:
  - `20260115000001_init.sql` - Initial schema
  - `20260115000002_rls.sql` - Row Level Security
  - `20260115000003_usage.sql` - Usage tracking functions
- [x] Seed file template created
- [x] Setup documentation (MIGRATIONS.md)

**Action Required**: Apply migrations via Supabase SQL Editor
**See**: [MIGRATIONS.md](./MIGRATIONS.md) for instructions

**Status**: ⏳ Migrations ready to apply

---

### Phase 2: Next.js Web App with Auth
- [x] Supabase client utilities (browser + server + middleware)
- [x] Authentication pages:
  - `/auth/login` - Sign in page
  - `/auth/signup` - Sign up page
  - `/auth/callback` - OAuth callback handler
- [x] Protected dashboard route `/dashboard`
- [x] Auth middleware for route protection
- [x] Logout functionality
- [x] Home page with CTAs

**Status**: ✅ Complete

---

### Phase 3: Profiles UI (MVP Core)
- [x] TypeScript types for database entities
- [x] Supabase API functions for profile CRUD
- [x] Profiles list page (`/dashboard/profiles`)
- [x] Create profile page (`/dashboard/profiles/new`)
- [x] Edit profile page (`/dashboard/profiles/[id]/edit`)
- [x] Default profile enforcement (only 1 default allowed)
- [x] Profile deletion with safeguards
- [x] Profile card component
- [x] Full profile form with all options

**Test**: `pnpm web` → Login → Dashboard → "Manage App Profiles"

**Status**: ✅ Complete (ready to test after migrations)

---

## 📋 Next Steps

### Phase 4: Stripe Billing (Free/Pro)
- [ ] Stripe product + price configuration
- [ ] Web endpoints: `/api/stripe/checkout`, `/api/stripe/portal`, `/api/stripe/webhook`
- [ ] DB upserts in webhook handler
- [ ] Subscription status display

### Phase 5: Usage Metering + Limits
- [ ] Plan resolver (query stripe_subscriptions)
- [ ] Weekly usage checks via SQL function
- [ ] Enforce in `/api/refine` + `/api/stt/token`
- [ ] Log usage events

### Phase 6: Tauri Desktop App (Core)
- [ ] Global hotkey registration (Ctrl + Windows)
- [ ] System tray icon + menu
- [ ] Overlay window (transparent, always-on-top)
- [ ] Supabase auth flow (embedded webview)
- [ ] Basic UI: login screen + settings

**Note**: Requires Visual Studio Build Tools for Windows
**Download**: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022

---

## 🛠️ Development Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm web                # Start web dashboard (port 3000)
pnpm desktop            # Start desktop app (requires Rust + MSVC)
pnpm dev                # Start both in parallel

# Build
pnpm build              # Build all apps
pnpm desktop:build      # Build desktop app for production

# Database
pnpm db:migrate         # (WIP) Apply migrations via script
# OR: Follow instructions in MIGRATIONS.md
```

---

## 📁 Project Structure

```
vochat.io/
├── apps/
│   ├── web/                    # Next.js dashboard ✅
│   │   ├── app/
│   │   │   ├── auth/           # Auth pages ✅
│   │   │   ├── dashboard/      # Protected dashboard ✅
│   │   │   └── api/            # API routes (TBD)
│   │   ├── lib/supabase/       # Supabase clients ✅
│   │   ├── components/         # React components
│   │   └── middleware.ts       # Auth middleware ✅
│   └── desktop/                # Tauri app ⏳
│       ├── src/                # Frontend (Vite + TS)
│       └── src-tauri/          # Rust backend
├── supabase/
│   ├── migrations/             # Database migrations ✅
│   └── seed.sql                # Seed data template ✅
├── scripts/                    # Automation scripts
├── PRD.md                      # Complete product spec
├── README.md                   # Getting started guide
├── MIGRATIONS.md               # Migration instructions
└── STATUS.md                   # This file
```

---

## 🔑 Environment Variables

**Web App** (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=https://eflhqeofkenyczflqwkz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

---

## 🐛 Known Issues

1. **Desktop app build fails**: Needs Visual Studio Build Tools
2. **Supabase CLI not linked**: Migrations need manual application via SQL Editor

---

## 📊 Progress Overview

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 0: Monorepo Setup | ✅ Complete | 100% |
| Phase 1: Database Setup | ⏳ Ready | 90% (migrations ready) |
| Phase 2: Web Auth | ✅ Complete | 100% |
| Phase 3: Profiles UI | ✅ Complete | 100% |
| Phase 4: Stripe Billing | ⏳ Next | 0% |
| Phase 5: Usage Metering | ⏳ Pending | 0% |
| Phase 6: Desktop Core | ⏳ Pending | 20% (structure ready) |
| Phase 7: STT Integration | ⏳ Pending | 0% |
| Phase 8: AI Refinement | ⏳ Pending | 0% |

---

**Last Updated**: 2026-01-15 22:30 CET
