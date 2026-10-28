# Background Job Agent

An automated system that monitors job postings from various sources and applies to them on your behalf by sending personalized emails to recruiters.

## How It Works

Imagine you're looking for a job and you see job postings scattered across different platforms - WhatsApp channels, LinkedIn, job boards. Checking all of them manually and applying one by one is tedious.

This agent automates that entire process:

1. **Monitors job sources** - Watches for new job postings from platforms you configure (e.g., WhatsApp job channels)
2. **Classifies jobs** - Uses AI to understand if a job posting is relevant to you
3. **Applies automatically** - Sends personalized emails to recruiters when a good match is found
4. **Tracks applications** - Keeps records of what was applied to and the responses

## Architecture

_Note: Some components are under development_

<img width="1193" height="698" alt="Screenshot from 2026-10-27 17-51-35" src="https://github.com/user-attachments/assets/dc00c721-7f05-4d06-a070-85f171f224a9" />

## Quick Start

[Full setup guide →](docs/setup.md)

```bash
# 1. Configure environment (copy .env.example to .env and fill in values)
cp .env.example .env

# 2. Define your target roles
pnpm run db:seed

# 3. Start the application
pnpm dev
```

## What's Next?

- Add more job sources (LinkedIn, GitHub Jobs, etc.)
- Configure more roles for different job types
- Set up the MCP server to integrate with your workflow

---

<div align="center">
<h4 font-weight="bold">This repository is maintained by <a href="https://github.com/Zain-ul-din">Zain-Ul-Din</a></h4>
<p> Show some ❤️ by starring this awesome repository! </p>
</div>

<div align="center">
<a href="https://www.buymeacoffee.com/zainuldin" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>

</div>
