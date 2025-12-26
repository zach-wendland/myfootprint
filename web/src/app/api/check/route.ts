import { NextRequest, NextResponse } from 'next/server';

const LEAKCHECK_API_KEY = process.env.LEAKCHECK_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email required' },
        { status: 400 }
      );
    }

    if (!LEAKCHECK_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Use v2 API for full data (passwords, hashes, usernames)
    const response = await fetch(
      `https://leakcheck.io/api/v2/query/${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          'X-API-Key': LEAKCHECK_API_KEY
        }
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check email' },
      { status: 500 }
    );
  }
}
