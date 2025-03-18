const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');
const dotenv = require('dotenv');
const path = require('path');

// Ensure environment variables are loaded
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Initialize OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to validate user session
async function validateSession(supabaseClient, userId) {
  const { data: isAdmin } = await supabaseClient.rpc('is_admin', {
    user_id: userId
  });
  return isAdmin;
}

exports.handler = async function(event, context) {
  try {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    // Parse the request body
    const body = JSON.parse(event.body);
    const { articleTitle, section, userId } = body;

    if (!section || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    // Validate user session
    const isAuthorized = await validateSession(supabase, userId);
    
    if (!isAuthorized) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized access' })
      };
    }

    // Define prompts for different sections
    const prompts = {
      title: `Generate an engaging and SEO-friendly title for a gaming article. The title should be catchy and appealing to gamers. Keep it under 10 words.`,
      
      summary: `Write a compelling summary for a gaming article. This summary will appear as a preview on the website and should hook readers. Keep it under 50 words and make it engaging.`,
      
      content: `Write a detailed, engaging, and informative article about gaming. The article should be well-structured with clear paragraphs, include relevant gaming terminology, and provide valuable insights for gamers. Write approximately 500-800 words. Use markdown formatting for headings and other elements.`,
      
      tldr: `Create a concise TL;DR (Too Long; Didn't Read) summary for a gaming article. This should capture the key points in 2-3 sentences max.`
    };

    // If we have an article title, include it in the prompts
    if (articleTitle) {
      prompts.title = `The gaming article is about "${articleTitle}". Generate an engaging and SEO-friendly title for this article. The title should be catchy and appealing to gamers. Keep it under 10 words.`;
      
      prompts.summary = `The gaming article is about "${articleTitle}". Write a compelling summary for this gaming article. This summary will appear as a preview on the website and should hook readers. Keep it under 50 words and make it engaging.`;
      
      prompts.content = `Write a detailed, engaging, and informative article about "${articleTitle}". The article should be well-structured with clear paragraphs, include relevant gaming terminology, and provide valuable insights for gamers. Write approximately 500-800 words. Use markdown formatting for headings and other elements.`;
      
      prompts.tldr = `Create a concise TL;DR (Too Long; Didn't Read) summary for a gaming article about "${articleTitle}". This should capture the key points in 2-3 sentences max.`;
    }

    // Generate content using OpenAI
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a professional gaming writer and journalist who specializes in creating engaging content for game enthusiasts. Your articles are informative, well-researched, and written in a conversational style that appeals to gamers of all ages."
        },
        {
          role: "user",
          content: prompts[section]
        }
      ],
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 2000,
    });

    const generatedContent = completion.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ [section]: generatedContent })
    };
  } catch (error) {
    console.error('Error generating article info:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Something went wrong' })
    };
  }
}; 