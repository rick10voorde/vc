# PRD — "Flow" Voice-to-Text + AI Writing Companion

## 1) Productvisie

Een product waarmee je overal sneller schrijft door te spreken, en dat automatisch je tekst opschoont en aanpast aan de context (Slack vs Gmail vs Docs vs "Generic").

### Kernbelofte

- "Speak → polished text" met minimale handmatige edits.
- Per app/profiel: tone, formatting, taal.
- Snippets/dictionary/workflows om repetitief werk te versnellen.

## 2) Doelen & KPI's

### Doelen

- Snelle "time-to-value": binnen 5 minuten eerste succesvolle dictation + insertion.
- Outputkwaliteit: hoog acceptatiepercentage (weinig undo).
- Kosten beheersbaar: free-tier limieten + slim usage meteren.

### KPI's (MVP)

- Activation rate: % users met ≥1 "successful insertion"
- Accept rate: % outputs zonder undo/redo binnen 30s
- Latency P50/P95 (STT partials en finalize)
- Weekly active dictation users (WAU)
- Cost per active user (STT + LLM)

## 3) Scope (MVP vs V1)

### MVP (P0)

- Web dashboard (Vercel/Next.js)
- Supabase Auth + DB + RLS
- Stripe subscriptions (Free/Pro)
- App Profiles (tone/format/language)
- **Desktop app (Tauri)**: werkt overal - terminal, native apps, browsers
- **Global hotkey**: Ctrl + Windows om dictation te activeren
- STT streaming via provider (client → provider) met ephemeral token van backend
- AI refinement via serverless endpoint (vercel route of supabase edge function)
- Usage limits (words/week) enforced op token mint + refine
- Text insertion via clipboard + paste simulatie (cross-platform)

### V1 (P1)

- Snippets library + triggers
- Personal dictionary (auto-suggest uit correcties)
- Workflows gallery + builder
- Team workspaces (shared snippets/dictionary/workflows)
- Device list + basic telemetry dashboard
- App detection (welke app is actief) voor auto-profile switching

### Later (P2)

- Chrome extension (optioneel, voor web-only users)
- Enterprise: SSO/SAML, audit logs, enforced privacy mode
- Native text injection (i.p.v. clipboard) per platform
- **Remote dictation**: vanaf je telefoon kunnen inspreken terwijl de desktop app op je PC thuis de tekst invoegt (handig voor onderweg)

## 4) Personas & belangrijkste use-cases

### Personas

- **Sales/Recruitment**: mails, LinkedIn, CRM notes
- **Support/Ops**: tickets, macros, replies
- **Creators**: scripts, posts
- **Dev**: docs, comments, prompts, PR descriptions

### Top use cases

- "Maak dit professioneel en kort in bullets"
- "Rewrite voor Slack: direct, 1 alinea"
- "Support: empathisch + duidelijke vervolgstap"
- "Dev: behoud camelCase/snake_case, maak het technisch"

## 5) User journeys (MVP)

1. User installeert desktop app → logt in → kiest profiel "Generic"
2. User drukt Ctrl + Windows in elke app (terminal, browser, Slack, etc.)
3. Overlay verschijnt → user spreekt → ziet live transcript
4. User laat hotkey los → transcript finalize → refine endpoint → polished text terug
5. App plakt text in actieve cursor positie (via clipboard + Ctrl+V simulatie)
6. User: accept (blijft) / undo (Ctrl+Z)

## 6) Non-functionals (MVP)

- Geen dubbele insertions (idempotency!)
- Privacy mode mogelijk: minimale logging, geen audio opslag (alleen metering)
- Rate limiting op token mint/refine (abuse voorkomen)
- RLS overal correct
- **Project taal**: Volledig Engels (code, comments, UI, documentatie)

---

# Technisch Ontwerp

## A) Architectuur (budget-first)

### Waarom Supabase + Vercel wél geschikt is

Perfect voor: auth, user data, RLS, billing metadata, dashboards, workflows/snippets.

### Waar je extra aandacht nodig hebt

Realtime streaming audio: goedkoopste route is client → STT provider met ephemeral token (geen eigen websocket gateway nodig in MVP).

### Componenten (MVP)

**Web app (Vercel, Next.js)**
- Dashboard + settings + billing
- API routes:
  - `/api/stripe/*`
  - `/api/stt/token`
  - `/api/refine`

**Supabase**
- Auth + Postgres + RLS
- Tabellen voor profiles/snippets/workflows/usage/subscriptions

**Desktop App (Tauri)**
- Cross-platform (Windows/Mac/Linux)
- Global hotkey listener (Ctrl + Windows configurable)
- Overlay window voor live transcript
- Mic audio capture
- Streams naar STT provider (WebSocket) met ephemeral token
- Calls refine endpoint met final transcript
- Text insertion via clipboard + keyboard simulation
- System tray icon + mini settings

**STT Provider**
- Streaming transcript (partials + final)
- Deepgram of AssemblyAI (goede latency + betaalbaar)

**LLM Provider**
- Refine (tone/format + cleaning)
- Claude API of OpenAI

### Tauri specifics (Windows)

- **Global hotkey**: `Ctrl + Win` (configureerbaar)
- **Text insertion**: Clipboard + `SendInput` API (Ctrl+V simulatie)
- **Overlay**: Transparent window, always-on-top
- **Auth**: Embedded webview voor Supabase login flow

## B) Data Model (Supabase Postgres)

### Tabellen (MVP)

- `user_settings` – globale voorkeuren
- `app_profiles` – per app tone/format/language
- `dictionary_terms` – personal dictionary
- `snippets` – tekstblokken + triggers
- `workflows` – templates/flows
- `usage_events` – metering (words/seconds) per actie
- `stripe_customers`
- `stripe_subscriptions`

### Optioneel (maar aanbevolen voor idempotency)

- `dictation_sessions` – session tracking om dubbele refine/insert te voorkomen

## C) Database schema SQL (migrations)

Plak dit als 1e migration in `supabase/migrations/0001_init.sql`.

```sql
-- 0001_init.sql
create extension if not exists pgcrypto;

-- Helpers
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- User settings
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  privacy_mode boolean not null default false,
  preferred_language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_user_settings_updated
before update on public.user_settings
for each row execute function public.set_updated_at();

-- App profiles (tone/format rules)
create table if not exists public.app_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app_key text not null, -- e.g. 'gmail' | 'slack' | 'docs' | 'generic'
  tone text not null default 'professional', -- freeform allowed in MVP
  language text not null default 'en',
  formatting jsonb not null default '{}'::jsonb, -- e.g. { "bullets": true, "max_length": 800 }
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_app_profile_user_app unique(user_id, app_key)
);

create index if not exists idx_app_profiles_user on public.app_profiles(user_id);

create trigger trg_app_profiles_updated
before update on public.app_profiles
for each row execute function public.set_updated_at();

-- Personal dictionary
create table if not exists public.dictionary_terms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  term text not null,
  phonetic text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_dictionary_user_term unique(user_id, term)
);

create index if not exists idx_dictionary_user on public.dictionary_terms(user_id);

create trigger trg_dictionary_updated
before update on public.dictionary_terms
for each row execute function public.set_updated_at();

-- Snippets
create table if not exists public.snippets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  trigger_phrase text null, -- e.g. "insert intro"
  variables jsonb not null default '[]'::jsonb, -- ["name","date"] etc
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_snippets_user on public.snippets(user_id);

create trigger trg_snippets_updated
before update on public.snippets
for each row execute function public.set_updated_at();

-- Workflows (simple MVP: JSON steps)
create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text null,
  tags text[] not null default '{}',
  steps jsonb not null default '[]'::jsonb, -- [{prompt, output_format}, ...]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_workflows_user on public.workflows(user_id);

create trigger trg_workflows_updated
before update on public.workflows
for each row execute function public.set_updated_at();

-- Dictation sessions (idempotency + debugging)
create table if not exists public.dictation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid null references public.app_profiles(id) on delete set null,
  client_session_id text not null, -- generated by extension
  status text not null default 'created', -- created|refined|inserted|failed
  input_text text null,
  refined_text text null,
  error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_dictation_user_client_session unique(user_id, client_session_id)
);

create index if not exists idx_dictation_user on public.dictation_sessions(user_id);

create trigger trg_dictation_updated
before update on public.dictation_sessions
for each row execute function public.set_updated_at();

-- Usage events (metering)
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null, -- 'stt_words' | 'refine_words' | 'dictation_seconds'
  quantity int not null check (quantity >= 0),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_usage_user_time on public.usage_events(user_id, created_at desc);

-- Stripe customer mapping
create table if not exists public.stripe_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now()
);

-- Stripe subscriptions
create table if not exists public.stripe_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_subscription_id text not null unique,
  status text not null, -- active|trialing|past_due|canceled|incomplete...
  price_id text not null,
  current_period_end timestamptz null,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_stripe_sub_user on public.stripe_subscriptions(user_id);

create trigger trg_stripe_sub_updated
before update on public.stripe_subscriptions
for each row execute function public.set_updated_at();
```

## D) RLS Policies (Supabase) — "locked by default"

Plak dit als `0002_rls.sql`.

```sql
-- 0002_rls.sql
alter table public.user_settings enable row level security;
alter table public.app_profiles enable row level security;
alter table public.dictionary_terms enable row level security;
alter table public.snippets enable row level security;
alter table public.workflows enable row level security;
alter table public.dictation_sessions enable row level security;
alter table public.usage_events enable row level security;
alter table public.stripe_customers enable row level security;
alter table public.stripe_subscriptions enable row level security;

-- user_settings
create policy "select own user_settings"
on public.user_settings for select
using (user_id = auth.uid());

create policy "upsert own user_settings"
on public.user_settings for insert
with check (user_id = auth.uid());

create policy "update own user_settings"
on public.user_settings for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- app_profiles
create policy "crud own app_profiles"
on public.app_profiles
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- dictionary_terms
create policy "crud own dictionary_terms"
on public.dictionary_terms
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- snippets
create policy "crud own snippets"
on public.snippets
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- workflows
create policy "crud own workflows"
on public.workflows
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- dictation_sessions (own only)
create policy "crud own dictation_sessions"
on public.dictation_sessions
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- usage_events (insert by server only? MVP: allow user insert, later restrict)
create policy "select own usage_events"
on public.usage_events for select
using (user_id = auth.uid());

create policy "insert own usage_events"
on public.usage_events for insert
with check (user_id = auth.uid());

-- stripe tables: readable by user, write by server (MVP: allow select only)
create policy "select own stripe_customers"
on public.stripe_customers for select
using (user_id = auth.uid());

create policy "select own stripe_subscriptions"
on public.stripe_subscriptions for select
using (user_id = auth.uid());
```

**Belangrijk (security)**: schrijf/updates op Stripe tabellen doe je via webhooks server-side (service role), niet via client.

## E) Plan & Usage limits (budget-friendly)

### Plan logic (simpel en goedkoop)

- **Free**: bijv. 2.000 refine words/week
- **Pro**: unlimited (of high cap)

### Enforcement punten:

- `/api/stt/token` → weiger als user over cap is
- `/api/refine` → check cap en log usage

### SQL helper: weekly usage

Plak als `0003_usage.sql`.

```sql
-- 0003_usage.sql
create or replace function public.week_start(ts timestamptz)
returns timestamptz language sql immutable as $$
  select date_trunc('week', ts);
$$;

create or replace function public.get_weekly_usage(p_user uuid, p_event_type text)
returns int language sql stable as $$
  select coalesce(sum(quantity),0)::int
  from public.usage_events
  where user_id = p_user
    and event_type = p_event_type
    and created_at >= public.week_start(now());
$$;
```

---

# API Contracten (Next.js on Vercel)

## 1) Auth model

- Web en extension gebruiken Supabase Auth (email magic link of OAuth).
- Extension gebruikt Supabase JS client + stores session token.

## 2) Endpoints (MVP)

### POST /api/stt/token

**Doel**: geef een ephemeral STT token terug zodat client direct naar STT provider kan streamen zonder jouw API key te exposen.

**Request**:
```json
{
  "provider": "deepgram",
  "profileId": "uuid-or-null"
}
```

**Response**:
```json
{
  "token": "ephemeral_provider_token",
  "expiresAt": "2026-01-15T12:34:56Z",
  "limits": { "weeklyRefineWordsRemaining": 1200 }
}
```

**Error**:
- 402 als over usage cap (free)
- 401 als niet ingelogd

**Server checks**:
- Validate user session
- Check weekly usage + subscription plan
- Mint provider token (server-side)

### POST /api/refine

**Doel**: raw transcript → polished output volgens profile.

**Request**:
```json
{
  "clientSessionId": "string",
  "profileId": "uuid-or-null",
  "rawText": "string",
  "mode": "clean"  // clean|shorten|professional|friendly|direct
}
```

**Response**:
```json
{
  "refinedText": "string",
  "applied": {
    "tone": "professional",
    "language": "en",
    "formatting": { "bullets": true }
  }
}
```

**Idempotency**:
- Gebruik `clientSessionId` + `user_id` in `dictation_sessions` om dubbel refine te voorkomen:
  - bestaat session en status=refined? return cached `refined_text`

### POST /api/stripe/checkout

**Request**:
```json
{
  "priceId": "price_XXX",
  "successUrl": "...",
  "cancelUrl": "..."
}
```

**Response**:
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

### POST /api/stripe/portal

**Response**:
```json
{
  "url": "https://billing.stripe.com/..."
}
```

### POST /api/stripe/webhook

Verwerkt Stripe events en upsert naar `stripe_customers` + `stripe_subscriptions`.

---

# Stripe Webhook Flow (MVP)

## Events om te ondersteunen

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed` (optioneel, status update)

## Flow (simpel)

1. On `checkout completed`: map `user_id` ↔ `stripe_customer_id` (metadata op checkout session zetten)
2. On `subscription created/updated/deleted`: upsert `stripe_subscriptions` met status/price/period_end
3. In app: "plan" is:
   - Pro als er een active/trialing subscription is
   - anders Free

## Cruciaal

- Webhook endpoint gebruikt Stripe signature verification
- DB writes via Supabase service role (niet client key)

---

# Claude Terminal — Step-by-step uitvoering (LLM-ready tasks)

Hieronder een strak stappenplan dat je 1-voor-1 kunt afvinken. Elke stap heeft deliverables + DoD.

## Phase 0 — Repo setup (mono-repo)

**Doel**: 1 repo met web + desktop app + supabase.

**Deliverables**:
- `/apps/web` (Next.js)
- `/apps/desktop` (Tauri)
- `/supabase` (migrations)
- Root: `pnpm` workspace config

**DoD**:
- `pnpm -r dev` start web dev server
- `pnpm --filter desktop tauri dev` start desktop app
- Tauri app compileert en draait

## Phase 1 — Supabase project + migrations

**Tasks**:
- `supabase init`
- Apply migrations `0001_init.sql`, `0002_rls.sql`, `0003_usage.sql`
- Seed: create default profiles (generic/slack/gmail/docs/notion) via script of UI

**DoD**:
- Tabellen bestaan
- RLS aan en getest: user kan alleen eigen rows zien

## Phase 2 — Next.js web app (Vercel-ready)

**Tasks**:
- Next.js + Tailwind + shadcn/ui
- Supabase client setup (browser + server)
- Auth pages: login/logout + session handling
- Protected routes: `/app/*`

**DoD**:
- User kan inloggen
- `/app` toont dashboard skeleton met user data

## Phase 3 — Profiles UI (MVP kern)

**Tasks**:
- CRUD app_profiles (list/edit)
- Default profile logic (exact 1 default)
- Formatting JSON editor (simple toggles + advanced JSON)

**DoD**:
- Profiles page werkt end-to-end
- Default profile enforced

## Phase 4 — Stripe billing (Free/Pro)

**Tasks**:
- Stripe product + price configureren
- Web endpoints:
  - `/api/stripe/checkout`
  - `/api/stripe/portal`
  - `/api/stripe/webhook`
- DB upserts in webhook

**DoD**:
- User kan upgraden naar Pro
- Subscription status zichtbaar op dashboard
- Portal werkt

## Phase 5 — Usage metering + limits

**Tasks**:
- Implement "plan resolver":
  - query `stripe_subscriptions` (active/trialing)
- Implement weekly usage checks via SQL function
- Enforce in `/api/refine` + `/api/stt/token`
- Log usage events:
  - refine words: `refine_words`
  - dictation seconds (later): `dictation_seconds`

**DoD**:
- Free user wordt geblokkeerd bij overschrijding
- Pro user gaat door

## Phase 6 — Tauri Desktop App (Core)

**Tasks**:
- Setup Tauri project in `/apps/desktop`
- Global hotkey registration (Ctrl + Windows)
- System tray icon + menu
- Overlay window (transparent, always-on-top)
- Supabase auth flow (embedded webview)
- Basic UI: login screen + settings

**DoD**:
- App draait en reageert op global hotkey
- System tray werkt
- User kan inloggen via Supabase
- Overlay verschijnt/verdwijnt correct

## Phase 7 — STT provider integration (desktop)

**Keuze (aanrader MVP)**: Deepgram of AssemblyAI streaming (goede latency, relatief betaalbaar).

**Belangrijk**: je gebruikt ephemeral tokens uit `/api/stt/token`.

**Tasks**:
- Implement `/api/stt/token`:
  - auth check
  - usage check
  - mint provider token
- Desktop app:
  - capture mic audio (via Tauri plugins)
  - connect WS naar STT provider met ephemeral token
  - render partial transcript in overlay
  - finalize transcript on hotkey release

**DoD**:
- Live transcript in overlay window
- Final transcript beschikbaar voor refine
- Audio permissions correct afgehandeld

## Phase 8 — Refine pipeline + text insertion

**Tasks**:
- Implement `/api/refine`
- DB: `dictation_sessions` upsert op `clientSessionId`
- Prompting:
  - input: `rawText` + `profile(tone/language/formatting)`
  - output: ONLY refined text (geen extra uitleg)
- Desktop app: text insertion
  - Save to clipboard
  - Simulate Ctrl+V via keyboard events
  - Restore original clipboard
- Undo: Ctrl+Z simulatie (optioneel)

**DoD**:
- Geen dubbele refine bij retry
- Refined text consistent met profile
- Text wordt correct geplakt in actieve app (terminal, browser, etc.)

## Phase 9 — Snippets + Dictionary (V1-achtig, maar goedkoop)

**Tasks**:
- CRUD snippets, dictionary_terms
- Desktop app: "command phrases"
  - "insert snippet: {title}"
- dictionary bias: stuur dictionary mee naar refine prompt

**DoD**:
- Snippet injectie werkt
- Dictionary beïnvloedt output (namen/termen kloppen vaker)

## Phase 10 — Workflows gallery (lightweight MVP)

**Tasks**:
- CRUD workflows (json steps)
- "Run workflow" UI: stap 1..n → output
- Opslaan en hergebruiken

**DoD**:
- Workflow runner werkt zonder extra infra
- Opslaan/editen werkt

## Phase 11 — Security & hardening

**Tasks**:
- Rate limiting (minimaal) op `/api/stt/token` en `/api/refine`
- Logging zonder PII (privacy)
- RLS tests + service role usage uitsluitend server-side
- Webhook signature tests

**DoD**:
- Misbruik beperkt
- Geen data leaks via RLS

---

# Remote Dictation Feature (P2 - Future)

## Concept

Vanaf je telefoon kunnen inspreken terwijl je desktop app (op je PC thuis) de tekst invoegt in de actieve applicatie. Handig voor scenario's waarbij je onderweg bent maar remote op je PC werkt, of wanneer je sneller wilt typen in een terminal sessie vanaf je telefoon.

## Use cases

- Remote werk: SSH sessie open op je PC, jij bent op de bank met je telefoon
- Dicteer lange emails/documentatie op je telefoon terwijl de tekst in je PC wordt geplakt
- Command-line work: spreek complexe commands in vanaf je telefoon

## Technische architectuur (high-level)

### Componenten

1. **Mobile app of web interface**
   - Progressive Web App (PWA) of native iOS/Android app
   - Mic access voor audio capture
   - Authentication met zelfde Supabase account
   - Device pairing flow

2. **Backend (Supabase + Next.js API)**
   - Realtime database of Supabase Realtime channels voor device messaging
   - `remote_dictation_sessions` tabel
   - Device registration: `user_devices` tabel

3. **Desktop app updates**
   - Subscribe naar realtime events voor remote dictation
   - Display notification bij inkomende remote dictation
   - Execute text insertion net zoals bij lokale dictation

### Flow

```
1. User opent mobile app → ziet lijst van paired devices/computers
2. User selecteert "Home PC" + app/profiel optioneel
3. User drukt op record knop in mobile app
4. Mobile app:
   - Capture audio
   - Stream naar STT provider (met ephemeral token)
   - Live transcript naar backend realtime channel
5. Desktop app (Home PC):
   - Luistert op realtime channel voor remote dictation
   - Toont notification: "Remote dictation incoming from [iPhone]"
   - Displays live transcript in mini overlay
6. User stopt met spreken op telefoon
7. Backend refine call (via `/api/refine`)
8. Refined text gepushed naar desktop app
9. Desktop app insert text in actieve cursor positie
10. Bevestiging terug naar mobile app: "Text inserted ✓"
```

### Database schema additions

```sql
-- User devices (voor device pairing)
create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_name text not null, -- "iPhone 15", "Home PC", "Work Laptop"
  device_type text not null, -- "mobile" | "desktop"
  device_id text not null unique, -- unique device identifier
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint uq_user_device unique(user_id, device_id)
);

-- Remote dictation sessions
create table if not exists public.remote_dictation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_device_id uuid not null references public.user_devices(id) on delete cascade,
  target_device_id uuid not null references public.user_devices(id) on delete cascade,
  status text not null default 'initiated', -- initiated|streaming|refining|completed|failed
  profile_id uuid null references public.app_profiles(id) on delete set null,
  raw_transcript text null,
  refined_text text null,
  error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Security overwegingen

- **Device pairing**: QR code scan of pairing code workflow (zoals Whatsapp Web)
- **Device verification**: alleen paired devices kunnen remote dictation starten
- **Rate limiting**: prevent misbruik via remote API
- **Permissions**: desktop app vraagt om user confirmatie voor eerste remote dictation
- **Session timeout**: remote sessions expiren na X minuten inactiviteit

### Implementatie volgorde (als P2 wordt geprioriteerd)

1. **Phase 12 - Device Management**
   - Device registration in desktop app
   - Device list UI in web dashboard
   - Device pairing flow (QR code)

2. **Phase 13 - Mobile PWA/App**
   - Basic mobile interface
   - Audio capture
   - STT streaming
   - Device selector

3. **Phase 14 - Realtime Integration**
   - Supabase Realtime channels
   - Desktop app listener
   - Live transcript sync
   - Text insertion flow

4. **Phase 15 - Polish & UX**
   - Notifications
   - Error handling
   - Offline handling
   - Multi-device support

### Cost considerations

- Supabase Realtime: gratis tot 200 concurrent connections, daarna $10/100k messages
- Mobile app ontwikkeling: PWA is goedkoopst (werkt cross-platform)
- Latency: extra hop via backend kan 100-300ms toevoegen (acceptabel voor deze use case)

---

# "Budget friendly" keuzes (heel concreet)

## Goedkoop in MVP

- Geen eigen realtime gateway: client → STT provider met ephemeral token
- Geen zware analytics tooling: gebruik `usage_events` + simpele dashboards
- Tauri desktop app: simpele clipboard-based text insertion
- Teams/SSO pas later
- Geen custom STT model training

## Kosten groeien mee

Als je traction hebt:
- Optional realtime gateway (Fly.io) voor meer controle
- Native text injection API's per platform
- Betere observability (Sentry, LogRocket)
- Chrome extension als aanvulling
