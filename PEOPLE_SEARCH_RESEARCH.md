# People Search Data Aggregation & Enrichment Platforms - OSINT Research 2025

Comprehensive research on people search APIs, data brokers, and open-source tools for OSINT investigations.

---

## Table of Contents
1. [Commercial People Search APIs](#commercial-people-search-apis)
2. [Social Media Profile Aggregators](#social-media-profile-aggregators)
3. [Email to Social Profile Services](#email-to-social-profile-services)
4. [Data Broker APIs for OSINT](#data-broker-apis-for-osint)
5. [Open Source People Search Tools](#open-source-people-search-tools)
6. [Python Integration Examples](#python-integration-examples)

---

## Commercial People Search APIs

### 1. Pipl (Now Enterprise-Only)

**Overview:**
- Enterprise-grade identity resolution API for banks and fraud teams
- Coverage of 200+ countries with millisecond response times
- No longer available for free or personal use

**Pricing:**
- Custom pricing (not publicly available)
- Pay-per-match model - charged only when API response includes a match
- No free trial available
- Default limit: 20 total queries (10 with live feeds)
- Typical cost barrier requires contacting sales team

**Performance:**
- < 1 second response time (without live feeds)
- < 2 seconds response time (with live feeds)

**API Documentation:**
- Docs: https://docs.pipl.com/docs/welcome-to-the-pipl-search-api

**Use Cases:**
- Banking fraud detection
- KYC/AML compliance
- Enterprise background checks

---

### 2. Spokeo

**Overview:**
- Active API platform with developer documentation
- People, contact, social, and property data
- Supports workflow/application integration

**Features:**
- Reverse phone lookup
- Address search
- Email lookup
- Social media profiles
- Property records

**Pricing:**
- Custom pricing (contact sales)
- API documentation available at docs.spokeo.com

**Python Integration:**
```python
import requests

SPOKEO_API_KEY = "your_api_key_here"
BASE_URL = "https://api.spokeo.com/v1"

def search_email(email):
    endpoint = f"{BASE_URL}/email"
    headers = {
        "Authorization": f"Bearer {SPOKEO_API_KEY}",
        "Content-Type": "application/json"
    }
    params = {"email": email}

    response = requests.get(endpoint, headers=headers, params=params)
    return response.json()

# Example usage
result = search_email("target@example.com")
print(result)
```

---

### 3. BeenVerified

**Overview:**
- Consumer-facing service WITHOUT public API
- Data must be exported manually (spreadsheet format)
- No developer API access available

**Alternative:**
- Use data export feature for CRM integration
- Not suitable for automated OSINT workflows

---

### 4. Whitepages

**Overview:**
- One of the oldest people search services
- Reverse phone and address lookups
- U.S. spam-call analytics

**Features:**
- Free basic contact info (unlike Spokeo)
- Background checks (paid)
- Phone number verification
- Address history

**Pricing:**
- Free tier available
- Paid plans for comprehensive data

---

### 5. TrueCaller

**Overview:**
- Best for phone number identification
- Missed call identification
- Spam call blocking

**Features:**
- Reverse phone lookup
- Caller ID
- Mobile app integration
- Global phone database

**API Access:**
- Limited API availability
- Primarily mobile app-focused

---

### 6. People Data Labs

**Overview:**
- Comprehensive B2B and person data enrichment API
- Strong data coverage and accuracy

**Pricing (2025):**

| Plan | Monthly Cost | Credits | Features |
|------|-------------|---------|----------|
| Free | $0 | 100 person/company lookups, 25 IP lookups | Basic data fields only |
| Pro | $98 | 350 person enrichment, 1,000 company lookups | Contact data, premium fields |
| Enterprise | $2,500+ | Unlimited credits | Custom integrations, dedicated support |

**Per-Record Costs:**
- Person enrichment: $0.004 per record
- Contact data (email/phone): $0.55-$0.40 per successful match
- Volume discounts for 1M+ records monthly

**Python Integration:**
```python
import requests

PDL_API_KEY = "your_pdl_api_key"
PDL_URL = "https://api.peopledatalabs.com/v5/person/enrich"

def enrich_person(email=None, phone=None, name=None):
    headers = {
        "X-API-Key": PDL_API_KEY,
        "Content-Type": "application/json"
    }

    params = {}
    if email:
        params["email"] = email
    if phone:
        params["phone"] = phone
    if name:
        params["name"] = name

    response = requests.get(PDL_URL, headers=headers, params=params)

    if response.status_code == 200:
        return response.json()
    else:
        return {"error": response.status_code, "message": response.text}

# Example usage
person_data = enrich_person(email="john.doe@example.com")
print(f"Name: {person_data.get('full_name')}")
print(f"Location: {person_data.get('location')}")
print(f"LinkedIn: {person_data.get('linkedin_url')}")
```

---

### 7. FullContact

**Overview:**
- Identity resolution and data enrichment
- Now part of HubSpot (Breeze Intelligence)

**Pricing (2025):**

| Plan | Monthly Cost | Features |
|------|-------------|----------|
| Free | $0 | 100 enrichments |
| Pro | $99 | Basic API access |
| Basic | $500 | Small business tier |
| Premium | $2,000 | Medium business |
| Enterprise | $10,000+ | Custom integration |

**Important Notes:**
- Since June 2025: 1 enrichment = 10 HubSpot Credits
- Credits: ~$0.09-$0.10 per record
- Credits reset monthly (no rollover)
- Charges per request, NOT per successful call

**Python Integration:**
```python
import requests

FULLCONTACT_API_KEY = "your_fullcontact_api_key"

def enrich_email(email):
    url = "https://api.fullcontact.com/v3/person.enrich"
    headers = {
        "Authorization": f"Bearer {FULLCONTACT_API_KEY}"
    }
    data = {
        "email": email
    }

    response = requests.post(url, headers=headers, json=data)
    return response.json()

# Example
result = enrich_email("target@example.com")
print(result)
```

---

## Social Media Profile Aggregators

### 1. Clearbit (Now HubSpot Breeze Intelligence)

**Overview:**
- Acquired by HubSpot (November 2023)
- Company and person data enrichment
- B2B contact discovery

**Pricing (2025):**
- Starts at $45/mo (annual) or $50/mo (monthly)
- 100 Breeze Intelligence credits included
- API enrichment: $99/month for 275 requests
- Enterprise: $80,000+ annually for large organizations

**Real-World Costs:**
- Small startups: ~$230/month
- Mid-sized teams: ~$2,300/month
- Enterprise ABM: $9,000+/month

**Python Integration:**
```python
import requests

CLEARBIT_API_KEY = "your_clearbit_api_key"

def lookup_person(email):
    url = f"https://person.clearbit.com/v2/people/find?email={email}"
    response = requests.get(url, auth=(CLEARBIT_API_KEY, ''))

    if response.status_code == 200:
        return response.json()
    else:
        return None

# Example
person = lookup_person("john@example.com")
if person:
    print(f"Name: {person['name']['fullName']}")
    print(f"LinkedIn: {person.get('linkedin', {}).get('handle')}")
    print(f"Twitter: {person.get('twitter', {}).get('handle')}")
```

---

### 2. Gravatar

**Overview:**
- Free avatar/profile image service
- Basic profile information
- NOT a data enrichment service

**API Access:**
- Free public API
- Email to avatar lookup
- Limited profile data

**Python Integration:**
```python
import hashlib
import requests

def get_gravatar_profile(email):
    # Create MD5 hash of lowercase email
    email_hash = hashlib.md5(email.lower().encode()).hexdigest()

    # Fetch profile data
    url = f"https://www.gravatar.com/{email_hash}.json"
    response = requests.get(url)

    if response.status_code == 200:
        return response.json()
    else:
        return None

# Example
profile = get_gravatar_profile("target@example.com")
if profile:
    print(profile['entry'][0])
```

---

### 3. Influencers Club API

**Overview:**
- Creator and influencer data across 190M+ profiles
- Platforms: Instagram, TikTok, YouTube, Twitch, X, OnlyFans

**Features:**
- Search by username or email
- Profile metrics and stats
- Verified emails
- 40+ profile-level data points

**Pricing:**
- Starts at $249/month

---

### 4. Data365

**Overview:**
- Structured social media data APIs
- Cleaner than direct platform APIs
- Faster development cycles

**Features:**
- User profiles, posts, comments
- Likes, shares, followers
- Engagement metrics
- Historical data

---

## Email to Social Profile Services

### 1. Hunter.io

**Overview:**
- Email finder and verification API
- Domain search capabilities
- Email pattern detection

**Features:**
- Email verification with confidence scores
- Technical checks (syntax, MX records, SMTP)
- Domain existence verification
- Disposable email detection
- 71%+ accuracy for small business domains

**API Performance:**
- RESTful API
- Fast response times
- Near 100% uptime

**Python Integration:**
```python
import requests

HUNTER_API_KEY = "your_hunter_api_key"

def verify_email(email):
    url = "https://api.hunter.io/v2/email-verifier"
    params = {
        "email": email,
        "api_key": HUNTER_API_KEY
    }

    response = requests.get(url, params=params)
    data = response.json()

    return {
        "email": data['data']['email'],
        "status": data['data']['status'],
        "score": data['data']['score'],
        "result": data['data']['result']
    }

def find_email(domain, first_name, last_name):
    url = "https://api.hunter.io/v2/email-finder"
    params = {
        "domain": domain,
        "first_name": first_name,
        "last_name": last_name,
        "api_key": HUNTER_API_KEY
    }

    response = requests.get(url, params=params)
    data = response.json()

    return data['data']['email'] if data.get('data') else None

# Examples
verification = verify_email("john.doe@example.com")
print(f"Email valid: {verification['result']}, Score: {verification['score']}")

found_email = find_email("example.com", "John", "Doe")
print(f"Found email: {found_email}")
```

---

### 2. RocketReach

**Overview:**
- Extensive contact database
- CRM integrations (Salesforce, HubSpot)
- Full API capabilities

**Features:**
- Email verification
- Phone number lookup
- Social profile aggregation
- Custom workflow integration

**Best For:**
- Large business needs
- Real-time data sets
- Contact and company data
- Advanced filtering

---

### 3. Holehe

**Overview:**
- Check if email exists on 200+ platforms
- Fast and reliable
- Open source Python tool

**Installation:**
```bash
pip install holehe
```

**Python Usage:**
```python
from holehe import holehe

# Command-line usage is primary method
# For programmatic use:
import asyncio
from holehe.modules import *

async def check_email(email):
    # Holehe primarily uses CLI
    # For Python integration, use subprocess
    import subprocess
    result = subprocess.run(['holehe', email], capture_output=True, text=True)
    return result.stdout

# Example
email_info = asyncio.run(check_email("target@example.com"))
print(email_info)
```

**Command-Line Usage:**
```bash
holehe target@example.com
```

---

## Data Broker APIs for OSINT

### 1. OSINT Industries

**Overview:**
- Real-time OSINT API access
- Global email and phone data
- Privacy-focused (no storage of searches)

**Features:**
- Automated data collection
- Analysis workflows
- Never stores search results
- API access for integration

**Website:** https://www.osint.industries/

---

### 2. ShadowDragon

**Overview:**
- Professional-grade OSINT platform
- 600+ diverse data sources
- Comprehensive investigative capabilities

**Use Cases:**
- Law enforcement
- Corporate investigations
- Threat intelligence
- Background checks

---

### 3. Swordfish AI

**Overview:**
- Direct contact information for decision-makers
- Alternative to Pipl
- B2B contact discovery

**Features:**
- Email discovery
- Phone numbers
- LinkedIn integration
- Key decision-maker targeting

---

### 4. Intelius

**Overview:**
- Background checks and people search
- Comprehensive data coverage
- Fee-based access

**Features:**
- Criminal records
- Address history
- Phone numbers
- Relatives and associates

---

### 5. PeekYou

**Overview:**
- Internet footprint aggregation
- Social media tracking
- Blog and web activity

**Features:**
- Cross-platform profile linking
- Public records integration
- Social media presence mapping

---

## Open Source People Search Tools

### 1. Sherlock

**Overview:**
- Username search across 581+ social networks
- Lightning-fast searches
- Open source Python tool

**Installation:**
```bash
# Method 1: pipx
pipx install sherlock-project

# Method 2: pip
pip install --user sherlock-project

# Method 3: Clone from GitHub
git clone https://github.com/sherlock-project/sherlock.git
cd sherlock
pip install -r requirements.txt
```

**Usage:**
```bash
# Basic search
sherlock username123

# Save to CSV
sherlock username123 --csv

# Save to Excel
sherlock username123 --xlsx

# Search specific sites
sherlock username123 --site Twitter --site Instagram
```

**Python Integration:**
```python
import subprocess
import json

def sherlock_search(username, output_format="json"):
    """
    Search for username across social networks using Sherlock
    """
    cmd = ["sherlock", username, "--print-found"]

    if output_format == "json":
        cmd.append("--json")
        cmd.append(f"{username}.json")

    result = subprocess.run(cmd, capture_output=True, text=True)

    if output_format == "json":
        with open(f"{username}.json", 'r') as f:
            return json.load(f)

    return result.stdout

# Example
results = sherlock_search("johnsmith")
print(results)
```

---

### 2. Maigret

**Overview:**
- Enhanced fork of Sherlock
- Search across 3000+ sites
- False positive detection
- Detailed analysis and reporting

**Installation:**
```bash
pip3 install maigret
```

**Usage:**
```bash
# Basic search
maigret username123

# Generate reports
maigret username123 --pdf
maigret username123 --html

# Search with tags
maigret username123 --tags social,forums
```

**Python Integration:**
```python
import subprocess
import json

def maigret_search(username, output_dir="./results"):
    """
    Advanced username search with Maigret
    """
    cmd = [
        "maigret",
        username,
        "--folderoutput", output_dir,
        "--json", "simple"
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    # Parse JSON results
    json_file = f"{output_dir}/{username}.json"
    try:
        with open(json_file, 'r') as f:
            return json.load(f)
    except:
        return {"raw_output": result.stdout}

# Example
data = maigret_search("targetuser")
print(f"Found {len(data)} accounts")
```

---

### 3. Blackbird

**Overview:**
- Username and email search across 600+ platforms
- AI-powered profiling
- WhatsMyName project integration
- PDF/CSV exports

**Installation:**
```bash
git clone https://github.com/p1ngul1n0/blackbird
cd blackbird
pip install -r requirements.txt
```

**Usage:**
```bash
python blackbird.py -u username123
python blackbird.py --username username123 --csv
```

---

### 4. Holehe (Email Checker)

**Overview:**
- Email account discovery across platforms
- Checks forgotten password endpoints
- Fast and accurate

**Installation:**
```bash
pip install holehe
```

**Usage:**
```bash
holehe target@example.com
holehe target@example.com --only-used
```

**Python Integration:**
```python
import subprocess
import re

def check_email_accounts(email):
    """
    Check which platforms an email is registered on
    """
    result = subprocess.run(
        ["holehe", email],
        capture_output=True,
        text=True
    )

    # Parse output for registered accounts
    accounts = []
    lines = result.stdout.split('\n')

    for line in lines:
        if '[+]' in line:  # Found account
            # Extract platform name
            platform = re.search(r'\[\+\]\s+(\w+)', line)
            if platform:
                accounts.append(platform.group(1))

    return accounts

# Example
platforms = check_email_accounts("target@example.com")
print(f"Email found on: {', '.join(platforms)}")
```

---

### 5. NExfil

**Overview:**
- Username search across 350+ websites
- Fast scanning (seconds)
- Python-based OSINT tool

**Installation:**
```bash
git clone https://github.com/thewhiteh4t/nexfil
cd nexfil
pip install -r requirements.txt
```

**Usage:**
```bash
python nexfil.py -u username123
```

---

### 6. SpiderFoot

**Overview:**
- Automated OSINT reconnaissance
- Multi-module framework
- Web interface + CLI
- 200+ modules

**Installation:**
```bash
git clone https://github.com/smicallef/spiderfoot
cd spiderfoot
pip3 install -r requirements.txt
```

**Usage:**
```bash
# Web interface
python3 ./sf.py -l 127.0.0.1:5001

# CLI mode
python3 ./sf.py -s target.com -m sfp_dnsresolve,sfp_pageinfo
```

**Python Integration:**
```python
from spiderfoot import SpiderFoot
from sflib import SpiderFootDb

# Initialize
sf = SpiderFoot({})
db = SpiderFootDb({})

# Create scan
scan_id = db.scanInstanceCreate("Target Scan", "target.com")

# Run modules
modules = ['sfp_dnsresolve', 'sfp_emailformat']
sf.startScan("target.com", scan_id, modules)
```

---

### 7. Recon-ng

**Overview:**
- Metasploit-inspired OSINT framework
- Modular Python framework
- Database-backed results

**Installation:**
```bash
git clone https://github.com/lanmaster53/recon-ng
cd recon-ng
pip install -r REQUIREMENTS
```

**Usage:**
```bash
./recon-ng

# In recon-ng console:
marketplace install all
workspaces create target_workspace
db insert domains target.com
modules load recon/domains-hosts/google_site_web
run
```

**Python Integration:**
```python
import subprocess

def recon_ng_scan(domain, modules):
    """
    Run Recon-ng modules against a domain
    """
    commands = f"""
    workspaces create {domain}_scan
    db insert domains {domain}
    modules load {modules}
    run
    show hosts
    """

    # Write commands to file
    with open('/tmp/recon_commands.rc', 'w') as f:
        f.write(commands)

    # Execute
    result = subprocess.run(
        ['./recon-ng', '-r', '/tmp/recon_commands.rc'],
        capture_output=True,
        text=True,
        cwd='/path/to/recon-ng'
    )

    return result.stdout

# Example
output = recon_ng_scan("example.com", "recon/domains-hosts/google_site_web")
```

---

### 8. TheHarvester

**Overview:**
- Email, subdomain, and employee discovery
- Multiple data sources
- Active reconnaissance

**Installation:**
```bash
git clone https://github.com/laramies/theHarvester
cd theHarvester
pip3 install -r requirements.txt
```

**Usage:**
```bash
# Email harvesting
theHarvester -d example.com -b all

# Specific sources
theHarvester -d example.com -b google,linkedin,hunter

# Save to file
theHarvester -d example.com -b all -f output
```

**Python Integration:**
```python
import subprocess
import json

def harvest_emails(domain, sources="all", limit=500):
    """
    Harvest emails and subdomains for a domain
    """
    cmd = [
        "theHarvester",
        "-d", domain,
        "-b", sources,
        "-l", str(limit),
        "-f", f"/tmp/{domain}_harvest",
        "-j"  # JSON output
    ]

    subprocess.run(cmd)

    # Read JSON results
    with open(f"/tmp/{domain}_harvest.json", 'r') as f:
        return json.load(f)

# Example
results = harvest_emails("example.com", sources="google,linkedin")
print(f"Emails found: {results.get('emails', [])}")
print(f"Hosts found: {results.get('hosts', [])}")
```

---

## Python Integration Examples

### Complete OSINT Email Investigation Script

```python
import requests
import subprocess
import json
import hashlib
from typing import Dict, List

class OSINTEmailInvestigator:
    """
    Comprehensive email OSINT investigation tool
    Combines multiple APIs and tools
    """

    def __init__(self, hunter_api_key=None, pdl_api_key=None, fullcontact_api_key=None):
        self.hunter_key = hunter_api_key
        self.pdl_key = pdl_api_key
        self.fc_key = fullcontact_api_key
        self.results = {}

    def verify_email(self, email: str) -> Dict:
        """Verify email using Hunter.io"""
        if not self.hunter_key:
            return {"error": "Hunter API key not configured"}

        url = "https://api.hunter.io/v2/email-verifier"
        params = {"email": email, "api_key": self.hunter_key}

        response = requests.get(url, params=params)
        if response.status_code == 200:
            data = response.json()['data']
            return {
                "status": data['status'],
                "score": data['score'],
                "result": data['result'],
                "smtp_check": data.get('smtp_check'),
                "mx_records": data.get('mx_records')
            }
        return {"error": response.status_code}

    def enrich_email_pdl(self, email: str) -> Dict:
        """Enrich email using People Data Labs"""
        if not self.pdl_key:
            return {"error": "PDL API key not configured"}

        url = "https://api.peopledatalabs.com/v5/person/enrich"
        headers = {"X-API-Key": self.pdl_key}
        params = {"email": email}

        response = requests.get(url, headers=headers, params=params)
        if response.status_code == 200:
            data = response.json()
            return {
                "full_name": data.get('full_name'),
                "location": data.get('location_name'),
                "job_title": data.get('job_title'),
                "company": data.get('job_company_name'),
                "linkedin": data.get('linkedin_url'),
                "twitter": data.get('twitter_url'),
                "facebook": data.get('facebook_url'),
                "github": data.get('github_url')
            }
        return {"error": response.status_code}

    def enrich_email_fullcontact(self, email: str) -> Dict:
        """Enrich email using FullContact"""
        if not self.fc_key:
            return {"error": "FullContact API key not configured"}

        url = "https://api.fullcontact.com/v3/person.enrich"
        headers = {"Authorization": f"Bearer {self.fc_key}"}
        data = {"email": email}

        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            return response.json()
        return {"error": response.status_code}

    def check_gravatar(self, email: str) -> Dict:
        """Check Gravatar profile"""
        email_hash = hashlib.md5(email.lower().encode()).hexdigest()
        url = f"https://www.gravatar.com/{email_hash}.json"

        response = requests.get(url)
        if response.status_code == 200:
            return response.json()['entry'][0]
        return None

    def check_platforms_holehe(self, email: str) -> List[str]:
        """Check registered platforms using Holehe"""
        try:
            result = subprocess.run(
                ["holehe", email],
                capture_output=True,
                text=True,
                timeout=60
            )

            platforms = []
            for line in result.stdout.split('\n'):
                if '[+]' in line:
                    # Extract platform name
                    parts = line.split()
                    if len(parts) > 1:
                        platforms.append(parts[1])

            return platforms
        except Exception as e:
            return [f"Error: {str(e)}"]

    def investigate(self, email: str) -> Dict:
        """
        Complete investigation of an email address
        """
        print(f"[*] Starting investigation for: {email}")

        self.results['email'] = email

        # Email verification
        print("[*] Verifying email...")
        self.results['verification'] = self.verify_email(email)

        # Enrichment
        print("[*] Enriching data (PDL)...")
        self.results['pdl_enrichment'] = self.enrich_email_pdl(email)

        print("[*] Enriching data (FullContact)...")
        self.results['fc_enrichment'] = self.enrich_email_fullcontact(email)

        # Gravatar
        print("[*] Checking Gravatar...")
        self.results['gravatar'] = self.check_gravatar(email)

        # Platform checks
        print("[*] Checking registered platforms...")
        self.results['platforms'] = self.check_platforms_holehe(email)

        return self.results

    def generate_report(self) -> str:
        """Generate a readable report"""
        report = []
        report.append("=" * 60)
        report.append(f"OSINT Email Investigation Report")
        report.append(f"Target: {self.results.get('email')}")
        report.append("=" * 60)

        # Verification
        verification = self.results.get('verification', {})
        report.append("\n[VERIFICATION]")
        report.append(f"  Status: {verification.get('status')}")
        report.append(f"  Score: {verification.get('score')}")
        report.append(f"  Valid: {verification.get('result')}")

        # Enrichment
        pdl = self.results.get('pdl_enrichment', {})
        if pdl and 'error' not in pdl:
            report.append("\n[PERSON DATA]")
            report.append(f"  Name: {pdl.get('full_name')}")
            report.append(f"  Location: {pdl.get('location')}")
            report.append(f"  Job: {pdl.get('job_title')} at {pdl.get('company')}")
            report.append(f"  LinkedIn: {pdl.get('linkedin')}")
            report.append(f"  Twitter: {pdl.get('twitter')}")
            report.append(f"  GitHub: {pdl.get('github')}")

        # Platforms
        platforms = self.results.get('platforms', [])
        if platforms:
            report.append("\n[REGISTERED PLATFORMS]")
            for platform in platforms:
                report.append(f"  - {platform}")

        report.append("\n" + "=" * 60)

        return "\n".join(report)


# Example Usage
if __name__ == "__main__":
    # Initialize with API keys
    investigator = OSINTEmailInvestigator(
        hunter_api_key="your_hunter_key",
        pdl_api_key="your_pdl_key",
        fullcontact_api_key="your_fc_key"
    )

    # Run investigation
    results = investigator.investigate("target@example.com")

    # Print report
    print(investigator.generate_report())

    # Save to JSON
    with open('osint_results.json', 'w') as f:
        json.dump(results, f, indent=2)
```

---

### Username Search Automation

```python
import subprocess
import json
import os
from typing import Dict, List

class UsernameSearchTool:
    """
    Automated username search across multiple tools
    """

    def __init__(self, output_dir="./osint_results"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

    def sherlock_search(self, username: str) -> Dict:
        """Search using Sherlock"""
        output_file = f"{self.output_dir}/{username}_sherlock.json"

        cmd = [
            "sherlock",
            username,
            "--json",
            output_file,
            "--print-found"
        ]

        subprocess.run(cmd, capture_output=True)

        try:
            with open(output_file, 'r') as f:
                return json.load(f)
        except:
            return {}

    def maigret_search(self, username: str) -> Dict:
        """Search using Maigret"""
        cmd = [
            "maigret",
            username,
            "--folderoutput", self.output_dir,
            "--json", "simple"
        ]

        subprocess.run(cmd, capture_output=True)

        json_file = f"{self.output_dir}/{username}.json"
        try:
            with open(json_file, 'r') as f:
                return json.load(f)
        except:
            return {}

    def blackbird_search(self, username: str) -> List[str]:
        """Search using Blackbird"""
        cmd = ["python", "blackbird.py", "-u", username]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd="/path/to/blackbird"
        )

        # Parse output
        found_accounts = []
        for line in result.stdout.split('\n'):
            if '[+]' in line or 'Found' in line:
                found_accounts.append(line.strip())

        return found_accounts

    def comprehensive_search(self, username: str) -> Dict:
        """
        Run all username search tools
        """
        results = {
            "username": username,
            "sherlock": {},
            "maigret": {},
            "blackbird": []
        }

        print(f"[*] Searching for username: {username}")

        # Sherlock
        print("[*] Running Sherlock...")
        results['sherlock'] = self.sherlock_search(username)

        # Maigret
        print("[*] Running Maigret...")
        results['maigret'] = self.maigret_search(username)

        # Blackbird
        print("[*] Running Blackbird...")
        results['blackbird'] = self.blackbird_search(username)

        return results

    def generate_summary(self, results: Dict) -> str:
        """Generate summary of found accounts"""
        summary = []
        summary.append(f"\n{'='*60}")
        summary.append(f"Username Search Summary: {results['username']}")
        summary.append(f"{'='*60}\n")

        # Sherlock results
        sherlock_found = [k for k, v in results['sherlock'].items()
                         if isinstance(v, dict) and v.get('status') == 'found']
        summary.append(f"[SHERLOCK] Found on {len(sherlock_found)} platforms")
        for platform in sherlock_found[:10]:  # Top 10
            summary.append(f"  - {platform}: {results['sherlock'][platform].get('url')}")

        # Maigret results
        maigret_found = len(results['maigret'])
        summary.append(f"\n[MAIGRET] Found on {maigret_found} platforms")

        # Blackbird results
        summary.append(f"\n[BLACKBIRD] {len(results['blackbird'])} results")
        for result in results['blackbird'][:10]:  # Top 10
            summary.append(f"  - {result}")

        summary.append(f"\n{'='*60}\n")

        return "\n".join(summary)


# Example Usage
if __name__ == "__main__":
    searcher = UsernameSearchTool(output_dir="./username_results")

    # Search for username
    results = searcher.comprehensive_search("johndoe123")

    # Print summary
    print(searcher.generate_summary(results))

    # Save full results
    with open('username_search_results.json', 'w') as f:
        json.dump(results, f, indent=2)
```

---

### Social Media Profile Aggregation

```python
import requests
from typing import Dict, List
import time

class SocialMediaAggregator:
    """
    Aggregate social media profiles from multiple sources
    """

    def __init__(self):
        self.profiles = {}

    def search_linkedin_username(self, username: str) -> str:
        """Generate LinkedIn URL from username"""
        return f"https://linkedin.com/in/{username}"

    def search_twitter_username(self, username: str) -> Dict:
        """Check Twitter/X profile existence"""
        url = f"https://twitter.com/{username}"
        try:
            response = requests.get(url, timeout=10, allow_redirects=True)
            if response.status_code == 200:
                return {"exists": True, "url": url}
        except:
            pass
        return {"exists": False}

    def search_github_username(self, username: str) -> Dict:
        """Search GitHub API"""
        url = f"https://api.github.com/users/{username}"

        try:
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                return {
                    "exists": True,
                    "name": data.get('name'),
                    "bio": data.get('bio'),
                    "location": data.get('location'),
                    "company": data.get('company'),
                    "blog": data.get('blog'),
                    "email": data.get('email'),
                    "public_repos": data.get('public_repos'),
                    "followers": data.get('followers'),
                    "url": data.get('html_url')
                }
        except:
            pass

        return {"exists": False}

    def search_instagram_username(self, username: str) -> str:
        """Generate Instagram URL"""
        return f"https://instagram.com/{username}"

    def search_reddit_username(self, username: str) -> Dict:
        """Search Reddit API"""
        url = f"https://www.reddit.com/user/{username}/about.json"
        headers = {'User-Agent': 'Mozilla/5.0'}

        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()['data']
                return {
                    "exists": True,
                    "name": data.get('name'),
                    "created": data.get('created_utc'),
                    "link_karma": data.get('link_karma'),
                    "comment_karma": data.get('comment_karma'),
                    "is_verified": data.get('verified'),
                    "url": f"https://reddit.com/user/{username}"
                }
        except:
            pass

        return {"exists": False}

    def aggregate_profiles(self, username: str, email: str = None) -> Dict:
        """
        Aggregate social media profiles for a username
        """
        results = {
            "username": username,
            "email": email,
            "profiles": {}
        }

        print(f"[*] Aggregating profiles for: {username}")

        # LinkedIn
        print("[*] Checking LinkedIn...")
        results['profiles']['linkedin'] = {
            "url": self.search_linkedin_username(username),
            "note": "Manually verify existence"
        }

        # Twitter/X
        print("[*] Checking Twitter/X...")
        results['profiles']['twitter'] = self.search_twitter_username(username)
        time.sleep(1)  # Rate limiting

        # GitHub
        print("[*] Checking GitHub...")
        results['profiles']['github'] = self.search_github_username(username)
        time.sleep(1)

        # Instagram
        print("[*] Checking Instagram...")
        results['profiles']['instagram'] = {
            "url": self.search_instagram_username(username),
            "note": "Manually verify existence"
        }

        # Reddit
        print("[*] Checking Reddit...")
        results['profiles']['reddit'] = self.search_reddit_username(username)
        time.sleep(1)

        return results

    def generate_report(self, results: Dict) -> str:
        """Generate social media profile report"""
        report = []
        report.append("=" * 60)
        report.append(f"Social Media Profile Aggregation Report")
        report.append(f"Username: {results['username']}")
        if results.get('email'):
            report.append(f"Email: {results['email']}")
        report.append("=" * 60)

        for platform, data in results['profiles'].items():
            report.append(f"\n[{platform.upper()}]")

            if isinstance(data, dict):
                for key, value in data.items():
                    if value:
                        report.append(f"  {key}: {value}")
            else:
                report.append(f"  {data}")

        report.append("\n" + "=" * 60)

        return "\n".join(report)


# Example Usage
if __name__ == "__main__":
    aggregator = SocialMediaAggregator()

    # Aggregate profiles
    results = aggregator.aggregate_profiles("johndoe", email="john@example.com")

    # Print report
    print(aggregator.generate_report(results))

    # Save to JSON
    import json
    with open('social_profiles.json', 'w') as f:
        json.dump(results, f, indent=2)
```

---

## Summary Comparison Table

| Service | Type | API Access | Pricing | Best For |
|---------|------|-----------|---------|----------|
| **Pipl** | Commercial | Yes (Enterprise) | Custom ($$$) | Banking, fraud detection |
| **Spokeo** | Commercial | Yes | Custom | People search, contact data |
| **BeenVerified** | Commercial | No | Consumer | Manual searches only |
| **Whitepages** | Commercial | Limited | Free + Paid | Phone lookup, basic info |
| **TrueCaller** | Commercial | Limited | Free + Paid | Phone identification |
| **People Data Labs** | Commercial | Yes | $98-$2,500+/mo | Data enrichment, B2B |
| **FullContact** | Commercial | Yes | $99-$10k+/mo | Identity resolution |
| **Clearbit** | Commercial | Yes | $45-$9k+/mo | B2B enrichment |
| **Hunter.io** | Commercial | Yes | Freemium | Email verification |
| **RocketReach** | Commercial | Yes | Custom | Contact discovery |
| **OSINT Industries** | Data Broker | Yes | Unknown | Real-time OSINT |
| **ShadowDragon** | Data Broker | Yes | Enterprise | Professional investigations |
| **Sherlock** | Open Source | CLI | Free | Username search (581 sites) |
| **Maigret** | Open Source | CLI | Free | Username search (3000+ sites) |
| **Holehe** | Open Source | CLI | Free | Email platform checker |
| **Blackbird** | Open Source | CLI | Free | Username/email search |
| **SpiderFoot** | Open Source | API + Web | Free | Automated OSINT |
| **Recon-ng** | Open Source | Framework | Free | Modular reconnaissance |
| **TheHarvester** | Open Source | CLI | Free | Email/subdomain discovery |

---

## Best Practices for OSINT

1. **Legal Compliance**
   - Only use data for legitimate purposes
   - Respect privacy laws (GDPR, CCPA, etc.)
   - Obtain proper authorization for investigations
   - Document your data sources

2. **API Rate Limiting**
   - Implement delays between requests
   - Use exponential backoff on errors
   - Monitor API quota usage
   - Cache results when possible

3. **Data Validation**
   - Cross-reference multiple sources
   - Verify accuracy of findings
   - Check for false positives
   - Document confidence levels

4. **Operational Security**
   - Use VPNs or proxies when necessary
   - Don't expose API keys in code
   - Implement proper access controls
   - Rotate credentials regularly

5. **Tool Combinations**
   - Use email verification before enrichment
   - Combine username + email searches
   - Cross-reference social profiles
   - Aggregate data from multiple sources

---

## Resources

### Documentation
- [Pipl API Docs](https://docs.pipl.com/)
- [Spokeo API Docs](https://docs.spokeo.com/)
- [Hunter.io API Docs](https://hunter.io/api)
- [People Data Labs API Docs](https://docs.peopledatalabs.com/)
- [FullContact API Docs](https://dashboard.fullcontact.com/api-ref)

### GitHub Repositories
- [Sherlock](https://github.com/sherlock-project/sherlock)
- [Maigret](https://github.com/soxoj/maigret)
- [Holehe](https://github.com/megadose/holehe)
- [Blackbird](https://github.com/p1ngul1n0/blackbird)
- [SpiderFoot](https://github.com/smicallef/spiderfoot)
- [Recon-ng](https://github.com/lanmaster53/recon-ng)
- [TheHarvester](https://github.com/laramies/theHarvester)
- [Awesome OSINT](https://github.com/jivoi/awesome-osint)
- [OSINT Tools Collection](https://github.com/cipher387/osint_stuff_tool_collection)

### Learning Resources
- [OSINT Framework](https://osintframework.com/)
- [Bellingcat's Online Investigation Toolkit](https://bellingcat.gitbook.io/toolkit/)
- [Intel 471 Python Libraries for OSINT](https://www.intel471.com/blog/python-libraries-for-osint-automation)

---

## Conclusion

This research covers the major people search and data aggregation platforms available in 2024-2025, including:

- **Commercial APIs**: Pipl, Spokeo, People Data Labs, FullContact, Hunter.io
- **Social Aggregators**: Clearbit, Gravatar, Influencers Club
- **Open Source Tools**: Sherlock, Maigret, Holehe, Blackbird, SpiderFoot, Recon-ng, TheHarvester

The Python integration examples provide ready-to-use code for:
- Email verification and enrichment
- Username searches across social networks
- Social media profile aggregation
- Automated OSINT investigations

For MyFootprint integration, the open-source tools (Sherlock, Maigret, Holehe) offer the best starting point due to zero cost and strong community support. Commercial APIs like Hunter.io and People Data Labs can be added later for enhanced data enrichment capabilities.

---

**Last Updated:** December 27, 2025
**Research By:** Claude (Anthropic)
**Project:** MyFootprint OSINT Toolkit
