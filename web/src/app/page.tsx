'use client';

import { useState } from 'react';

interface BreachEntry {
  password?: string;
  password_hash?: string;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  ip?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  profile_name?: string;
  source: {
    name: string;
    breach_date?: string;
  };
}

interface BreachResult {
  success?: boolean;
  found?: number;
  result?: BreachEntry[];
  message?: string;
  error?: string;
}

export default function Home() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BreachResult | null>(null);

  const checkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ error: 'Failed to check email' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <main className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">MyFootprint</h1>
        <p className="text-zinc-400 mb-8">Check if your credentials have been exposed in data breaches</p>

        <form onSubmit={checkEmail} className="flex gap-3 mb-8">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-600 text-zinc-100 placeholder-zinc-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !email}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-500 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Checking...' : 'Check'}
          </button>
        </form>

        {result && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            {result.error && (
              <p className="text-red-400">{result.error}</p>
            )}

            {result.message && (
              <p className="text-yellow-400">{result.message}</p>
            )}

            {result.result && result.result.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-red-500 text-2xl">⚠</span>
                  <h2 className="text-xl font-semibold text-red-400">
                    {result.found || result.result.length} breach{(result.found || result.result.length) > 1 ? 'es' : ''} found
                  </h2>
                </div>

                <div className="space-y-4">
                  {result.result.map((entry, i) => (
                    <div key={i} className="border-l-2 border-red-600 pl-4 py-2">
                      <h3 className="font-semibold text-zinc-100">{entry.source.name}</h3>
                      {entry.source.breach_date && (
                        <p className="text-sm text-zinc-400">Date: {entry.source.breach_date}</p>
                      )}
                      {entry.password && (
                        <p className="text-sm">
                          <span className="text-zinc-400">Password: </span>
                          <code className="bg-zinc-800 px-2 py-1 rounded text-red-400 font-bold">{entry.password}</code>
                        </p>
                      )}
                      {entry.password_hash && (
                        <p className="text-sm">
                          <span className="text-zinc-400">Hash: </span>
                          <code className="bg-zinc-800 px-2 py-1 rounded text-orange-400 text-xs">{entry.password_hash}</code>
                        </p>
                      )}
                      {entry.username && (
                        <p className="text-sm text-zinc-400">Username: <span className="text-zinc-300">{entry.username}</span></p>
                      )}
                      {entry.ip && (
                        <p className="text-sm text-zinc-400">IP: <span className="text-zinc-300">{entry.ip}</span></p>
                      )}
                      {(entry.first_name || entry.last_name) && (
                        <p className="text-sm text-zinc-400">Name: <span className="text-zinc-300">{entry.first_name} {entry.last_name}</span></p>
                      )}
                      {(entry.city || entry.state || entry.zip) && (
                        <p className="text-sm text-zinc-400">Location: <span className="text-zinc-300">{[entry.city, entry.state, entry.zip].filter(Boolean).join(', ')}</span></p>
                      )}
                    </div>
                  ))}
                </div>

                <p className="mt-6 text-sm text-zinc-400 border-t border-zinc-800 pt-4">
                  Change these passwords immediately on all accounts where you used them.
                </p>
              </>
            )}

            {result.success && (!result.result || result.result.length === 0) && (
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-2xl">✓</span>
                <p className="text-green-400">No breaches found for this email!</p>
              </div>
            )}
          </div>
        )}

        <footer className="mt-12 text-center text-zinc-600 text-sm">
          Powered by LeakCheck API • For personal security use only
        </footer>
      </main>
    </div>
  );
}
