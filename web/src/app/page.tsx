'use client';

import { useState } from 'react';

type SearchType = 'email' | 'phone' | 'username' | 'name';

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
  error?: string;
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

function RiskBadge({ score }: { score: number }) {
  let color = 'bg-green-600';
  let label = 'LOW';

  if (score >= 80) {
    color = 'bg-red-600';
    label = 'CRITICAL';
  } else if (score >= 60) {
    color = 'bg-orange-600';
    label = 'HIGH';
  } else if (score >= 40) {
    color = 'bg-yellow-600';
    label = 'MODERATE';
  } else if (score >= 20) {
    color = 'bg-blue-600';
    label = 'LOW';
  } else {
    color = 'bg-green-600';
    label = 'MINIMAL';
  }

  return (
    <div className="flex items-center gap-3">
      <span className={`${color} px-3 py-1 rounded-full text-sm font-bold`}>
        {label}
      </span>
      <span className="text-zinc-400 text-sm">{score}/100</span>
    </div>
  );
}

function ResultCard({ result }: { result: SearchResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/50">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full ${result.found ? 'bg-green-500' : 'bg-zinc-600'}`} />
          <span className="font-medium capitalize">{result.source.replace(/_/g, ' ')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm ${result.found ? 'text-green-400' : 'text-zinc-500'}`}>
            {result.found ? 'Found' : 'Not Found'}
          </span>
          <span className="text-zinc-500">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <pre className="text-xs text-zinc-400 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function ProfilesList({ profiles }: { profiles: Array<{ platform?: string; site?: string; url?: string }> }) {
  if (!profiles || profiles.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
      {profiles.slice(0, 12).map((profile, i) => (
        <a
          key={i}
          href={profile.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors text-sm"
        >
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="truncate">{profile.platform || profile.site}</span>
        </a>
      ))}
    </div>
  );
}

function ManualSearchLinks({ links }: { links: Array<{ name: string; url: string }> }) {
  if (!links || links.length === 0) return null;

  return (
    <div className="mt-4 p-4 bg-zinc-800/50 rounded-lg">
      <p className="text-sm text-zinc-400 mb-3">
        Manual search links (no API available for automated search):
      </p>
      <div className="flex flex-wrap gap-2">
        {links.map((link, i) => (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors text-sm"
          >
            {link.name} ↗
          </a>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [searchType, setSearchType] = useState<SearchType>('email');
  const [query, setQuery] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [state, setState] = useState('');
  const [deepScan, setDeepScan] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PersonProfile | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    let searchQuery = query;
    if (searchType === 'name') {
      if (!firstName || !lastName) return;
      searchQuery = `${firstName} ${lastName}`;
    } else if (!query) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          type: searchType,
          state: searchType === 'name' ? state : undefined,
          deepScan
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch {
      setResult({
        query: searchQuery,
        query_type: searchType,
        results: [],
        risk_score: 0,
        summary: {},
        error: 'Search failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholder = () => {
    switch (searchType) {
      case 'email': return 'Enter email address';
      case 'phone': return 'Enter phone number (e.g., +1 415 555 1234)';
      case 'username': return 'Enter username';
      default: return '';
    }
  };

  const summary = result?.summary as Record<string, unknown> | undefined;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <main className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">MyFootprint</h1>
          <p className="text-zinc-400">
            Multi-source OSINT lookup for emails, usernames, phone numbers, and names
          </p>
        </div>

        {/* Search Type Tabs */}
        <div className="flex gap-1 mb-6 bg-zinc-900 p-1 rounded-lg w-fit">
          {(['email', 'username', 'phone', 'name'] as const).map((type) => (
            <button
              key={type}
              onClick={() => {
                setSearchType(type);
                setResult(null);
                setQuery('');
              }}
              className={`px-4 py-2 rounded-md font-medium capitalize transition-colors ${
                searchType === type
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-4 mb-8">
          {searchType === 'name' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-600 text-zinc-100 placeholder-zinc-500"
                disabled={loading}
              />
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-600 text-zinc-100 placeholder-zinc-500"
                disabled={loading}
              />
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-600 text-zinc-100"
                disabled={loading}
              >
                <option value="">Select state (optional)</option>
                {US_STATES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          ) : (
            <input
              type={searchType === 'email' ? 'email' : 'text'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={getPlaceholder()}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-600 text-zinc-100 placeholder-zinc-500"
              disabled={loading}
            />
          )}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={deepScan}
                onChange={(e) => setDeepScan(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-red-600 focus:ring-red-600"
                disabled={loading}
              />
              Deep scan (slower, checks more sources)
            </label>

            <button
              type="submit"
              disabled={loading || (searchType === 'name' ? !firstName || !lastName : !query)}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-500 rounded-lg font-medium transition-colors min-w-[120px]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Searching...
                </span>
              ) : 'Search'}
            </button>
          </div>
        </form>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {result.error ? (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-6">
                <p className="text-red-400">{result.error}</p>
              </div>
            ) : (
              <>
                {/* Summary Card */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                    <div>
                      <p className="text-sm text-zinc-400">Search Query</p>
                      <p className="text-xl font-semibold">{result.query}</p>
                    </div>
                    <RiskBadge score={result.risk_score} />
                  </div>

                  {/* Summary Stats */}
                  {summary ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-zinc-800">
                      {summary.breaches_found !== undefined ? (
                        <div>
                          <p className="text-2xl font-bold text-red-400">{String(summary.breaches_found)}</p>
                          <p className="text-sm text-zinc-400">Breaches Found</p>
                        </div>
                      ) : null}
                      {summary.total_profiles !== undefined ? (
                        <div>
                          <p className="text-2xl font-bold text-blue-400">{String(summary.total_profiles)}</p>
                          <p className="text-sm text-zinc-400">Profiles Found</p>
                        </div>
                      ) : null}
                      {summary.social_profiles !== undefined ? (
                        <div>
                          <p className="text-2xl font-bold text-blue-400">{String(summary.social_profiles)}</p>
                          <p className="text-sm text-zinc-400">Social Profiles</p>
                        </div>
                      ) : null}
                      {summary.legal_cases_found !== undefined ? (
                        <div>
                          <p className="text-2xl font-bold text-yellow-400">{String(summary.legal_cases_found)}</p>
                          <p className="text-sm text-zinc-400">Legal Cases</p>
                        </div>
                      ) : null}
                      {summary.valid !== undefined ? (
                        <div>
                          <p className="text-2xl font-bold text-green-400">{summary.valid ? 'Yes' : 'No'}</p>
                          <p className="text-sm text-zinc-400">Valid Number</p>
                        </div>
                      ) : null}
                      {summary.carrier ? (
                        <div>
                          <p className="text-lg font-bold text-zinc-200">{String(summary.carrier)}</p>
                          <p className="text-sm text-zinc-400">Carrier</p>
                        </div>
                      ) : null}
                      {summary.line_type ? (
                        <div>
                          <p className="text-lg font-bold text-zinc-200 capitalize">{String(summary.line_type).toLowerCase()}</p>
                          <p className="text-sm text-zinc-400">Line Type</p>
                        </div>
                      ) : null}
                      <div>
                        <p className="text-2xl font-bold text-zinc-200">{String(summary.sources_checked || result.results.length)}</p>
                        <p className="text-sm text-zinc-400">Sources Checked</p>
                      </div>
                    </div>
                  ) : null}

                  {/* Recommendation */}
                  {summary?.recommendation ? (
                    <div className="mt-4 p-4 bg-zinc-800/50 rounded-lg">
                      <p className="text-sm text-zinc-300">{String(summary.recommendation)}</p>
                    </div>
                  ) : null}

                  {/* Platforms Found */}
                  {summary?.platforms && Array.isArray(summary.platforms) && summary.platforms.length > 0 ? (
                    <div className="mt-4">
                      <p className="text-sm text-zinc-400 mb-2">Platforms with presence:</p>
                      <div className="flex flex-wrap gap-2">
                        {(summary.platforms as string[]).map((platform, i) => (
                          <span key={i} className="px-2 py-1 bg-zinc-800 rounded text-sm capitalize">
                            {platform}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Profile Links */}
                  {summary?.profiles ? (
                    <ProfilesList profiles={summary.profiles as Array<{ platform?: string; site?: string; url?: string }>} />
                  ) : null}

                  {/* Manual Search Links for Name searches */}
                  {summary?.manual_search_links ? (
                    <ManualSearchLinks links={summary.manual_search_links as Array<{ name: string; url: string }>} />
                  ) : null}
                </div>

                {/* Detailed Results */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Detailed Results</h3>
                  <div className="space-y-2">
                    {result.results.map((r, i) => (
                      <ResultCard key={i} result={r} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-zinc-800 text-center text-zinc-500 text-sm">
          <p>Powered by LeakCheck, phonenumbers, Sherlock, and more</p>
          <p className="mt-1">For authorized security research and personal use only</p>
        </footer>
      </main>
    </div>
  );
}
