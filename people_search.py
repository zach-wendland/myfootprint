#!/usr/bin/env python3
"""
MyFootprint People Search Module
Multi-source OSINT lookup for usernames, phone numbers, and names.
"""

import os
import re
import json
import asyncio
import subprocess
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime

import requests
import phonenumbers
from phonenumbers import geocoder, carrier, timezone


# =============================================================================
# Data Classes
# =============================================================================

@dataclass
class SearchResult:
    """Unified search result format"""
    source: str
    found: bool
    data: Dict[str, Any]
    url: Optional[str] = None
    timestamp: str = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now().isoformat()


@dataclass
class PersonProfile:
    """Aggregated person profile from multiple sources"""
    query: str
    query_type: str  # email, username, phone, name
    results: List[SearchResult]
    risk_score: int = 0
    summary: Dict[str, Any] = None

    def to_dict(self):
        return {
            'query': self.query,
            'query_type': self.query_type,
            'results': [asdict(r) for r in self.results],
            'risk_score': self.risk_score,
            'summary': self.summary
        }


# =============================================================================
# Phone Number Lookup
# =============================================================================

class PhoneLookup:
    """Phone number OSINT using free libraries and APIs"""

    def __init__(self, numverify_key: str = None, veriphone_key: str = None):
        self.numverify_key = numverify_key or os.getenv('NUMVERIFY_API_KEY')
        self.veriphone_key = veriphone_key or os.getenv('VERIPHONE_API_KEY')

    def validate_and_parse(self, phone: str, region: str = None) -> SearchResult:
        """Parse and validate phone using Google's libphonenumber (free, offline)"""
        try:
            parsed = phonenumbers.parse(phone, region)
            is_valid = phonenumbers.is_valid_number(parsed)

            # Get all available info
            location = geocoder.description_for_number(parsed, "en")
            carrier_name = carrier.name_for_number(parsed, "en")
            time_zones = list(timezone.time_zones_for_number(parsed))

            # Determine number type
            num_type = phonenumbers.number_type(parsed)
            type_names = {
                0: "FIXED_LINE", 1: "MOBILE", 2: "FIXED_LINE_OR_MOBILE",
                3: "TOLL_FREE", 4: "PREMIUM_RATE", 5: "SHARED_COST",
                6: "VOIP", 7: "PERSONAL_NUMBER", 8: "PAGER",
                9: "UAN", 10: "VOICEMAIL", -1: "UNKNOWN"
            }

            return SearchResult(
                source="phonenumbers",
                found=is_valid,
                data={
                    'valid': is_valid,
                    'possible': phonenumbers.is_possible_number(parsed),
                    'e164': phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164),
                    'international': phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.INTERNATIONAL),
                    'national': phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.NATIONAL),
                    'country_code': parsed.country_code,
                    'national_number': str(parsed.national_number),
                    'location': location,
                    'carrier': carrier_name,
                    'timezones': time_zones,
                    'number_type': type_names.get(num_type, "UNKNOWN")
                }
            )
        except Exception as e:
            return SearchResult(
                source="phonenumbers",
                found=False,
                data={'error': str(e)}
            )

    def numverify_lookup(self, phone: str) -> SearchResult:
        """Lookup using Numverify API (free tier: 100 requests/month)"""
        if not self.numverify_key:
            return SearchResult(source="numverify", found=False, data={'error': 'No API key'})

        try:
            url = "http://apilayer.net/api/validate"
            params = {
                'access_key': self.numverify_key,
                'number': phone,
                'format': 1
            }
            response = requests.get(url, params=params, timeout=10)
            data = response.json()

            if data.get('valid'):
                return SearchResult(
                    source="numverify",
                    found=True,
                    data={
                        'valid': data.get('valid'),
                        'number': data.get('number'),
                        'local_format': data.get('local_format'),
                        'international_format': data.get('international_format'),
                        'country': data.get('country_name'),
                        'country_code': data.get('country_code'),
                        'location': data.get('location'),
                        'carrier': data.get('carrier'),
                        'line_type': data.get('line_type')
                    }
                )
            return SearchResult(source="numverify", found=False, data=data)
        except Exception as e:
            return SearchResult(source="numverify", found=False, data={'error': str(e)})

    def veriphone_lookup(self, phone: str, country: str = None) -> SearchResult:
        """Lookup using Veriphone API (free tier: 1000 requests/month)"""
        if not self.veriphone_key:
            return SearchResult(source="veriphone", found=False, data={'error': 'No API key'})

        try:
            url = "https://api.veriphone.io/v2/verify"
            params = {'key': self.veriphone_key, 'phone': phone}
            if country:
                params['default_country'] = country

            response = requests.get(url, params=params, timeout=10)
            data = response.json()

            if data.get('status') == 'success' and data.get('phone_valid'):
                return SearchResult(
                    source="veriphone",
                    found=True,
                    data={
                        'valid': data.get('phone_valid'),
                        'phone': data.get('phone'),
                        'e164': data.get('e164'),
                        'country': data.get('country'),
                        'carrier': data.get('carrier'),
                        'phone_type': data.get('phone_type')
                    }
                )
            return SearchResult(source="veriphone", found=False, data=data)
        except Exception as e:
            return SearchResult(source="veriphone", found=False, data={'error': str(e)})

    def comprehensive_lookup(self, phone: str, region: str = None) -> PersonProfile:
        """Run all available phone lookups"""
        results = []

        # Always run free offline validation first
        results.append(self.validate_and_parse(phone, region))

        # Run API lookups if keys available
        if self.numverify_key:
            results.append(self.numverify_lookup(phone))
        if self.veriphone_key:
            results.append(self.veriphone_lookup(phone, region))

        # Calculate risk score
        risk_score = self._calculate_phone_risk(results)

        # Build summary
        summary = self._build_phone_summary(results)

        return PersonProfile(
            query=phone,
            query_type='phone',
            results=results,
            risk_score=risk_score,
            summary=summary
        )

    def _calculate_phone_risk(self, results: List[SearchResult]) -> int:
        """Calculate risk score based on phone lookup results"""
        score = 0

        for r in results:
            if not r.found:
                continue

            data = r.data

            # VoIP numbers are higher risk
            if data.get('line_type') == 'voip' or data.get('number_type') == 'VOIP':
                score += 30

            # Prepaid numbers
            if data.get('phone_type') == 'prepaid':
                score += 20

            # Valid number reduces risk
            if data.get('valid'):
                score -= 10

            # Has carrier info (more established)
            if data.get('carrier'):
                score -= 5

        return max(0, min(100, score + 50))  # Normalize to 0-100

    def _build_phone_summary(self, results: List[SearchResult]) -> Dict[str, Any]:
        """Aggregate phone data from multiple sources"""
        summary = {
            'valid': False,
            'formatted': None,
            'country': None,
            'carrier': None,
            'line_type': None,
            'location': None,
            'sources_checked': len(results)
        }

        for r in results:
            if not r.found:
                continue

            data = r.data
            if data.get('valid'):
                summary['valid'] = True
            if data.get('e164') or data.get('international'):
                summary['formatted'] = data.get('e164') or data.get('international')
            if data.get('country') or data.get('country_name'):
                summary['country'] = data.get('country') or data.get('country_name')
            if data.get('carrier'):
                summary['carrier'] = data.get('carrier')
            if data.get('line_type') or data.get('number_type'):
                summary['line_type'] = data.get('line_type') or data.get('number_type')
            if data.get('location'):
                summary['location'] = data.get('location')

        return summary


# =============================================================================
# Username Lookup
# =============================================================================

class UsernameLookup:
    """Username OSINT using Sherlock, Maigret, and other tools"""

    def __init__(self, tools_dir: str = None):
        self.tools_dir = tools_dir or os.path.join(os.path.dirname(__file__), 'osint_tools')
        self.sherlock_path = os.path.join(self.tools_dir, 'sherlock')
        self.maigret_available = self._check_maigret()

    def _check_maigret(self) -> bool:
        """Check if maigret is installed"""
        try:
            result = subprocess.run(['maigret', '--version'], capture_output=True, text=True)
            return result.returncode == 0
        except FileNotFoundError:
            return False

    def _check_sherlock(self) -> bool:
        """Check if sherlock is available"""
        return os.path.exists(os.path.join(self.sherlock_path, 'sherlock.py'))

    def sherlock_search(self, username: str, sites: List[str] = None) -> SearchResult:
        """Search username using Sherlock (400+ sites)"""
        if not self._check_sherlock():
            return SearchResult(
                source="sherlock",
                found=False,
                data={'error': 'Sherlock not installed. Run: git clone https://github.com/sherlock-project/sherlock.git osint_tools/sherlock'}
            )

        try:
            output_file = f"sherlock_{username}.json"
            cmd = ['python', 'sherlock.py', username, '--json', output_file]

            if sites:
                for site in sites:
                    cmd.extend(['--site', site])

            result = subprocess.run(
                cmd,
                cwd=self.sherlock_path,
                capture_output=True,
                text=True,
                timeout=120
            )

            # Parse results
            json_path = os.path.join(self.sherlock_path, output_file)
            if os.path.exists(json_path):
                with open(json_path, 'r') as f:
                    data = json.load(f)
                os.remove(json_path)  # Clean up

                profiles = []
                for site, info in data.get(username, {}).items():
                    if info.get('status') == 'Claimed':
                        profiles.append({
                            'site': site,
                            'url': info.get('url_user'),
                            'status': 'found'
                        })

                return SearchResult(
                    source="sherlock",
                    found=len(profiles) > 0,
                    data={
                        'profiles_found': len(profiles),
                        'profiles': profiles
                    }
                )

            return SearchResult(source="sherlock", found=False, data={'error': 'No results file'})

        except subprocess.TimeoutExpired:
            return SearchResult(source="sherlock", found=False, data={'error': 'Search timed out'})
        except Exception as e:
            return SearchResult(source="sherlock", found=False, data={'error': str(e)})

    def maigret_search(self, username: str) -> SearchResult:
        """Search username using Maigret (3000+ sites)"""
        if not self.maigret_available:
            return SearchResult(
                source="maigret",
                found=False,
                data={'error': 'Maigret not installed. Run: pip install maigret'}
            )

        try:
            output_file = f"maigret_{username}.json"
            cmd = ['maigret', username, '--json', 'simple', '-o', output_file]

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=180
            )

            if os.path.exists(output_file):
                with open(output_file, 'r') as f:
                    data = json.load(f)
                os.remove(output_file)

                profiles = []
                for item in data:
                    if item.get('username') == username:
                        for site_data in item.get('sites', []):
                            profiles.append({
                                'site': site_data.get('name'),
                                'url': site_data.get('url'),
                                'status': 'found'
                            })

                return SearchResult(
                    source="maigret",
                    found=len(profiles) > 0,
                    data={
                        'profiles_found': len(profiles),
                        'profiles': profiles
                    }
                )

            return SearchResult(source="maigret", found=False, data={'raw_output': result.stdout})

        except subprocess.TimeoutExpired:
            return SearchResult(source="maigret", found=False, data={'error': 'Search timed out'})
        except Exception as e:
            return SearchResult(source="maigret", found=False, data={'error': str(e)})

    def quick_social_check(self, username: str) -> SearchResult:
        """Quick check of major social platforms via HTTP"""
        platforms = {
            'twitter': f'https://twitter.com/{username}',
            'instagram': f'https://instagram.com/{username}',
            'github': f'https://github.com/{username}',
            'reddit': f'https://reddit.com/user/{username}',
            'linkedin': f'https://linkedin.com/in/{username}',
            'tiktok': f'https://tiktok.com/@{username}',
            'youtube': f'https://youtube.com/@{username}',
            'facebook': f'https://facebook.com/{username}',
        }

        found_profiles = []
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

        for platform, url in platforms.items():
            try:
                response = requests.get(url, headers=headers, timeout=5, allow_redirects=True)
                # Basic heuristic: 200 status and no "not found" indicators
                if response.status_code == 200:
                    content = response.text.lower()
                    not_found_indicators = ['page not found', 'user not found', 'this account doesn', 'sorry, this page']

                    if not any(indicator in content for indicator in not_found_indicators):
                        found_profiles.append({
                            'platform': platform,
                            'url': url,
                            'status': 'likely_exists'
                        })
            except:
                continue

        return SearchResult(
            source="quick_social",
            found=len(found_profiles) > 0,
            data={
                'profiles_checked': len(platforms),
                'profiles_found': len(found_profiles),
                'profiles': found_profiles
            }
        )

    def github_api_lookup(self, username: str) -> SearchResult:
        """Lookup GitHub user via public API (no auth needed)"""
        try:
            url = f"https://api.github.com/users/{username}"
            response = requests.get(url, timeout=10)

            if response.status_code == 200:
                data = response.json()
                return SearchResult(
                    source="github_api",
                    found=True,
                    url=data.get('html_url'),
                    data={
                        'username': data.get('login'),
                        'name': data.get('name'),
                        'bio': data.get('bio'),
                        'company': data.get('company'),
                        'location': data.get('location'),
                        'email': data.get('email'),
                        'twitter': data.get('twitter_username'),
                        'blog': data.get('blog'),
                        'followers': data.get('followers'),
                        'following': data.get('following'),
                        'public_repos': data.get('public_repos'),
                        'created_at': data.get('created_at'),
                        'avatar_url': data.get('avatar_url')
                    }
                )
            elif response.status_code == 404:
                return SearchResult(source="github_api", found=False, data={'message': 'User not found'})
            else:
                return SearchResult(source="github_api", found=False, data={'error': f'HTTP {response.status_code}'})
        except Exception as e:
            return SearchResult(source="github_api", found=False, data={'error': str(e)})

    def comprehensive_lookup(self, username: str, deep_scan: bool = False) -> PersonProfile:
        """Run all available username lookups"""
        results = []

        # Always run quick social check (fast, no dependencies)
        results.append(self.quick_social_check(username))

        # GitHub API lookup (free, reliable)
        results.append(self.github_api_lookup(username))

        # Deep scan with external tools if requested
        if deep_scan:
            if self._check_sherlock():
                results.append(self.sherlock_search(username))
            if self.maigret_available:
                results.append(self.maigret_search(username))

        # Calculate risk score based on digital footprint
        risk_score = self._calculate_username_risk(results)

        # Build summary
        summary = self._build_username_summary(results)

        return PersonProfile(
            query=username,
            query_type='username',
            results=results,
            risk_score=risk_score,
            summary=summary
        )

    def _calculate_username_risk(self, results: List[SearchResult]) -> int:
        """Calculate risk/exposure score based on digital footprint"""
        total_profiles = 0

        for r in results:
            if r.found and 'profiles_found' in r.data:
                total_profiles += r.data['profiles_found']
            elif r.found and r.source == 'github_api':
                total_profiles += 1

        # More profiles = higher exposure
        if total_profiles >= 10:
            return 80
        elif total_profiles >= 5:
            return 60
        elif total_profiles >= 2:
            return 40
        elif total_profiles >= 1:
            return 20
        return 10

    def _build_username_summary(self, results: List[SearchResult]) -> Dict[str, Any]:
        """Aggregate username search results"""
        all_profiles = []

        for r in results:
            if not r.found:
                continue

            if 'profiles' in r.data:
                all_profiles.extend(r.data['profiles'])

            # Add GitHub data if found
            if r.source == 'github_api':
                all_profiles.append({
                    'platform': 'github',
                    'url': r.url,
                    'name': r.data.get('name'),
                    'email': r.data.get('email'),
                    'location': r.data.get('location')
                })

        # Deduplicate by URL
        seen_urls = set()
        unique_profiles = []
        for p in all_profiles:
            url = p.get('url')
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_profiles.append(p)

        return {
            'total_profiles': len(unique_profiles),
            'platforms': list(set(p.get('platform') or p.get('site', '').lower() for p in unique_profiles)),
            'profiles': unique_profiles[:20],  # Limit for API response size
            'sources_checked': len(results)
        }


# =============================================================================
# Name + State Lookup
# =============================================================================

class NameLookup:
    """Name-based people search (limited to public data sources)"""

    def __init__(self, pdl_api_key: str = None):
        self.pdl_api_key = pdl_api_key or os.getenv('PDL_API_KEY')

    def search_by_name_state(self, first_name: str, last_name: str, state: str) -> SearchResult:
        """
        Search by name and state.
        Note: Most free people search sites don't offer APIs.
        This uses People Data Labs if available, otherwise provides guidance.
        """
        if self.pdl_api_key:
            return self._pdl_search(first_name, last_name, state)

        # Provide guidance for manual lookup
        return SearchResult(
            source="name_lookup",
            found=False,
            data={
                'message': 'No API configured for name search',
                'manual_resources': [
                    {'name': 'TruePeopleSearch', 'url': f'https://www.truepeoplesearch.com/results?name={first_name}%20{last_name}&citystatezip={state}'},
                    {'name': 'FastPeopleSearch', 'url': f'https://www.fastpeoplesearch.com/name/{first_name}-{last_name}_{state}'},
                    {'name': 'Whitepages', 'url': f'https://www.whitepages.com/name/{first_name}-{last_name}/{state}'},
                    {'name': 'ThatsThem', 'url': f'https://thatsthem.com/name/{first_name}-{last_name}/{state}'},
                ],
                'note': 'Free people search sites do not offer public APIs. Use the links above for manual lookup, or configure PDL_API_KEY for automated searches.'
            }
        )

    def _pdl_search(self, first_name: str, last_name: str, state: str) -> SearchResult:
        """Search using People Data Labs API (paid, but powerful)"""
        try:
            url = "https://api.peopledatalabs.com/v5/person/search"
            headers = {
                'X-Api-Key': self.pdl_api_key,
                'Content-Type': 'application/json'
            }

            query = {
                "query": {
                    "bool": {
                        "must": [
                            {"term": {"first_name": first_name.lower()}},
                            {"term": {"last_name": last_name.lower()}},
                            {"term": {"location_region": state.upper()}}
                        ]
                    }
                },
                "size": 10
            }

            response = requests.post(url, headers=headers, json=query, timeout=15)
            data = response.json()

            if response.status_code == 200 and data.get('data'):
                people = []
                for person in data['data']:
                    people.append({
                        'full_name': person.get('full_name'),
                        'first_name': person.get('first_name'),
                        'last_name': person.get('last_name'),
                        'location': person.get('location_name'),
                        'job_title': person.get('job_title'),
                        'company': person.get('job_company_name'),
                        'linkedin': person.get('linkedin_url'),
                        'emails': person.get('emails', [])[:2],  # Limit for privacy
                        'phones': person.get('phone_numbers', [])[:2]
                    })

                return SearchResult(
                    source="people_data_labs",
                    found=True,
                    data={
                        'total_results': data.get('total'),
                        'people': people
                    }
                )

            return SearchResult(
                source="people_data_labs",
                found=False,
                data={'message': 'No results found', 'response': data}
            )

        except Exception as e:
            return SearchResult(
                source="people_data_labs",
                found=False,
                data={'error': str(e)}
            )

    def search_courtlistener(self, name: str) -> SearchResult:
        """Search CourtListener for legal cases (free, 5000 requests/day)"""
        try:
            url = "https://www.courtlistener.com/api/rest/v4/search/"
            params = {
                'q': name,
                'type': 'r'  # RECAP documents
            }

            response = requests.get(url, params=params, timeout=15)

            if response.status_code == 200:
                data = response.json()
                cases = []

                for result in data.get('results', [])[:10]:
                    cases.append({
                        'case_name': result.get('caseName'),
                        'court': result.get('court'),
                        'date_filed': result.get('dateFiled'),
                        'docket_number': result.get('docketNumber'),
                        'url': f"https://www.courtlistener.com{result.get('absolute_url', '')}"
                    })

                return SearchResult(
                    source="courtlistener",
                    found=len(cases) > 0,
                    data={
                        'total_results': data.get('count', 0),
                        'cases': cases
                    }
                )

            return SearchResult(
                source="courtlistener",
                found=False,
                data={'error': f'HTTP {response.status_code}'}
            )

        except Exception as e:
            return SearchResult(
                source="courtlistener",
                found=False,
                data={'error': str(e)}
            )

    def comprehensive_lookup(self, first_name: str, last_name: str, state: str = None) -> PersonProfile:
        """Run all available name lookups"""
        results = []
        full_name = f"{first_name} {last_name}"

        # Name + state search
        if state:
            results.append(self.search_by_name_state(first_name, last_name, state))

        # Legal records search (always available, free)
        results.append(self.search_courtlistener(full_name))

        # Build summary
        summary = self._build_name_summary(results)

        return PersonProfile(
            query=f"{first_name} {last_name}" + (f", {state}" if state else ""),
            query_type='name',
            results=results,
            risk_score=self._calculate_name_risk(results),
            summary=summary
        )

    def _calculate_name_risk(self, results: List[SearchResult]) -> int:
        """Calculate risk based on public records exposure"""
        score = 30  # Base score

        for r in results:
            if not r.found:
                continue

            # Legal cases increase risk
            if r.source == 'courtlistener' and r.data.get('total_results', 0) > 0:
                score += min(30, r.data['total_results'] * 5)

            # PDL results
            if r.source == 'people_data_labs' and r.data.get('people'):
                score += 20

        return min(100, score)

    def _build_name_summary(self, results: List[SearchResult]) -> Dict[str, Any]:
        """Aggregate name search results"""
        summary = {
            'sources_checked': len(results),
            'legal_cases_found': 0,
            'people_profiles': [],
            'manual_search_links': []
        }

        for r in results:
            if r.source == 'courtlistener' and r.found:
                summary['legal_cases_found'] = r.data.get('total_results', 0)
                summary['legal_cases'] = r.data.get('cases', [])[:5]

            elif r.source == 'people_data_labs' and r.found:
                summary['people_profiles'] = r.data.get('people', [])

            elif r.source == 'name_lookup' and r.data.get('manual_resources'):
                summary['manual_search_links'] = r.data['manual_resources']

        return summary


# =============================================================================
# Unified OSINT Search
# =============================================================================

class MyFootprintOSINT:
    """Unified OSINT search combining all lookup types"""

    def __init__(
        self,
        leakcheck_api_key: str = None,
        numverify_api_key: str = None,
        veriphone_api_key: str = None,
        pdl_api_key: str = None
    ):
        self.leakcheck_key = leakcheck_api_key or os.getenv('LEAKCHECK_API_KEY')

        self.phone_lookup = PhoneLookup(
            numverify_key=numverify_api_key,
            veriphone_key=veriphone_api_key
        )
        self.username_lookup = UsernameLookup()
        self.name_lookup = NameLookup(pdl_api_key=pdl_api_key)

    def check_breach(self, email: str) -> SearchResult:
        """Check email against LeakCheck API"""
        if not self.leakcheck_key:
            return SearchResult(
                source="leakcheck",
                found=False,
                data={'error': 'No LeakCheck API key configured'}
            )

        try:
            url = f"https://leakcheck.io/api/v2/query/{email}"
            headers = {'X-API-Key': self.leakcheck_key}

            response = requests.get(url, headers=headers, timeout=15)
            data = response.json()

            if data.get('success') and data.get('found', 0) > 0:
                return SearchResult(
                    source="leakcheck",
                    found=True,
                    data={
                        'breaches_found': data.get('found'),
                        'breaches': data.get('result', [])
                    }
                )

            return SearchResult(
                source="leakcheck",
                found=False,
                data={'message': 'No breaches found'}
            )

        except Exception as e:
            return SearchResult(
                source="leakcheck",
                found=False,
                data={'error': str(e)}
            )

    def search_email(self, email: str, deep_scan: bool = False) -> PersonProfile:
        """Comprehensive email search"""
        results = []

        # Breach check
        results.append(self.check_breach(email))

        # Extract username from email for social search
        username = email.split('@')[0]
        username_results = self.username_lookup.comprehensive_lookup(username, deep_scan=deep_scan)
        results.extend(username_results.results)

        # Calculate combined risk
        breach_result = results[0]
        breach_count = breach_result.data.get('breaches_found', 0) if breach_result.found else 0

        risk_score = min(100,
            (breach_count * 15) +  # Each breach adds 15 points
            username_results.risk_score // 2  # Half the username exposure score
        )

        return PersonProfile(
            query=email,
            query_type='email',
            results=results,
            risk_score=risk_score,
            summary={
                'breaches_found': breach_count,
                'social_profiles': username_results.summary.get('total_profiles', 0),
                'platforms': username_results.summary.get('platforms', []),
                'recommendation': self._get_recommendation(risk_score, breach_count)
            }
        )

    def search_phone(self, phone: str, region: str = None) -> PersonProfile:
        """Comprehensive phone search"""
        return self.phone_lookup.comprehensive_lookup(phone, region)

    def search_username(self, username: str, deep_scan: bool = False) -> PersonProfile:
        """Comprehensive username search"""
        return self.username_lookup.comprehensive_lookup(username, deep_scan)

    def search_name(self, first_name: str, last_name: str, state: str = None) -> PersonProfile:
        """Comprehensive name search"""
        return self.name_lookup.comprehensive_lookup(first_name, last_name, state)

    def _get_recommendation(self, risk_score: int, breach_count: int) -> str:
        """Generate actionable recommendation based on risk"""
        if risk_score >= 80:
            return "CRITICAL: Immediate action required. Change all passwords, enable 2FA on all accounts, and consider identity monitoring."
        elif risk_score >= 60:
            return "HIGH RISK: Change passwords for any breached accounts. Enable 2FA. Review account activity."
        elif risk_score >= 40:
            return "MODERATE RISK: Review exposed accounts. Consider changing passwords and enabling 2FA."
        elif risk_score >= 20:
            return "LOW RISK: Your digital footprint exists. Ensure strong, unique passwords and 2FA where available."
        return "MINIMAL EXPOSURE: Good security hygiene. Continue monitoring periodically."


# =============================================================================
# CLI Interface
# =============================================================================

def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="MyFootprint People Search - Multi-source OSINT lookup"
    )
    parser.add_argument('query', help="Search query (email, phone, username, or name)")
    parser.add_argument(
        '-t', '--type',
        choices=['email', 'phone', 'username', 'name'],
        help="Query type (auto-detected if not specified)"
    )
    parser.add_argument('--state', help="State for name searches (e.g., CA, NY)")
    parser.add_argument('--deep', action='store_true', help="Deep scan (slower, more thorough)")
    parser.add_argument('--json', action='store_true', help="Output as JSON")

    args = parser.parse_args()

    # Initialize OSINT tool
    osint = MyFootprintOSINT()

    # Auto-detect query type if not specified
    query_type = args.type
    if not query_type:
        if '@' in args.query:
            query_type = 'email'
        elif re.match(r'^[\+\d\s\-\(\)]+$', args.query) and len(re.sub(r'\D', '', args.query)) >= 10:
            query_type = 'phone'
        elif ' ' in args.query:
            query_type = 'name'
        else:
            query_type = 'username'

    # Run search
    if query_type == 'email':
        result = osint.search_email(args.query, deep_scan=args.deep)
    elif query_type == 'phone':
        result = osint.search_phone(args.query)
    elif query_type == 'username':
        result = osint.search_username(args.query, deep_scan=args.deep)
    elif query_type == 'name':
        parts = args.query.split(' ', 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ''
        result = osint.search_name(first_name, last_name, args.state)

    # Output
    if args.json:
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print(f"\n{'='*60}")
        print(f"OSINT SEARCH RESULTS: {result.query}")
        print(f"Type: {result.query_type}")
        print(f"Risk Score: {result.risk_score}/100")
        print(f"{'='*60}")

        if result.summary:
            print("\nSUMMARY:")
            for key, value in result.summary.items():
                if key != 'profiles' and key != 'legal_cases':
                    print(f"  {key}: {value}")

        print(f"\nSOURCES CHECKED: {len(result.results)}")
        for r in result.results:
            status = "FOUND" if r.found else "NOT FOUND"
            print(f"  - {r.source}: {status}")

        print(f"\n{'='*60}\n")


if __name__ == "__main__":
    main()
