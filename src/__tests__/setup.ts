import '@testing-library/jest-dom';

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.GROQ_API_KEY = 'test-groq-key';
process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
process.env.OPENROUTER_API_KEY = 'test-openrouter-key';

// Mock fetch
global.fetch = vi.fn();
