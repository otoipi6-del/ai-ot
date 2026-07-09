/**
 * Web Search Module
 * Supports: DuckDuckGo (no API key), SearXNG (self-hosted, no API key)
 */

import { search } from 'duck-duck-scrape';

export interface WebSearchResult {
  title: string;
  url: string;
  description: string;
  source: string;
}

/**
 * Search using DuckDuckGo (free, no API key)
 */
export async function searchDuckDuckGo(
  query: string,
  options: { maxResults?: number } = {}
): Promise<WebSearchResult[]> {
  const { maxResults = 5 } = options;

  try {
    const results = await search(query, {
      safeSearch: 0,
    });

    return (results.results || [])
      .slice(0, maxResults)
      .map((result: any) => ({
        title: result.title,
        url: result.url,
        description: result.description,
        source: 'DuckDuckGo',
      }));
  } catch (error) {
    console.error('DuckDuckGo search error:', error);
    return [];
  }
}

/**
 * Search using SearXNG (self-hosted, no API key required)
 */
export async function searchSearXNG(
  query: string,
  options: { maxResults?: number; instance?: string } = {}
): Promise<WebSearchResult[]> {
  const { maxResults = 5, instance = 'https://search.sapti.me' } = options;

  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      language: 'ru',
      engines: 'google,bing,duckduckgo',
    });

    const response = await fetch(`${instance}/search?${params.toString()}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`SearXNG error: ${response.status}`);
    }

    const data = await response.json();

    return (data.results || [])
      .slice(0, maxResults)
      .map((result: any) => ({
        title: result.title,
        url: result.url,
        description: result.content || result.description || '',
        source: `SearXNG (${result.engine})`,
      }));
  } catch (error) {
    console.error('SearXNG search error:', error);
    return [];
  }
}

/**
 * Combined web search with fallback
 */
export async function webSearch(
  query: string,
  options: { maxResults?: number } = {}
): Promise<WebSearchResult[]> {
  const { maxResults = 5 } = options;

  // Try DuckDuckGo first
  let results = await searchDuckDuckGo(query, { maxResults });

  // If DuckDuckGo fails or returns few results, try SearXNG
  if (results.length < 3) {
    const searxResults = await searchSearXNG(query, { maxResults });
    // Merge and deduplicate by URL
    const seen = new Set(results.map(r => r.url));
    for (const result of searxResults) {
      if (!seen.has(result.url)) {
        results.push(result);
        seen.add(result.url);
      }
    }
  }

  return results.slice(0, maxResults);
}

/**
 * Fetch and extract text from a URL
 */
export async function fetchPageContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Simple HTML to text extraction
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return text.substring(0, 10000); // Limit to 10k chars
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    return '';
  }
}
