# Setup Guide

This guide walks you through setting up the Background Job Agent from scratch.

## Choose AI Model

This AI Agent runs on the Vercel AI SDK, which means you can choose from [available providers](https://ai-sdk.dev/providers/ai-sdk-providers).

For minimal setup, only `openai-subscription` and `mistral` models are supported ([see more here](/src/lib/models.ts)).

Models are configured in [src/config.ts](/src/config.ts): `model` generates outreach handoffs, `decisionModel` handles job classification. Application emails are not AI-generated: each one is the matching role's email template and subject, sent as written. Classification currently uses Cloudflare's free `clef` decision model, so it needs Cloudflare credentials too.

**Setup credentials:** If you plan to use a provider API key, it's straightforward to get the API key from their platform. Using `subscription` is a bit trickier - you need to authenticate in the browser. We recommend using a tool like [opencode](https://github.com/sst/opencode) to handle this. Once authenticated, find your credentials at `~/.local/share/opencode/auth.json`.

## Step 1: Configure Your Environment

First, we need to set up API keys and credentials so the agent can do its work.

**Why?** The agent needs to know who you are, how to send emails, and which AI to use for classification.

Create a `.env` file in the project root:

```bash
# Choose ONE AI provider (Mistral or OpenAI)
MISTRAL_API_KEY=your_mistral_key_here
# OR
OPENAI_OAUTH_ACCESS_TOKEN=your_openai_token
CHATGPT_ACCOUNT_ID=your_account_id

# Cloudflare (job classification via the free clef model)
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token

# Google OAuth (for Gmail)
GOOGLE_USER=your_email@gmail.com
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
BASE_URL=http://localhost:3010

# Database
DB_FILE_NAME=file:local.db

# Inngest (local)
INNGEST_EVENT_KEY=test-key
INNGEST_SIGNING_KEY=test-signing-key
# Optional: run the Inngest SDK in dev mode
# INNGEST_DEV=true
```

**Getting Google OAuth credentials:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Gmail API
4. Create OAuth 2.0 credentials (Web application)
5. Add `http://localhost:3010/auth/google/callback` to authorized redirect URIs
6. Add these OAuth scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/userinfo.email`
7. Go to OAuth consent screen, add your email as a test user (required for unverified apps)
8. Copy Client ID and Client Secret to your `.env`

## Step 2: Start the Application

Now let's get everything running.

First, create the SQLite tables (only needed once, and again after schema changes):

```bash
npx drizzle-kit push
```

**Why Docker?** We use Docker to run the Inngest dev server, which schedules and retries each job-processing step. Your roles, runs and email threads live in the local SQLite database (`DB_FILE_NAME`).

```bash
pnpm dev
```

This will:

1. Start Inngest in Docker (first run downloads the image)
2. Start your application server

## Step 3: Define Your Target Roles

The agent needs to know what kind of jobs you're looking for.

**Why?** The AI classifies each job against these roles, and the best-matching role's template is the email that gets sent.

Open your browser to `http://localhost:3010/roles.html` and fill in:

- Role name (e.g., "Senior Frontend Engineer")
- Email template (the email body sent to recruiters, as written)
- Email subject line
- Key skills you want to highlight

## Step 4: Configure Job Sources

On first run, you'll see a menu:

```
? Select job sources to enable:
○ None - Skip job sources
● WhatsApp - Monitor WhatsApp job channels
```

**Why this step?** You might not want all sources enabled. Maybe you only want WhatsApp for now, or maybe you want to add LinkedIn later.

- Select **WhatsApp** to monitor WhatsApp job channels
- Select **None** if you want to skip sources and manually submit jobs via the `/process` endpoint

If you select WhatsApp:

1. A QR code will appear in your terminal
2. Scan it with WhatsApp on your phone
3. The agent will now monitor WhatsApp channels (newsletters) whose name contains one of: `job`, `hiring`, `freelance`, `gig`, `internship`, `software`, `web`, `app`, `game`, `remote`, `technology`, `it`, `education`. Every other chat is ignored.

## Step 5: Authorize Gmail

The agent needs permission to send emails on your behalf.

1. Open your browser to `http://localhost:3010/auth/google`
2. Sign in with your Google account
3. Grant permission to send emails

**Why?** This allows the agent to send application emails from your Gmail account.

---

## How to Use

### Automatic Mode (with Job Sources)

If you enabled WhatsApp or other sources, the agent will:

- Automatically detect new job postings
- Classify them
- Send applications
- You just need to keep the server running

### Manual Mode

You can manually submit job postings via the API:

```bash
curl -X POST http://localhost:3010/process \
  -H "Content-Type: application/json" \
  -d '{
    "post": "We are hiring a Senior Frontend Engineer at TechCorp...",
    "id": "unique-job-id"
  }'
```

`post` is required. `id` is optional: it identifies the run, so re-submitting the same `id` won't start a second run. If you leave it out, one is generated. The response includes it: `{"success": true, "id": "unique-job-id"}`.

### View Application Status

The agent tracks all applications in the database. You can use the MCP server to query:

```bash
pnpm mcp
```

This gives you tools to:

- `get-handoffs`: list outreach tasks
- `get-run`: view a run (job post, classification, email threads)
- `get-handoffs-by-run` / `get-handoffs-by-ids`: fetch specific tasks
- `report-outreach-handoff`: report a task's outcome

## Stopping the Application

```bash
pnpm docker:stop
```

This stops the Inngest container. Your roles, runs and email threads are kept in the local SQLite database.

## Troubleshooting

**Docker container won't start?**

```bash
docker-compose logs inngest
```

**WhatsApp connection issues?**

- Delete `.whatsapp_auth` directory and restart to re-authenticate
- Make sure you're connected to the internet

**Google OAuth errors?**

- Verify your redirect URI matches: `http://localhost:3010/auth/google/callback`
- Check that Gmail API is enabled in Google Cloud Console
