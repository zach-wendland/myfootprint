# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MyFootprint is a personal security OSINT toolkit for credential checking and dark web reconnaissance. Built for pentesters and security researchers.

## Tech Stack

- Python 3 (breach checker)
- Go (PryingDeep crawler)
- Node.js (Kali MCP server)
- Docker (containerized tools)

## Tools Included

### 1. Breach Checker (`breach_checker.py`)
Local credential checker using LeakCheck API.

```bash
pip install requests
python breach_checker.py -i                    # Interactive mode
python breach_checker.py your@email.com        # Single check
```

### 2. TorBot (`TorBot/`)
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

### 3. PryingDeep (`pryingdeep/`)
Go-based deep web intelligence gatherer. Requires PostgreSQL or Docker.

```bash
go install -v github.com/iudicium/pryingdeep/cmd/pryingdeep@latest
pryingdeep install
pryingdeep crawl -u http://example.onion
pryingdeep export -f json
```

### 4. Kali MCP Server (Global)
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
├── breach_checker.py    # LeakCheck API credential checker
├── TorBot/              # OWASP .onion crawler (Python)
├── pryingdeep/          # Deep web OSINT (Go)
└── requirements.txt
```

External:
- `C:\Users\lyyud\PROJECTS\kali-mcp` - Kali Linux MCP server (Docker)

## Constraints

- TorBot/PryingDeep require Tor running (SOCKS5 proxy on 127.0.0.1:9050)
- Kali MCP requires Docker with privileged mode
- LeakCheck API has rate limits on free tier
