const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const dotenv = require('dotenv');
const path = require('path');

// Ensure environment variables are loaded
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

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
  console.log('Image search function invoked');
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
    const { query, userId } = payload;
    
    if (!query || !userId) {
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
    
    try {
      // Use Perplexity for image search
      console.log(`Searching for images with query: "${query}"`);
      
      const systemPrompt = `You are a professional image search specialist. Your task is to search for high-quality, free-to-use images that match the user's query.
      
      IMPORTANT INSTRUCTIONS:
      1. Return exactly 6 image URLs that are relevant to the query
      2. ONLY include images that are likely freely usable (from sources like Unsplash, Pexels, Pixabay)
      3. Focus on high-quality, eye-catching images suitable for article headers
      4. Return ONLY the image URLs in a JSON array format like this:
         ["https://example.com/image1.jpg", "https://example.com/image2.jpg", ...]
      5. DO NOT include any explanation or additional text
      6. Only include valid, direct image URLs that end with image extensions (.jpg, .jpeg, .png, .webp)
      7. Do not include any placeholder or example URLs
      8. Ensure all URLs are valid and accessible`;
      
      const completion = await perplexity.chat.completions.create({
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Search for images related to: ${query}`
          }
        ],
        model: "sonar-pro",
        temperature: 0.7,
        max_tokens: 1000
      });
      
      const response = completion.choices[0].message.content;
      console.log('Perplexity response received', response?.length || 0);
      
      try {
        // Try to parse the response as JSON
        let imageUrls = [];
        
        // Find JSON array in the response
        const jsonMatch = response?.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          imageUrls = JSON.parse(jsonMatch[0]);
        } else {
          // If no JSON array found, try to extract URLs from the text
          const urlRegex = /(https?:\/\/[^\s"]+\.(jpg|jpeg|png|webp))/g;
          const urls = response?.match(urlRegex) || [];
          imageUrls = [...new Set(urls)]; // Remove duplicates
        }
        
        // Validate URLs
        const validImageUrls = imageUrls.filter(url => {
          try {
            new URL(url);
            return url.match(/\.(jpg|jpeg|png|webp)$/i);
          } catch {
            return false;
          }
        });
        
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrls: validImageUrls })
        };
      } catch (e) {
        console.error('Failed to parse image URLs:', e);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            error: 'Failed to parse image URLs',
            message: e.message,
            imageUrls: []
          })
        };
      }
    } catch (error) {
      console.error('Image search error:', error);
      
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Image search error',
          message: error.message,
          imageUrls: []
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