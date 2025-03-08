import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function generateGameTitle(existingTitles: string[]) {
  try {
    // Get all existing review titles from the database
    const { data: reviewTitles, error } = await supabase
      .from('reviews')
      .select('title');

    if (error) {
      console.error('Error fetching review titles:', error);
      throw error;
    }

    // Combine manually provided titles with database titles
    const allExistingTitles = [
      ...existingTitles,
      ...(reviewTitles?.map(review => review.title) || [])
    ].filter(t => t.trim());

    const existingTitlesStr = allExistingTitles.join(", ");
  
    const prompt = `Suggest a video game title that is available on at least one of these platforms: PC, PlayStation 5, PlayStation 4, Xbox Series X/S, Xbox One, or Nintendo Switch.
    The game should be a real, existing game that has been released.
    ${existingTitlesStr ? `DO NOT suggest any of these games that are already in the list: ${existingTitlesStr}` : ''}
    Reply with ONLY the exact game title, nothing else.`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 50,
      response_format: { type: "text" },
    });

    return completion.choices[0].message.content?.trim();
  } catch (error) {
    console.error('Error in generateGameTitle:', error);
    throw error;
  }
}
