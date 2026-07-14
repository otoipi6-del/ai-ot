import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, sessionId, useWebSearch = true } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Generate embedding for query
    const jinaKey = Deno.env.get('JINA_API_KEY');
    let queryEmbedding: number[] = [];

    if (jinaKey) {
      const embedRes = await fetch('https://api.jina.ai/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jinaKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'jina-embeddings-v3',
          input: [message],
        }),
      });
      const embedData = await embedRes.json();
      queryEmbedding = embedData.data[0].embedding;
    }

    // 2. Vector search
    const { data: vectorResults } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: 5,
    });

    // 3. Build context
    let context = '';
    const sources: string[] = [];

    if (vectorResults && vectorResults.length > 0) {
      context = vectorResults.map((r: any, i: number) => {
        sources.push(`${r.document_title} (${r.authority || 'Неизвестный орган'})`);
        return `[${i + 1}] ${r.content}\n(Источник: ${r.document_title})`;
      }).join('\n\n---\n\n');
    }

    // 4. Web search fallback
    if (useWebSearch && (!vectorResults || vectorResults.length < 2)) {
      try {
        const searchRes = await fetch(
          `https://html.duckduckgo.com/html/?q=${encodeURIComponent('Беларусь охрана труда ' + message)}`
        );
        const searchHtml = await searchRes.text();
        // Simple extraction
        context += '\n\n[Веб-поиск] Дополнительная информация из интернета.';
      } catch {
        // Ignore web search errors
      }
    }

    // 5. Call AI provider
    const systemPrompt = `Ты — эксперт по охране труда в Республике Беларусь.

Контекстные документы: ${context}

Вопрос пользователя: ${message}

Правила:
1. Отвечай только на основе предоставленного контекста
2. Указывай конкретные статьи и пункты
3. Разделяй ответ на логические разделы
4. Давай практические рекомендации
5. Используй официальную терминологию РБ`;

    // Try Groq first
    const groqKey = Deno.env.get('GROQ_API_KEY');
    let aiResponse = '';
    let provider = '';

    if (groqKey) {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
          temperature: 0.3,
          max_tokens: 4096,
        }),
      });

      if (groqRes.ok) {
        const groqData = await groqRes.json();
        aiResponse = groqData.choices[0].message.content;
        provider = 'Groq';
      }
    }

    // Fallback to DeepSeek
    if (!aiResponse) {
      const deepseekKey = Deno.env.get('DEEPSEEK_API_KEY');
      if (deepseekKey) {
        const dsRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${deepseekKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message },
            ],
            temperature: 0.3,
            max_tokens: 4096,
          }),
        });

        if (dsRes.ok) {
          const dsData = await dsRes.json();
          aiResponse = dsData.choices[0].message.content;
          provider = 'DeepSeek';
        }
      }
    }

    // Fallback to OpenRouter
    if (!aiResponse) {
      const orKey = Deno.env.get('OPENROUTER_API_KEY');
      if (orKey) {
        const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${orKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://ai-ot.github.io',
            'X-Title': 'AI-OT Belarus',
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3.3-70b-instruct:free',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message },
            ],
            temperature: 0.3,
            max_tokens: 4096,
          }),
        });

        if (orRes.ok) {
          const orData = await orRes.json();
          aiResponse = orData.choices[0].message.content;
          provider = 'OpenRouter';
        }
      }
    }

    if (!aiResponse) {
      return new Response(
        JSON.stringify({ error: 'All AI providers failed' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save to chat history
    if (sessionId) {
      await supabase.from('chat_messages').insert([
        { session_id: sessionId, role: 'user', content: message },
        { session_id: sessionId, role: 'assistant', content: aiResponse, sources },
      ]);
    }

    return new Response(
      JSON.stringify({
        response: aiResponse,
        sources: [...new Set(sources)],
        provider,
        vectorResults: vectorResults?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
