# Setup Guide

This guide walks you through setting up the Background Job Agent from scratch.

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
```

**Getting Google OAuth credentials:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Gmail API
4. Create OAuth 2.0 credentials (Web application)
5. Add `http://localhost:3010/auth/google/callback` to authorized redirect URIs
6. Copy Client ID and Client Secret to your `.env`

## Step 2: Define Your Target Roles

The agent needs to know what kind of jobs you're looking for.

**Why?** This helps the AI classify jobs and write relevant, personalized emails.

Run the database seeder to configure your roles:

```bash
pnpm run db:seed
```

This will prompt you to enter:
- Role name (e.g., "Senior Frontend Engineer")
- Email template (how you want to introduce yourself)
- Email subject line
- Key skills you want to highlight

## Step 3: Start the Application

Now let's get everything running.

**Why Docker?** We use Docker to run Inngest with a persistent database. This means your job applications survive computer restarts.

```bash
pnpm dev
```

This will:
1. Start PostgreSQL and Inngest in Docker (first run downloads images)
2. Start your application server
3. Prompt you to select job sources

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
3. The agent will now monitor channels with "job" in the name

## Step 5: Authorize Gmail

The agent needs permission to send emails on your behalf.

1. Open your browser to `http://localhost:3010/auth/google`
2. Sign in with your Google account
3. Grant permission to send emails

**Why?** This allows the agent to send application emails from your Gmail account.

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

### View Application Status

The agent tracks all applications in the database. You can use the MCP server to query:

```bash
pnpm mcp
```

This gives you tools to:
- List pending outreach tasks
- View job details
- Report back on responses

## Stopping the Application

```bash
pnpm docker:stop
```

This stops the Docker containers (PostgreSQL + Inngest). Your data is preserved in Docker volumes, so you won't lose anything.

## Troubleshooting

**Docker container won't start?**
```bash
docker-compose logs inngest
docker-compose logs postgres
```

**WhatsApp connection issues?**
- Delete `.whatsapp_auth` directory and restart to re-authenticate
- Make sure you're connected to the internet

**Google OAuth errors?**
- Verify your redirect URI matches: `http://localhost:3010/auth/google/callback`
- Check that Gmail API is enabled in Google Cloud Console
