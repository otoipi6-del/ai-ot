import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { message, sessionId, useWebSearch = true } = body;

    if (!message) {
      return jsonResponse({ error: 'Message is required' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    console.log('Creating client...');
    const supabase = createClient(supabaseUrl, serviceRole);

    // 1. Hugging Face embedding (новый роутер)
    const hfKey = Deno.env.get('HUGGINGFACE_API_KEY');
    let queryEmbedding: number[] = [];

    if (hfKey) {
      console.log('Calling Hugging Face...');
      try {
        const embedRes = await fetch(
          'https://router.huggingface.co/hf-inference/models/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2/pipeline/feature-extraction',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${hfKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              inputs: message,
              options: { wait_for_model: true },
            }),
          }
        );

        console.log('HF status:', embedRes.status);

        if (embedRes.ok) {
          const embedData = await embedRes.json();
          if (Array.isArray(embedData) && typeof embedData[0] === 'number') {
            queryEmbedding = embedData;
          } else if (Array.isArray(embedData) && Array.isArray(embedData[0])) {
            const tokenVectors = embedData as number[][];
            const dim = tokenVectors[0].length;
            const mean = new Array(dim).fill(0);
            for (const vec of tokenVectors) {
              for (let i = 0; i < dim; i++) mean[i] += vec[i];
            }
            queryEmbedding = mean.map(v => v / tokenVectors.length);
          }
          console.log('Embedding length:', queryEmbedding.length);
        } else {
          const errText = await embedRes.text();
          console.error('HF error:', errText);
        }
      } catch (e) {
        console.error('HF fetch exception:', e);
      }
    }

    // 2. Vector search
    let vectorResults: any[] = [];
    if (queryEmbedding.length > 0) {
      console.log('Calling match_documents...');
      try {
        const { data, error } = await supabase.rpc('match_documents', {
          query_embedding: queryEmbedding,
          match_threshold: 0.6,
          match_count: 5,
        });
        if (error) {
          console.error('RPC error:', JSON.stringify(error));
        } else {
          vectorResults = data || [];
          console.log('Vector results:', vectorResults.length);
        }
      } catch (e) {
        console.error('RPC exception:', e);
      }
    }

    // 3. Build context
    let context = '';
    const sources: string[] = [];

    if (vectorResults.length > 0) {
      context = vectorResults.map((r: any, i: number) => {
        sources.push(`${r.document_title || 'Документ'} (${r.authority || 'Неизвестный орган'})`);
        return `[${i + 1}] ${r.content}\n(Источник: ${r.document_title || 'Документ'})`;
      }).join('\n\n---\n\n');
    }

    // 4. System prompt
    const systemPrompt = `Ты — эксперт по охране труда в Республике Беларусь.

Контекстные документы: ${context}

Вопрос пользователя: ${message}

Правила:
1. Отвечай только на основе предоставленного контекста
2. Указывай конкретные статьи и пункты
3. Разделяй ответ на логические разделы
4. Давай практические рекомендации
5. Используй официальную терминологию РБ`;

    let aiResponse = '';
    let provider = '';

    // 5. Groq
    const groqKey = Deno.env.get('GROQ_API_KEY');
    if (groqKey) {
      console.log('Calling Groq...');
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openai/gpt-oss-120b',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message },
            ],
            temperature: 0.3,
            max_tokens: 4096,
          }),
        });

        console.log('Groq status:', groqRes.status);

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          aiResponse = groqData.choices[0].message.content;
          provider = 'Groq';
        } else {
          const errText = await groqRes.text();
          console.error('Groq error:', errText);
        }
      } catch (e) {
        console.error('Groq exception:', e);
      }
    }

    // Fallback: DeepSeek
    if (!aiResponse) {
      const deepseekKey = Deno.env.get('DEEPSEEK_API_KEY');
      if (deepseekKey) {
        console.log('Calling DeepSeek...');
        try {
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

          console.log('DeepSeek status:', dsRes.status);

          if (dsRes.ok) {
            const dsData = await dsRes.json();
            aiResponse = dsData.choices[0].message.content;
            provider = 'DeepSeek';
          } else {
            const errText = await dsRes.text();
            console.error('DeepSeek error:', errText);
          }
        } catch (e) {
          console.error('DeepSeek exception:', e);
        }
      }
    }

    // Fallback: OpenRouter
    if (!aiResponse) {
      const orKey = Deno.env.get('OPENROUTER_API_KEY');
      if (orKey) {
        console.log('Calling OpenRouter...');
        try {
          const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${orKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://otoipi6-del.github.io/ai-ot/',
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

          console.log('OpenRouter status:', orRes.status);

          if (orRes.ok) {
            const orData = await orRes.json();
            aiResponse = orData.choices[0].message.content;
            provider = 'OpenRouter';
          } else {
            const errText = await orRes.text();
            console.error('OpenRouter error:', errText);
          }
        } catch (e) {
          console.error('OpenRouter exception:', e);
        }
      }
    }

    if (!aiResponse) {
      return jsonResponse({ error: 'All AI providers failed' }, 503);
    }

    console.log('Success, provider:', provider);
    return jsonResponse({
      content: aiResponse,
      sources: [...new Set(sources)],
      model_used: provider,
      search_performed: vectorResults.length > 0,
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('TOP-LEVEL ERROR:', msg);
    return jsonResponse({ error: msg }, 500);
  }
});
