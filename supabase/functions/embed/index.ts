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
    const { text } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Jina AI for embeddings in edge function
    const jinaKey = Deno.env.get('JINA_API_KEY');

    if (!jinaKey) {
      return new Response(
        JSON.stringify({ error: 'JINA_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://api.jina.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jinaKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'jina-embeddings-v3',
        input: [text],
      }),
    });

    const data = await response.json();

    return new Response(
      JSON.stringify({ embedding: data.data[0].embedding }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
