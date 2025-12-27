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
Next.js multi-source OSINT lookup with support for:
- **Email lookup**: Breach checking via LeakCheck + social profile discovery
- **Username lookup**: Social media presence across major platforms + GitHub API
- **Phone lookup**: Validation, carrier detection, line type via phonenumbers library
- **Name + State lookup**: Legal records via CourtListener + manual search links

```bash
cd web
npm install
npm run dev          # Local dev server on :3000
npm run build        # Production build
npm run lint         # ESLint check
```

Environment variables (`.env.local`):
- `LEAKCHECK_API_KEY` - Required for breach checking
- `NUMVERIFY_API_KEY` - Optional for enhanced phone lookup
- `VERIPHONE_API_KEY` - Optional for phone carrier data
- `PDL_API_KEY` - Optional for People Data Labs name search

### 2. People Search CLI (`people_search.py`)
Multi-source OSINT lookup for emails, usernames, phones, and names.

```bash
pip install -r requirements.txt

# Email lookup (breach + social)
python people_search.py user@example.com -t email

# Username lookup (social profiles)
python people_search.py johndoe -t username --deep

# Phone lookup (validation + carrier)
python people_search.py "+1 415 555 1234" -t phone

# Name + state lookup (legal records)
python people_search.py "John Doe" -t name --state CA

# Auto-detect query type
python people_search.py user@example.com

# Output as JSON
python people_search.py johndoe -t username --json
```

Data sources:
- **Email**: LeakCheck API, social profile extraction
- **Username**: GitHub API, quick social check (Twitter, Instagram, etc.)
- **Phone**: phonenumbers library (free), Numverify, Veriphone APIs
- **Name**: CourtListener (free), People Data Labs (optional)

### 3. Breach Checker CLI (`breach_checker.py`)
Simple credential checker using LeakCheck API (legacy, use people_search.py instead).

```bash
pip install requests
python breach_checker.py -i                    # Interactive mode
python breach_checker.py your@email.com        # Single check
```

### 4. TorBot (`TorBot/`)
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

### 5. PryingDeep (`pryingdeep/`)
Go-based deep web intelligence gatherer. Requires PostgreSQL or Docker.

```bash
go install -v github.com/iudicium/pryingdeep/cmd/pryingdeep@latest
pryingdeep install
pryingdeep crawl -u http://example.onion
pryingdeep export -f json
```

### 6. Kali MCP Server (Global)
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
├── web/                       # Next.js OSINT dashboard
│   ├── src/app/page.tsx       # Multi-source search UI
│   ├── src/app/api/check/     # LeakCheck v2 API route
│   └── src/app/api/search/    # Unified OSINT search API
├── people_search.py           # Multi-source OSINT CLI
├── breach_checker.py          # LeakCheck API CLI (legacy)
├── TorBot/                    # OWASP .onion crawler (Python)
├── pryingdeep/                # Deep web OSINT (Go)
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
