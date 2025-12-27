# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MyFootprint is a personal security OSINT toolkit for credential checking and dark web reconnaissance. Built for pentesters and security researchers.

## Tech Stack

- Next.js 16.1 + React 19.2 + TypeScript (web UI)
- Python 3 (OSINT CLI tools)
- Go (PryingDeep crawler)
- Docker (containerized Kali tools)

## Quick Start

```bash
# Web UI
cd web && npm install && npm run dev

# Python CLI
pip install -r requirements.txt
python people_search.py user@example.com
```

## Architecture

**Cross-language integration**: The web UI spawns Python scripts via `child_process.spawn()`. See `web/src/app/api/search/route.ts:46` for the pattern.

```
web/src/app/
├── page.tsx              # Tabbed search UI (email/username/phone/name)
├── api/check/route.ts    # LeakCheck v2 direct API
└── api/search/route.ts   # Spawns people_search.py, returns JSON

people_search.py          # Multi-source OSINT module
├── PhoneLookup           # phonenumbers lib + Numverify/Veriphone APIs
├── UsernameLookup        # GitHub API + quick social check + Sherlock/Maigret
├── NameLookup            # CourtListener + People Data Labs + manual links
└── MyFootprintOSINT      # Unified interface with risk scoring
```

## Commands

### Web UI (`web/`)
```bash
npm run dev          # Dev server on :3000
npm run build        # Production build
npm run lint         # ESLint
```

### People Search CLI
```bash
# Auto-detects query type
python people_search.py user@example.com
python people_search.py johndoe -t username --deep
python people_search.py "+1 415 555 1234" -t phone
python people_search.py "John Doe" -t name --state CA
python people_search.py johndoe --json   # JSON output
```

### Dark Web Tools
```bash
# TorBot (requires Tor on 127.0.0.1:9050)
cd TorBot && pip install -r requirements.txt && pip install -e .
./main.py -u http://example.onion --depth 2 --save json

# PryingDeep (requires PostgreSQL)
go install github.com/iudicium/pryingdeep/cmd/pryingdeep@latest
pryingdeep install && pryingdeep crawl -u http://example.onion
```

## Environment Variables

Set in `web/.env.local`:
- `LEAKCHECK_API_KEY` - Required for breach checking
- `NUMVERIFY_API_KEY` - Optional, enhanced phone lookup (100 req/month free)
- `VERIPHONE_API_KEY` - Optional, phone carrier data (1000 req/month free)
- `PDL_API_KEY` - Optional, People Data Labs name search (paid)

## Data Sources

| Lookup Type | Free Sources | API Sources |
|-------------|--------------|-------------|
| Email | Social profile extraction | LeakCheck |
| Username | GitHub API, HTTP social checks | Sherlock, Maigret |
| Phone | phonenumbers library | Numverify, Veriphone |
| Name | CourtListener (5000 req/day) | People Data Labs |

## Constraints

- TorBot/PryingDeep require Tor SOCKS5 proxy on `127.0.0.1:9050`
- LeakCheck API has rate limits on free tier
- Kali MCP server requires Docker with privileged mode

## GitHub

https://github.com/zach-wendland/myfootprint
