import { NextRequest, NextResponse } from 'next/server';

interface SearchRequest {
  query: string;
  type: 'email' | 'phone' | 'username' | 'name';
  state?: string;
  deepScan?: boolean;
}

interface SearchResult {
  source: string;
  found: boolean;
  data: Record<string, unknown>;
  url?: string;
  timestamp: string;
}

interface PersonProfile {
  query: string;
  query_type: string;
  results: SearchResult[];
  risk_score: number;
  summary: Record<string, unknown>;
}

// ============ Email Search ============
async function searchEmail(email: string, deepScan: boolean): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const timestamp = new Date().toISOString();

  // LeakCheck API
  const leakcheckKey = process.env.LEAKCHECK_API_KEY;
  if (leakcheckKey) {
    try {
      const response = await fetch(
        `https://leakcheck.io/api/v2/query/${encodeURIComponent(email)}`,
        { headers: { 'X-API-Key': leakcheckKey } }
      );
      const data = await response.json();
      results.push({
        source: 'LeakCheck',
        found: data.found === true || (data.result && data.result.length > 0),
        data: data,
        url: 'https://leakcheck.io',
        timestamp
      });
    } catch (e) {
      results.push({ source: 'LeakCheck', found: false, data: { error: String(e) }, timestamp });
    }
  }

  // Extract username from email for social checks
  const username = email.split('@')[0];

  // GitHub check
  try {
    const ghResponse = await fetch(`https://api.github.com/users/${username}`, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });
    if (ghResponse.ok) {
      const ghData = await ghResponse.json();
      results.push({
        source: 'GitHub',
        found: true,
        data: {
          login: ghData.login,
          name: ghData.name,
          bio: ghData.bio,
          company: ghData.company,
          location: ghData.location,
          public_repos: ghData.public_repos,
          followers: ghData.followers,
          created_at: ghData.created_at
        },
        url: ghData.html_url,
        timestamp
      });
    }
  } catch { /* ignore */ }

  // Gravatar check
  try {
    const crypto = await import('crypto');
    const hash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
    const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?d=404`;
    const gResponse = await fetch(gravatarUrl, { method: 'HEAD' });
    if (gResponse.ok) {
      results.push({
        source: 'Gravatar',
        found: true,
        data: { avatar_url: `https://www.gravatar.com/avatar/${hash}` },
        url: `https://gravatar.com/${hash}`,
        timestamp
      });
    }
  } catch { /* ignore */ }

  return results;
}

// ============ Username Search ============
async function searchUsername(username: string, deepScan: boolean): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const timestamp = new Date().toISOString();

  // GitHub API
  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });
    if (response.ok) {
      const data = await response.json();
      results.push({
        source: 'GitHub',
        found: true,
        data: {
          login: data.login,
          name: data.name,
          bio: data.bio,
          company: data.company,
          location: data.location,
          blog: data.blog,
          public_repos: data.public_repos,
          followers: data.followers,
          following: data.following,
          created_at: data.created_at
        },
        url: data.html_url,
        timestamp
      });
    } else {
      results.push({ source: 'GitHub', found: false, data: {}, timestamp });
    }
  } catch (e) {
    results.push({ source: 'GitHub', found: false, data: { error: String(e) }, timestamp });
  }

  // Social media profile checks (HEAD requests to check existence)
  const socialPlatforms = [
    { name: 'Twitter/X', url: `https://twitter.com/${username}` },
    { name: 'Instagram', url: `https://www.instagram.com/${username}/` },
    { name: 'TikTok', url: `https://www.tiktok.com/@${username}` },
    { name: 'Reddit', url: `https://www.reddit.com/user/${username}` },
    { name: 'Pinterest', url: `https://www.pinterest.com/${username}/` },
    { name: 'LinkedIn', url: `https://www.linkedin.com/in/${username}` },
    { name: 'YouTube', url: `https://www.youtube.com/@${username}` },
    { name: 'Twitch', url: `https://www.twitch.tv/${username}` },
    { name: 'Medium', url: `https://medium.com/@${username}` },
    { name: 'DevTo', url: `https://dev.to/${username}` },
  ];

  // Check platforms in parallel
  const platformChecks = socialPlatforms.map(async (platform) => {
    try {
      const response = await fetch(platform.url, {
        method: 'HEAD',
        redirect: 'follow'
      });
      // Most platforms return 200 for existing users, 404 for non-existing
      const found = response.ok && response.status === 200;
      return {
        source: platform.name,
        found,
        data: found ? { profile_url: platform.url } : {},
        url: found ? platform.url : undefined,
        timestamp
      };
    } catch {
      return { source: platform.name, found: false, data: {}, timestamp };
    }
  });

  const platformResults = await Promise.all(platformChecks);
  results.push(...platformResults);

  return results;
}

// ============ Phone Search ============
async function searchPhone(phone: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const timestamp = new Date().toISOString();

  // Clean phone number
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Basic phone number analysis
  let countryCode = '';
  let national = cleaned;

  if (cleaned.startsWith('+1') || cleaned.startsWith('1') && cleaned.length === 11) {
    countryCode = 'US/CA';
    national = cleaned.startsWith('+') ? cleaned.slice(2) : cleaned.slice(1);
  } else if (cleaned.startsWith('+44')) {
    countryCode = 'UK';
    national = cleaned.slice(3);
  } else if (cleaned.startsWith('+')) {
    countryCode = 'International';
  }

  results.push({
    source: 'Phone Parser',
    found: true,
    data: {
      original: phone,
      cleaned,
      country_code: countryCode || 'Unknown',
      national_number: national,
      valid_length: national.length >= 10
    },
    timestamp
  });

  // Numverify API (if key exists)
  const numverifyKey = process.env.NUMVERIFY_API_KEY;
  if (numverifyKey) {
    try {
      const response = await fetch(
        `http://apilayer.net/api/validate?access_key=${numverifyKey}&number=${cleaned}`
      );
      const data = await response.json();
      results.push({
        source: 'Numverify',
        found: data.valid === true,
        data: {
          valid: data.valid,
          country_name: data.country_name,
          location: data.location,
          carrier: data.carrier,
          line_type: data.line_type
        },
        timestamp
      });
    } catch { /* ignore */ }
  }

  // Manual lookup links
  results.push({
    source: 'Manual Lookups',
    found: true,
    data: {
      links: [
        { name: 'TrueCaller', url: 'https://www.truecaller.com/' },
        { name: 'WhitePages', url: 'https://www.whitepages.com/phone/' + cleaned },
        { name: 'Spokeo', url: 'https://www.spokeo.com/phone/' + cleaned },
        { name: 'NumLookup', url: 'https://www.numlookup.com/' },
        { name: 'CallerID Test', url: 'https://calleridtest.com/' }
      ]
    },
    timestamp
  });

  return results;
}

// ============ Name Search ============
async function searchName(name: string, state?: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const timestamp = new Date().toISOString();
  const [firstName, ...lastParts] = name.split(' ');
  const lastName = lastParts.join(' ');

  // CourtListener API (free legal records)
  try {
    const query = encodeURIComponent(`${firstName} ${lastName}`);
    const response = await fetch(
      `https://www.courtlistener.com/api/rest/v3/search/?q=${query}&type=p`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (response.ok) {
      const data = await response.json();
      results.push({
        source: 'CourtListener',
        found: data.count > 0,
        data: {
          count: data.count,
          results: data.results?.slice(0, 5) || []
        },
        url: `https://www.courtlistener.com/?q=${query}&type=p`,
        timestamp
      });
    }
  } catch { /* ignore */ }

  // Manual lookup links
  const stateParam = state ? `&state=${state}` : '';
  results.push({
    source: 'Manual Lookups',
    found: true,
    data: {
      links: [
        { name: 'LinkedIn', url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(name)}` },
        { name: 'Pipl', url: `https://pipl.com/search/?q=${encodeURIComponent(name)}${stateParam}` },
        { name: 'WhitePages', url: `https://www.whitepages.com/name/${firstName}-${lastName}` },
        { name: 'TruePeopleSearch', url: `https://www.truepeoplesearch.com/results?name=${encodeURIComponent(name)}` },
        { name: 'FastPeopleSearch', url: `https://www.fastpeoplesearch.com/name/${firstName.toLowerCase()}-${lastName.toLowerCase()}` },
        { name: 'That\'s Them', url: `https://thatsthem.com/name/${firstName}-${lastName}` },
        { name: 'Radaris', url: `https://radaris.com/p/${firstName}/${lastName}/` }
      ]
    },
    timestamp
  });

  return results;
}

// ============ Main Handler ============
export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();
    const { query, type, state, deepScan = false } = body;

    if (!query || !type) {
      return NextResponse.json(
        { error: 'Query and type are required' },
        { status: 400 }
      );
    }

    // Validate query based on type
    if (type === 'email' && !query.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (type === 'name' && !query.includes(' ')) {
      return NextResponse.json(
        { error: 'Please provide first and last name' },
        { status: 400 }
      );
    }

    let results: SearchResult[] = [];

    switch (type) {
      case 'email':
        results = await searchEmail(query, deepScan);
        break;
      case 'username':
        results = await searchUsername(query, deepScan);
        break;
      case 'phone':
        results = await searchPhone(query);
        break;
      case 'name':
        results = await searchName(query, state);
        break;
    }

    // Calculate risk score
    const foundCount = results.filter(r => r.found).length;
    const riskScore = Math.min(100, foundCount * 15);

    const profile: PersonProfile = {
      query,
      query_type: type,
      results,
      risk_score: riskScore,
      summary: {
        total_sources: results.length,
        matches_found: foundCount,
        sources_with_data: results.filter(r => r.found).map(r => r.source)
      }
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    );
  }
}
