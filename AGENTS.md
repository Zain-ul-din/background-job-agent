## Setup Guide

Note: Project is still under development

Help user setup this background agent using following steps:

- Ask about user roles they wants to apply [see ref](/src/lib/db/schema.ts)
- Help user to setup project on Google Developer Console and OAuth Scopes [see ref](src/lib/auth/google-oauth.ts)
- Explain next steps to feed job postings to the endpoint

Recommended Job Posts Sources:

At the end, ask user to setup Job posts sources, few examples includes:

- WhatsApp: Connect using Baileys and pick up posts from ONLY Job channels make sure skip other messages.

RUN IT
