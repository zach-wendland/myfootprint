import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

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

// Run Python script and return JSON result
async function runPythonSearch(
  query: string,
  type: string,
  state?: string,
  deepScan?: boolean
): Promise<PersonProfile> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), '..', 'people_search.py');
    const args = [scriptPath, query, '-t', type, '--json'];

    if (state) {
      args.push('--state', state);
    }
    if (deepScan) {
      args.push('--deep');
    }

    const python = spawn('python', args, {
      env: {
        ...process.env,
        LEAKCHECK_API_KEY: process.env.LEAKCHECK_API_KEY || '',
        NUMVERIFY_API_KEY: process.env.NUMVERIFY_API_KEY || '',
        VERIPHONE_API_KEY: process.env.VERIPHONE_API_KEY || '',
        PDL_API_KEY: process.env.PDL_API_KEY || '',
      }
    });

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script exited with code ${code}: ${stderr}`));
        return;
      }

      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (e) {
        reject(new Error(`Failed to parse Python output: ${stdout}`));
      }
    });

    python.on('error', (err) => {
      reject(err);
    });

    // Timeout after 2 minutes
    setTimeout(() => {
      python.kill();
      reject(new Error('Search timed out'));
    }, 120000);
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();
    const { query, type, state, deepScan } = body;

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

    // Run the search
    const result = await runPythonSearch(query, type, state, deepScan);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    );
  }
}
