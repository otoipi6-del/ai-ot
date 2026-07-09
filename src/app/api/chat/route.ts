import { NextRequest, NextResponse } from 'next/server';
import { generateResponse } from '@/lib/ai-providers';
import { hybridSearch } from '@/lib/vector-search';
import { webSearch } from '@/lib/web-search';
import { addMessage, getChatHistory } from '@/lib/chat-session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, useWebSearch = true } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // 1. Search vector database for relevant documents
    const vectorResults = await hybridSearch(message, {
      limit: 5,
      vectorWeight: 0.7,
      keywordWeight: 0.3,
    });

    // 2. Build context from vector search results
    let context = '';
    const sources: string[] = [];

    if (vectorResults.length > 0) {
      context = vectorResults.map((r, i) => {
        sources.push(`${r.document_title} (${r.authority || 'Неизвестный орган'})`);
        return `[${i + 1}] ${r.content}\n(Источник: ${r.document_title}${r.authority ? `, ${r.authority}` : ''})`;
      }).join('\n\n---\n\n');
    }

    // 3. If insufficient context, search the web
    let webResults: any[] = [];
    if (useWebSearch && (vectorResults.length < 2 || vectorResults[0].similarity < 0.75)) {
      const searchQuery = `Беларусь охрана труда ${message}`;
      webResults = await webSearch(searchQuery, { maxResults: 3 });

      if (webResults.length > 0) {
        const webContext = webResults.map((r, i) => {
          sources.push(`${r.title} (Веб-поиск)`);
          return `[В${i + 1}] ${r.description}\n(URL: ${r.url})`;
        }).join('\n\n---\n\n');

        context = context ? `${context}\n\n---\n\n${webContext}` : webContext;
      }
    }

    // 4. Get chat history for context
    const chatHistory = sessionId ? await getChatHistory(sessionId, 10) : [];
    const historyMessages = chatHistory.map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    // 5. Generate AI response
    const aiResponse = await generateResponse(message, context, historyMessages);

    // 6. Save messages to session
    if (sessionId) {
      await addMessage(sessionId, 'user', message);
      await addMessage(sessionId, 'assistant', aiResponse.content, sources);
    }

    return NextResponse.json({
      response: aiResponse.content,
      sources: [...new Set(sources)],
      provider: aiResponse.provider,
      model: aiResponse.model,
      vectorResults: vectorResults.length,
      webResults: webResults.length,
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate response',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
