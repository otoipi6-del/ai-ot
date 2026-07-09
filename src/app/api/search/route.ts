import { NextRequest, NextResponse } from 'next/server';
import { hybridSearch, vectorSearch } from '@/lib/vector-search';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, type = 'hybrid', limit = 5, threshold = 0.7 } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    let results;
    if (type === 'vector') {
      results = await vectorSearch(query, { limit, threshold });
    } else {
      results = await hybridSearch(query, { limit });
    }

    return NextResponse.json({
      query,
      type,
      count: results.length,
      results,
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      {
        error: 'Search failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
