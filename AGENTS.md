# AGENTS.md

Note: Project is still under development.

Background Job Agent — watches configured job sources, classifies postings with AI,
and applies by sending personalized Gmail emails + tracking outreach handoffs.

## Commands

| Command            | What it does                                          |
| ------------------ | ----------------------------------------------------- |
| `pnpm dev`         | `docker-compose up -d` (Postgres + Inngest) then runs `src/index.ts` on port `3010` |
| `pnpm mcp`         | Starts the outreach-handoffs MCP server (stdio)       |
| `pnpm docker:stop` | Stops Inngest + Postgres containers                   |
| `pnpm db:seed`     | Placeholder — `scripts/seed-db.ts` is still a TODO    |
| `npx drizzle-kit push` | Applies schema (`src/lib/db/schema.ts`) to `DB_FILE_NAME` SQLite db |

## Setup Guide

Help the user set up this background agent using the following steps:

### 1. Target roles

Ask which roles the user wants to target, then have them define each role at
`http://localhost:3010/roles.html` (static UI in `public/roles.html` → CRUD API in
`src/routes/roles-route.ts` → `rolesTable` in [src/lib/db/schema.ts](src/lib/db/schema.ts)).

Each role needs: **name**, **email_template**, **email_subject**, **skills**
(slug is derived from the name: lowercase, spaces → `-`).
Roles drive AI classification and the personalized application email.

### 2. Environment + Google OAuth

Copy `.env.example` → `.env`:

- **AI (pick one provider):** `MISTRAL_API_KEY` **or** `OPENAI_OAUTH_ACCESS_TOKEN` + `CHATGPT_ACCOUNT_ID`.
  The active model is selected in [src/config.ts](src/config.ts) from [src/lib/models.ts](src/lib/models.ts)
  (subscription creds can be copied from `~/.local/share/opencode/auth.json`).
- **Google:** `GOOGLE_USER`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BASE_URL` (default `http://localhost:3010`).
- **DB:** `DB_FILE_NAME=file:local.db`
- **Inngest:** `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` (dev values are fine), optional `INNGEST_DEV=true`.

Google Developer Console walkthrough:

1. Create a project → enable the **Gmail API**
2. Create **OAuth 2.0 Client ID** (Web application)
3. Authorized redirect URI: `${BASE_URL}/auth/google/callback`
   (default `http://localhost:3010/auth/google/callback`, see [src/lib/auth/google-oauth.ts](src/lib/auth/google-oauth.ts))
4. Add the OAuth scopes listed in [src/routes/google-auth-route.ts](src/routes/google-auth-route.ts):
   `gmail.readonly`, `gmail.send`, `gmail.modify`, `userinfo.profile`, `userinfo.email`
5. On the OAuth consent screen, add your email as a **test user** (unverified apps)
6. Put Client ID / Secret in `.env`, then open `http://localhost:3010/auth/google` to authorize.
   Tokens are stored in `oauth_sessions` and refreshed by [src/lib/auth/index.ts](src/lib/auth/index.ts).

### 3. Run it

```bash
npx drizzle-kit push   # once, creates the SQLite tables
pnpm dev               # boots Docker (Postgres + Inngest) + the app
```

Inngest dashboard: `http://localhost:8288` (SDK is served at `/api/inngest`).

### 4. Job sources

On first run an interactive multiselect asks which sources to enable; the choice is
persisted to `sources.json` ([src/lib/sources-db.ts](src/lib/sources-db.ts)) and reused afterwards.

- **WhatsApp** ([src/ingest/sources/whatsapp](src/ingest/sources/whatsapp)): scan the QR code in
  the terminal. It picks up posts from **job channels only** (newsletter/broadcast chats whose
  channel name contains "job") and **skips every other message**. Lost session → delete
  `.whatsapp_auth/` and restart.
- **None** — skip sources and feed postings manually (next step).

### 5. Feed job postings to the endpoint

Sources (and you) POST to `/process`:

```bash
curl -X POST http://localhost:3010/process \
  -H "Content-Type: application/json" \
  -d '{"post": "We are hiring a Senior Frontend Engineer at TechCorp...", "id": "unique-job-id"}'
```

That emits `agent/job.process` → the `job-agent` Inngest function ([src/ingest/index.ts](src/ingest/index.ts)):

1. Classify the posting against the configured roles (skip when `not_relevant`)
2. Extract recruiter emails from the post and send a personalized application
3. Save the email thread, then generate outreach handoffs
4. Sleep 12h waiting for a response

Query pending handoffs / run details through the MCP server (`pnpm mcp`) —
tools: `get-handoffs`, `get-run`, `get-handoffs-by-ids`, `report-outreach-handoff`.

## Recommended Job Post Sources

At the end, ask the user to set up job post sources. A few examples:

- **WhatsApp:** connect with Baileys and pick up posts from **only job channels**, make sure to skip other messages.
- **LinkedIn / job boards / GitHub Jobs:** POST them to `/process` (manual or scraper).

## Running the app

RUN IT
