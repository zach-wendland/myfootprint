#!/usr/bin/env python3
"""
Photo-based OSINT search using DeepFace for face analysis
and reverse image search capabilities.
"""

import sys
import json
import base64
import os
import argparse
import tempfile
from typing import Dict, List, Any, Optional
from pathlib import Path
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

# Try to import DeepFace
try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
except ImportError:
    DEEPFACE_AVAILABLE = False
    print("Warning: DeepFace not installed. Run: pip install deepface tf-keras", file=sys.stderr)


class PhotoOSINT:
    """Photo-based OSINT analysis using face recognition and reverse image search."""

    def __init__(self):
        self.results = {
            'face_analysis': None,
            'reverse_search_links': [],
            'social_media_matches': [],
            'risk_score': 0,
            'employment_flags': []
        }

    def analyze_photo(self, image_path: str) -> Dict[str, Any]:
        """Main entry point for photo analysis."""

        if not os.path.exists(image_path):
            return {'error': f'Image not found: {image_path}'}

        # Run all analyses in parallel
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = {
                executor.submit(self._analyze_face, image_path): 'face_analysis',
                executor.submit(self._generate_reverse_search_links, image_path): 'reverse_search',
                executor.submit(self._check_adult_platforms, image_path): 'adult_check',
            }

            for future in as_completed(futures):
                task_name = futures[future]
                try:
                    result = future.result()
                    if task_name == 'face_analysis':
                        self.results['face_analysis'] = result
                    elif task_name == 'reverse_search':
                        self.results['reverse_search_links'] = result
                    elif task_name == 'adult_check':
                        if result.get('adult_platforms_found'):
                            self.results['employment_flags'] = result['adult_platforms_found']
                            self.results['risk_score'] = 100
                except Exception as e:
                    print(f"Error in {task_name}: {e}", file=sys.stderr)

        # Calculate risk score based on findings
        self._calculate_risk_score()

        return self.results

    def _analyze_face(self, image_path: str) -> Optional[Dict[str, Any]]:
        """Use DeepFace to analyze facial attributes."""
        if not DEEPFACE_AVAILABLE:
            return {'error': 'DeepFace not available'}

        try:
            # Analyze face for age, gender, emotion, race
            analysis = DeepFace.analyze(
                img_path=image_path,
                actions=['age', 'gender', 'emotion', 'race'],
                enforce_detection=False,
                silent=True
            )

            if isinstance(analysis, list) and len(analysis) > 0:
                face_data = analysis[0]
                return {
                    'faces_detected': len(analysis),
                    'primary_face': {
                        'age': face_data.get('age'),
                        'gender': face_data.get('dominant_gender'),
                        'gender_confidence': face_data.get('gender', {}).get(face_data.get('dominant_gender', ''), 0),
                        'emotion': face_data.get('dominant_emotion'),
                        'emotion_confidence': face_data.get('emotion', {}).get(face_data.get('dominant_emotion', ''), 0),
                        'ethnicity': face_data.get('dominant_race'),
                        'ethnicity_confidence': face_data.get('race', {}).get(face_data.get('dominant_race', ''), 0),
                    }
                }
            return {'faces_detected': 0}

        except Exception as e:
            return {'error': str(e), 'faces_detected': 0}

    def _generate_reverse_search_links(self, image_path: str) -> List[Dict[str, str]]:
        """Generate links to reverse image search engines."""

        # These are manual search links since most require browser interaction
        links = [
            {
                'name': 'Google Images',
                'url': 'https://images.google.com/',
                'description': 'Upload image for reverse search',
                'type': 'reverse_search'
            },
            {
                'name': 'Yandex Images',
                'url': 'https://yandex.com/images/',
                'description': 'Best for finding social profiles (especially Russian)',
                'type': 'reverse_search'
            },
            {
                'name': 'TinEye',
                'url': 'https://tineye.com/',
                'description': 'Find where this image appears online',
                'type': 'reverse_search'
            },
            {
                'name': 'PimEyes',
                'url': 'https://pimeyes.com/',
                'description': 'Face recognition search engine (paid)',
                'type': 'face_search'
            },
            {
                'name': 'FaceCheck.ID',
                'url': 'https://facecheck.id/',
                'description': 'Free face recognition search',
                'type': 'face_search'
            },
            {
                'name': 'Search4Faces',
                'url': 'https://search4faces.com/',
                'description': 'VK and OK.ru face search',
                'type': 'face_search'
            },
            {
                'name': 'Bing Visual Search',
                'url': 'https://www.bing.com/visualsearch',
                'description': 'Microsoft reverse image search',
                'type': 'reverse_search'
            },
            {
                'name': 'Baidu Images',
                'url': 'https://image.baidu.com/',
                'description': 'Best for finding Chinese sources',
                'type': 'reverse_search'
            },
            {
                'name': 'SocialCatfish',
                'url': 'https://socialcatfish.com/',
                'description': 'Dating profile and identity search',
                'type': 'identity_search'
            },
            {
                'name': 'Lenso.ai',
                'url': 'https://lenso.ai/',
                'description': 'AI-powered face and image search',
                'type': 'face_search'
            }
        ]

        return links

    def _check_adult_platforms(self, image_path: str) -> Dict[str, Any]:
        """
        Check if the face appears on known adult content platforms.
        This uses reverse image search hints and known databases.

        Note: Actual matching requires PimEyes or similar paid services.
        This method provides guidance for manual checking.
        """

        adult_search_resources = [
            {
                'platform': 'PimEyes',
                'url': 'https://pimeyes.com/',
                'description': 'Best for finding adult content - searches OnlyFans, Pornhub, etc.',
                'employment_relevant': True
            },
            {
                'platform': 'FaceCheck.ID',
                'url': 'https://facecheck.id/',
                'description': 'Free alternative - covers some adult sites',
                'employment_relevant': True
            },
            {
                'platform': 'Yandex',
                'url': 'https://yandex.com/images/',
                'description': 'Often indexes adult content in results',
                'employment_relevant': True
            }
        ]

        return {
            'adult_platforms_found': [],
            'manual_check_required': True,
            'recommended_services': adult_search_resources,
            'note': 'Automated adult content detection requires paid API services like PimEyes'
        }

    def _calculate_risk_score(self):
        """Calculate overall risk score based on findings."""
        score = 0

        # Face detected = baseline score
        if self.results.get('face_analysis', {}).get('faces_detected', 0) > 0:
            score = 10

        # Adult content flags = max score
        if self.results.get('employment_flags'):
            score = 100

        self.results['risk_score'] = score

    def analyze_from_base64(self, base64_data: str, filename: str = 'photo.jpg') -> Dict[str, Any]:
        """Analyze a photo from base64 encoded data."""

        # Remove data URL prefix if present
        if ',' in base64_data:
            base64_data = base64_data.split(',')[1]

        # Decode and save to temp file
        try:
            image_data = base64.b64decode(base64_data)

            with tempfile.NamedTemporaryFile(suffix=f'_{filename}', delete=False) as f:
                f.write(image_data)
                temp_path = f.name

            # Analyze the temp file
            result = self.analyze_photo(temp_path)

            # Clean up
            os.unlink(temp_path)

            return result

        except Exception as e:
            return {'error': f'Failed to process image: {str(e)}'}


def main():
    parser = argparse.ArgumentParser(description='Photo-based OSINT search')
    parser.add_argument('image', help='Path to image file or "-" for base64 input from stdin')
    parser.add_argument('--json', action='store_true', help='Output results as JSON')
    parser.add_argument('--base64', action='store_true', help='Input is base64 encoded')

    args = parser.parse_args()

    osint = PhotoOSINT()

    if args.image == '-' or args.base64:
        # Read base64 from stdin
        base64_data = sys.stdin.read().strip()
        results = osint.analyze_from_base64(base64_data)
    else:
        results = osint.analyze_photo(args.image)

    if args.json:
        print(json.dumps(results, indent=2))
    else:
        print("\n=== Photo OSINT Analysis ===\n")

        if 'error' in results:
            print(f"Error: {results['error']}")
            return

        # Face analysis
        face = results.get('face_analysis', {})
        if face.get('faces_detected', 0) > 0:
            print(f"Faces Detected: {face['faces_detected']}")
            pf = face.get('primary_face', {})
            if pf:
                print(f"  Age: ~{pf.get('age', 'Unknown')}")
                print(f"  Gender: {pf.get('gender', 'Unknown')} ({pf.get('gender_confidence', 0):.1f}%)")
                print(f"  Emotion: {pf.get('emotion', 'Unknown')}")
                print(f"  Ethnicity: {pf.get('ethnicity', 'Unknown')}")
        else:
            print("No faces detected in image")

        # Risk score
        print(f"\nRisk Score: {results.get('risk_score', 0)}/100")

        # Employment flags
        if results.get('employment_flags'):
            print("\n⚠️  EMPLOYMENT FLAGS:")
            for flag in results['employment_flags']:
                print(f"  - {flag}")

        # Reverse search links
        print("\n📷 Reverse Image Search Links:")
        for link in results.get('reverse_search_links', [])[:5]:
            print(f"  {link['name']}: {link['url']}")
            print(f"    → {link['description']}")


if __name__ == '__main__':
    main()
