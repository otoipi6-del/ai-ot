import { Source } from './supabase'

// Поиск в интернете через DuckDuckGo (без API ключа)
export async function searchWeb(query: string): Promise<Source[]> {
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' охрана труда Беларусь')}`

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      throw new Error('Web search failed')
    }

    const html = await response.text()
    const results: Source[] = []

    // Парсинг результатов DuckDuckGo
    const resultBlocks = html.match(/<a rel="nofollow" class="result__a" href="([^"]+)">([^<]+)<\/a>/g) || []

    for (let i = 0; i < Math.min(resultBlocks.length, 3); i++) {
      const match = resultBlocks[i].match(/href="([^"]+)">([^<]+)</)
      if (match) {
        results.push({
          id: `web-${i}`,
          title: match[2].trim(),
          content: `Результат поиска: ${match[2].trim()}`,
          embedding: [],
          metadata: { url: match[1] },
          created_at: new Date().toISOString(),
        })
      }
    }

    return results
  } catch (error) {
    console.error('Web search error:', error)
    return []
  }
}

// Поиск через SearXNG (если настроен)
export async function searchSearxng(query: string, searxngUrl?: string): Promise<Source[]> {
  if (!searxngUrl) return []

  try {
    const response = await fetch(`${searxngUrl}/search?q=${encodeURIComponent(query)}&format=json`)
    const data = await response.json()

    return (data.results || []).slice(0, 3).map((r: any, i: number) => ({
      id: `searx-${i}`,
      title: r.title,
      content: r.content || r.title,
      embedding: [],
      metadata: { url: r.url },
      created_at: new Date().toISOString(),
    }))
  } catch (error) {
    console.error('SearXNG search error:', error)
    return []
  }
}
