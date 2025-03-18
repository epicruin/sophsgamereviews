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
      content: `Write a comprehensive gaming article with the title "${title}" for a female-focused gaming website. 
        The article should be engaging, informative, and well-structured.
        The content should explicitly relate to video games and the female gaming experience.
        Include an introduction that hooks female gamers, a body with detailed information, and a conclusion.
        Use a tone that is conversational yet professional, and specifically written for a female gaming audience.
        The article should be around 500-800 words.`,
      
      tldr: `Write a concise TL;DR (Too Long; Didn't Read) summary for a gaming article titled "${title}" for female gamers. 
        This should be 1-2 sentences that capture the essential point of the article in a way that appeals to the female gaming community.`,
      
      imageQuery: `Generate a specific image search query that would return high-quality, relevant images for a gaming article titled "${title}" for a female-focused gaming website.
        The query should be specific enough to return gaming-related images that would work well as the main featured image for this article.
        The images should be appealing to female gamers and relevant to gaming.
        Return just the search query text, nothing else.`,
      
      titleAndSummary: `Generate a title and summary for a new article for a female-focused gaming website. The topic is ${title || "trending video games"}. 
        Both the title and summary must be explicitly related to video games and appeal to female gamers.
        
        Important: This is a gaming website for women, so the content MUST be about video games, gaming culture, or the gaming industry, with a focus on female gamers.
        
        Return the response in the following JSON format:
        {
          "title": "Engaging Gaming Article Title",
          "summary": "Compelling 3-4 sentence summary about the gaming topic that entices female readers to read more"
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
              content: "You are a professional image search specialist for a female-focused gaming website. Your task is to generate the most effective search query that will return high-quality, gaming-related images for the requested topic. All images should be related to video games and appeal to female gamers."
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
              content: "You are a professional content creator for a female-focused gaming website. Your task is to generate compelling gaming-related titles and summaries for female gamers. All content MUST be specifically related to video games, gaming culture, or the gaming industry, and appeal to a female gaming audience."
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
            body: JSON.stringify({ titleAndSummary: { 
              title: title,
              summary: response.trim() 
            }})
          };
        }
      }
      
      // Use OpenAI for the rest
      console.log(`Using OpenAI API for ${section}`);
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a professional content writer for a female-focused gaming website. You specialize in creating engaging articles about video games, gaming culture, and the gaming industry specifically for female gamers."
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