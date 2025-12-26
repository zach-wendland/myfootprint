#!/usr/bin/env python3
"""
Local Breach Checker - Query LeakCheck API for your own credentials
For personal security use only.
"""

import requests
import argparse
import json
import sys

LEAKCHECK_API_KEY = "1a0bd6a57d0a9d9c3a4b6e74c820d3d521018d45"


def check_leakcheck(email: str) -> dict:
    """Query LeakCheck API for breach data"""
    url = "https://leakcheck.io/api/public"
    params = {
        "key": LEAKCHECK_API_KEY,
        "check": email,
        "type": "email"
    }

    try:
        resp = requests.get(url, params=params, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}


def display_results(email: str, data: dict):
    """Display breach results in readable format"""
    print(f"\n{'='*60}")
    print(f"BREACH CHECK: {email}")
    print(f"{'='*60}")

    if "error" in data:
        print(f"[ERROR] {data['error']}")
        return

    if not data.get("success", False):
        print(f"[INFO] {data.get('message', 'No results or API error')}")
        return

    sources = data.get("sources", [])
    if not sources:
        print("[CLEAN] No breaches found for this email!")
        return

    print(f"\n[FOUND] {len(sources)} breach(es) detected:\n")

    for i, source in enumerate(sources, 1):
        print(f"--- Breach #{i} ---")
        print(f"  Source:   {source.get('name', 'Unknown')}")
        print(f"  Date:     {source.get('date', 'Unknown')}")

        if source.get('password'):
            print(f"  Password: {source.get('password')}")
        if source.get('password_hash'):
            print(f"  Hash:     {source.get('password_hash')}")
        if source.get('username'):
            print(f"  Username: {source.get('username')}")
        print()

    print(f"{'='*60}")
    print("ACTION: Change passwords for any exposed accounts immediately!")
    print(f"{'='*60}\n")


def main():
    parser = argparse.ArgumentParser(
        description="Check your email against known data breaches (LeakCheck API)"
    )
    parser.add_argument(
        "email",
        nargs="?",
        help="Email address to check"
    )
    parser.add_argument(
        "--interactive", "-i",
        action="store_true",
        help="Interactive mode - enter multiple emails"
    )

    args = parser.parse_args()

    if args.interactive or not args.email:
        print("\n=== Breach Checker (LeakCheck API) ===")
        print("Enter email addresses to check. Type 'quit' to exit.\n")

        while True:
            try:
                email = input("Email> ").strip()
                if email.lower() in ('quit', 'exit', 'q'):
                    break
                if not email or '@' not in email:
                    print("[!] Enter a valid email address")
                    continue

                data = check_leakcheck(email)
                display_results(email, data)

            except KeyboardInterrupt:
                print("\nExiting...")
                break
    else:
        data = check_leakcheck(args.email)
        display_results(args.email, data)


if __name__ == "__main__":
    main()
