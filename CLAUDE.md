# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MyFootprint is a personal security OSINT toolkit for credential checking and dark web reconnaissance. Built for pentesters and security researchers.

## Tech Stack

- Next.js 16 + React 19 + TypeScript (web UI)
- Python 3 (breach checker CLI)
- Go (PryingDeep crawler)
- Node.js (Kali MCP server)
- Docker (containerized tools)

## Tools Included

### 1. Web UI (`web/`)
Next.js breach checker using LeakCheck v2 API (paid tier) for full password data.

```bash
cd web
npm install
npm run dev          # Local dev server on :3000
npm run build        # Production build
npm run lint         # ESLint check
```

Environment: Set `LEAKCHECK_API_KEY` in `.env.local`.

### 2. Breach Checker CLI (`breach_checker.py`)
Local credential checker using LeakCheck API.

```bash
pip install requests
python breach_checker.py -i                    # Interactive mode
python breach_checker.py your@email.com        # Single check
```

### 3. TorBot (`TorBot/`)
OWASP dark web crawler for .onion sites.

```bash
cd TorBot
python -m venv torbot_venv
source torbot_venv/bin/activate  # or .\torbot_venv\Scripts\activate on Windows
pip install -r requirements.txt
pip install -e .
./main.py -u http://example.onion --depth 2 --save json
```

Options: `--depth N`, `--save json|tree`, `--visualize tree|table`, `-i` for site info

### 4. PryingDeep (`pryingdeep/`)
Go-based deep web intelligence gatherer. Requires PostgreSQL or Docker.

```bash
go install -v github.com/iudicium/pryingdeep/cmd/pryingdeep@latest
pryingdeep install
pryingdeep crawl -u http://example.onion
pryingdeep export -f json
```

### 5. Kali MCP Server (Global)
Configured globally in `~/.claude/settings.json`. Requires Docker.

```bash
cd C:\Users\lyyud\PROJECTS\kali-mcp
docker build -t kali-mcp-server .
```

Tools available: nmap, whois, dig, nikto, sqlmap, hydra, metasploit search, ssl scan, subdomain enum

## Setup Requirements

```bash
# Core
pip install requests

# TorBot
pip install -r TorBot/requirements.txt

# PryingDeep
go install github.com/iudicium/pryingdeep/cmd/pryingdeep@latest

# Kali MCP (Docker required)
docker build -t kali-mcp-server C:\Users\lyyud\PROJECTS\kali-mcp
```

## Architecture

```
MYFOOTPRINT/
├── web/                 # Next.js breach checker
│   ├── src/app/page.tsx       # Frontend UI
│   └── src/app/api/check/     # LeakCheck v2 API route
├── breach_checker.py    # LeakCheck API CLI
├── TorBot/              # OWASP .onion crawler (Python)
├── pryingdeep/          # Deep web OSINT (Go)
└── requirements.txt
```

External:
- `C:\Users\lyyud\PROJECTS\kali-mcp` - Kali Linux MCP server (Docker)

## GitHub

- **Repo**: https://github.com/zach-wendland/myfootprint

## Constraints

- TorBot/PryingDeep require Tor running (SOCKS5 proxy on 127.0.0.1:9050)
- Kali MCP requires Docker with privileged mode
- LeakCheck API has rate limits on free tier
