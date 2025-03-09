const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

exports.handler = async function(event, context) {
  // Log incoming request for debugging
  console.log('Game title generator function invoked');
  console.log('HTTP Method:', event.httpMethod);
  console.log('Environment variables check:');
  console.log('- OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
  console.log('- SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
  console.log('- SUPABASE_SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_KEY);
  
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  try {
    // Parse the request body
    const payload = JSON.parse(event.body);
    const { existingTitles } = payload;
    
    if (!Array.isArray(existingTitles)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'existingTitles must be an array' })
      };
    }
    
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    
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

    console.log('Generating game title, existing titles count:', allExistingTitles.length);
    
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 50,
      response_format: { type: "text" },
    });

    const title = completion.choices[0].message.content?.trim();
    console.log('Generated title:', title);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    };
  } catch (error) {
    console.error('Error in game-title function:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to generate game title',
        message: error.message,
        stack: error.stack
      })
    };
  }
};
