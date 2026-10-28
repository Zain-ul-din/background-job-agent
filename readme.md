# Background Job Agent

A background agent that sends emails to recruiters. `More is coming soon...`

## How does it work?

<img width="1193" height="698" alt="Screenshot from 2026-10-27 17-51-35" src="https://github.com/user-attachments/assets/dc00c721-7f05-4d06-a070-85f171f224a9" />

## Setup guide

For Simple Setup follow following prompt into your Agentic Harness:

```txt
Help me with setup of this background-agent
```

Run Inngest:

```bash
npx --ignore-scripts=false inngest-cli@latest dev -u http://localhost:3010/api/inngest
```

Google OAuth scopes for Gmail:

```
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/gmail.modify
```
