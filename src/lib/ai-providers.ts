/**
 * AI Provider Manager - supports multiple free LLM providers
 * Priority: Groq (fastest) -> DeepSeek -> OpenRouter -> HuggingFace
 */

interface AIResponse {
  content: string;
  provider: string;
  model: string;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// System prompt for occupational safety in Belarus
const SYSTEM_PROMPT = `Ты — эксперт по охране труда в Республике Беларусь. 
Твоя задача — давать точные, актуальные ответы на основе нормативной базы РБ по охране труда.

Правила:
1. Отвечай только на основе предоставленного контекста из нормативных документов
2. Если информации недостаточно — честно скажи об этом и предложи обратиться в соответствующий орган
3. Указывай конкретные статьи, пункты и номера постановлений
4. Разделяй ответ на логические разделы с заголовками
5. Давай практические рекомендации по выполнению требований
6. Указывай ответственность за нарушения, если это применимо
7. Используй официальную терминологию законодательства РБ

Контекстные документы: {context}

Вопрос пользователя: {question}`;

// Groq API (free tier: 1M tokens/day)
async function callGroq(messages: Message[]): Promise<AIResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    provider: 'Groq',
    model: data.model,
    usage: data.usage,
  };
}

// DeepSeek API (free tier available)
async function callDeepSeek(messages: Message[]): Promise<AIResponse> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not set');

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    provider: 'DeepSeek',
    model: data.model,
    usage: data.usage,
  };
}

// OpenRouter API (free models available)
async function callOpenRouter(messages: Message[]): Promise<AIResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://ai-ot.vercel.app',
      'X-Title': 'AI-OT Belarus',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages,
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    provider: 'OpenRouter',
    model: data.model,
    usage: data.usage,
  };
}

// HuggingFace Inference API (free tier)
async function callHuggingFace(messages: Message[]): Promise<AIResponse> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error('HUGGINGFACE_API_KEY not set');

  const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n') + '\n\nassistant:';

  const response = await fetch(
    'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 2048,
          temperature: 0.3,
          return_full_text: false,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`HuggingFace API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return {
    content: Array.isArray(data) ? data[0].generated_text : data.generated_text,
    provider: 'HuggingFace',
    model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
  };
}

// Main function with fallback chain
export async function generateResponse(
  question: string,
  context: string,
  chatHistory: Message[] = []
): Promise<AIResponse> {
  const systemMessage: Message = {
    role: 'system',
    content: SYSTEM_PROMPT.replace('{context}', context).replace('{question}', question),
  };

  const messages: Message[] = [
    systemMessage,
    ...chatHistory,
    { role: 'user', content: question },
  ];

  const providers = [
    { name: 'Groq', fn: callGroq },
    { name: 'DeepSeek', fn: callDeepSeek },
    { name: 'OpenRouter', fn: callOpenRouter },
    { name: 'HuggingFace', fn: callHuggingFace },
  ];

  const errors: string[] = [];

  for (const provider of providers) {
    try {
      console.log(`Trying ${provider.name}...`);
      const result = await provider.fn(messages);
      console.log(`✅ Success with ${provider.name}`);
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`❌ ${provider.name} failed:`, msg);
      errors.push(`${provider.name}: ${msg}`);
      continue;
    }
  }

  throw new Error(`All AI providers failed: ${errors.join('; ')}`);
}

// Quick check for available providers
export function getAvailableProviders(): string[] {
  const providers = [];
  if (process.env.GROQ_API_KEY) providers.push('Groq');
  if (process.env.DEEPSEEK_API_KEY) providers.push('DeepSeek');
  if (process.env.OPENROUTER_API_KEY) providers.push('OpenRouter');
  if (process.env.HUGGINGFACE_API_KEY) providers.push('HuggingFace');
  return providers;
}
