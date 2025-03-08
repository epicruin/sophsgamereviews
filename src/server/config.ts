import dotenv from 'dotenv';

dotenv.config();

interface ServerConfig {
  port: number;
  supabaseUrl: string;
  supabaseServiceKey: string;
  openaiApiKey: string;
  corsOrigin: string;
}

if (!process.env.SUPABASE_URL) throw new Error('SUPABASE_URL is required');
if (!process.env.SUPABASE_SERVICE_KEY) throw new Error('SUPABASE_SERVICE_KEY is required');
if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required');

export const config: ServerConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  corsOrigin: process.env.CORS_ORIGIN || '*'
};
