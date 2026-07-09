import { NextRequest, NextResponse } from 'next/server';
import { webSearch } from '@/lib/web-search';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, maxResults = 5 } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const results = await webSearch(query, { maxResults });

    return NextResponse.json({
      query,
      count: results.length,
      results,
    });

  } catch (error) {
    console.error('Web search API error:', error);
    return NextResponse.json(
      {
        error: 'Web search failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
