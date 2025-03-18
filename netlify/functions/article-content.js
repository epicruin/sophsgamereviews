const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const dotenv = require('dotenv');
const path = require('path');

// Ensure environment variables are loaded
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize Perplexity client using OpenAI format
const perplexity = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: 'https://api.perplexity.ai'
});

// Function to validate user session
async function validateSession(supabaseClient, userId) {
  const { data: isAdmin } = await supabaseClient.rpc('is_admin', {
    user_id: userId
  });
  return isAdmin;
}

exports.handler = async function(event, context) {
  // Log incoming request for debugging
  console.log('Article content function invoked');
  console.log('HTTP Method:', event.httpMethod);
  
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
    const { articleTitle, section, userId } = payload;
    
    if (!section || !userId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
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
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized access' })
      };
    }
    
    // Define prompts for different sections
    const title = articleTitle || "New Article";
    const prompts = {
      summary: `Write a compelling summary (3-4 sentences) for an article titled "${title}". The summary should entice readers to read the full article.`,
      content: `Write a comprehensive article with the title "${title}". 
        The article should be engaging, informative, and well-structured.
        Include an introduction that hooks the reader, a body with detailed information, and a conclusion.
        Use a tone that is conversational yet professional.
        The article should be around 500-800 words.`,
      tldr: `Write a concise TL;DR (Too Long; Didn't Read) summary for an article titled "${title}". 
        This should be 1-2 sentences that capture the essential point of the article.`,
      imageQuery: `Generate a specific image search query that would return high-quality, relevant images for an article titled "${title}".
        The query should be specific enough to return images that would work well as the main featured image for this article.
        Return just the search query text, nothing else.`,
      titleAndSummary: `Generate a title and summary for a new article about ${title || "a trending topic"}.
        Return the response in the following JSON format:
        {
          "title": "Engaging Article Title",
          "summary": "Compelling 3-4 sentence summary that entices readers to read more"
        }`
    };
    
    // Use appropriate AI service based on section
    try {
      // Use Perplexity for image queries to get better results
      if (section === 'imageQuery') {
        console.log(`Using Perplexity API for ${section}`);
        const completion = await perplexity.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are a professional image search specialist. Your task is to generate the most effective search query that will return high-quality, relevant images for the requested topic."
            },
            {
              role: "user",
              content: prompts[section]
            }
          ],
          model: "sonar-pro",
          temperature: 0.7,
          max_tokens: 100
        });
        
        const response = completion.choices[0].message.content;
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [section]: response.trim() })
        };
      }
      
      // Use Perplexity for titleAndSummary to get better results with research
      if (section === 'titleAndSummary') {
        console.log(`Using Perplexity API for ${section}`);
        const completion = await perplexity.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are a professional content creator who specializes in writing engaging article titles and summaries. Your task is to generate a compelling title and summary for the requested topic."
            },
            {
              role: "user",
              content: prompts[section]
            }
          ],
          model: "sonar-pro",
          temperature: 0.7,
          max_tokens: 500
        });
        
        const response = completion.choices[0].message.content;
        
        try {
          const jsonMatch = response?.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return {
              statusCode: 200,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ [section]: JSON.parse(jsonMatch[0]) })
            };
          }
          throw new Error('No valid JSON found in response');
        } catch (e) {
          console.error('Failed to parse JSON response:', e);
          // Fallback to returning the raw text
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ summary: response.trim() })
          };
        }
      }
      
      // Use OpenAI for the rest
      console.log(`Using OpenAI API for ${section}`);
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a professional content writer specializing in creating engaging articles."
          },
          {
            role: "user",
            content: prompts[section]
          }
        ],
        model: "gpt-4-turbo-preview",
        temperature: 0.7,
        max_tokens: section === 'content' ? 2000 : 500
      });
      
      const response = completion.choices[0].message.content;
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [section]: response.trim() })
      };
    } catch (error) {
      console.error(`AI service error for ${section}:`, error);
      
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'AI service error',
          message: error.message,
          section: section
        })
      };
    }
    
  } catch (error) {
    console.error('Server error:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server error', message: error.message })
    };
  }
}; 