const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const dotenv = require('dotenv');
const path = require('path');

// Ensure environment variables are loaded
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Debug OpenAI key
console.log('OpenAI Key exists in game-info.js:', !!process.env.OPENAI_API_KEY);

// Initialize OpenAI client (server-side only)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Server-side environment variable
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
  console.log('Game info function invoked');
  console.log('HTTP Method:', event.httpMethod);
  console.log('Environment variables check:');
  console.log('- OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
  console.log('- PERPLEXITY_API_KEY exists:', !!process.env.PERPLEXITY_API_KEY);
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
    const { gameTitle, section, userId } = payload;
    
    if (!gameTitle || !section || !userId) {
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
    const prompts = {
      excerpt: `Write a short, engaging excerpt (max 2 sentences) for a game review of ${gameTitle}.`,
      releaseDetails: `Search for and provide accurate release details for the game ${gameTitle} in the following JSON format:
        {
          "developer": "",
          "publisher": "",
          "ageRating": "",
          "priceUSD": 0,
          "priceGBP": 0,
          "priceEUR": 0,
          "releaseDate": "YYYY-MM-DD",
          "systems": [],
          "purchaseLinks": [
            {
              "name": "Store Name (e.g. Steam)",
              "url": "https://store-url.com/game"
            }
          ]
        }
        Important:
        1. Include up to 3 valid purchase links where this game can be bought
        2. Always verify that the URLs are real and working
        3. Include diverse store options (e.g. Steam, Epic, PlayStation Store, Xbox, Nintendo)
        4. Prioritize official store pages rather than third-party resellers`,
      prosAndCons: `List exactly 4 pros and 4 cons of max 5 words each for the game ${gameTitle} in JSON format:
        {
          "pros": ["", "", "", ""],
          "cons": ["", "", "", ""]
        }`,
      systemRequirements: `Search for and provide accurate PC system requirements for ${gameTitle} in JSON format:
        {
          "minimum": {
            "os": "",
            "processor": "",
            "memory": "",
            "graphics": "",
            "storage": ""
          },
          "recommended": {
            "os": "",
            "processor": "",
            "memory": "",
            "graphics": "",
            "storage": ""
          }
        }
        Make sure to verify the information from reliable sources like Steam, Epic Games, or the official game website.`,
      awards: `Search for and provide accurate award information for the game ${gameTitle}. For EACH award, you MUST include both the award name and its exact date. Return the data in this JSON format:
        {
          "awards": ["Award 1", "Award 2"],
          "award_dates": {
            "Award 1": "YYYY-MM-DD",
            "Award 2": "YYYY-MM-DD"
          }
        }
        Important:
        1. Every award MUST have a corresponding date
        2. Dates MUST be in YYYY-MM-DD format
        3. Only include awards if you can find their exact dates
        4. Focus on major gaming awards like Game Awards, BAFTA Games Awards, DICE Awards, etc.
        5. Verify all information from reliable sources`,
      youtubeTrailer: `Search for and provide the official trailer or gameplay video URL for the game ${gameTitle}. Return the data in this JSON format:
        {
          "url": "https://www.youtube.com/watch?v=..."
        }
        Important:
        1. Prioritize official game trailers from the publisher's YouTube channel
        2. If no official trailer is found, use a high-quality gameplay video
        3. Verify that the video is actually for ${gameTitle} and not a different game
        4. Return only one URL for the best quality, most relevant video`,
      multiplayerDetails: `Search for and provide accurate multiplayer information for the game ${gameTitle}. Return the data in this JSON format:
        {
          "online_coop": true/false,
          "couch_coop": true/false,
          "split_screen": true/false,
          "max_players": 0
        }
        Important:
        1. online_coop: Does the game support online cooperative play with other players?
        2. couch_coop: Does the game support local/same-screen cooperative play?
        3. split_screen: Does the game support split-screen multiplayer?
        4. max_players: What is the maximum number of players supported in any mode?
        5. Verify all information from reliable sources like the official game website, Steam, or other gaming platforms.`,
      fullReview: `Write a captivating and informative game review of ${gameTitle} from the perspective of a female game reviewer from England, targeting a female audience.

        Review Structure:
        
        **Introduction:** Craft an engaging opening that introduces the game, its genre, platform, and key features. Hook the reader with your initial impressions and what makes this game noteworthy.
        
        **Gameplay Experience:** Dive into the core gameplay mechanics, controls, and overall feel. Share personal experiences and memorable moments to make the review relatable and authentic.
        
        **Story and Narrative (if applicable):** Explore the game's story, characters, and narrative elements. Provide enough intrigue without spoiling key plot points.
        
        **Graphics and Sound:** Evaluate the visual presentation, art style, and sound design. Highlight standout elements and areas for improvement.
        
        **Target Audience:** Share insights on why this game particularly resonates with female gamers. Discuss specific features and elements that make it appealing.
        
        **Overall Rating and Recommendation:** Conclude with your rating and detailed recommendation. Explain your reasoning and specify who would enjoy this game most.
        
        Example tone (adapt to fit the specific game):
        "Right, ladies, let's talk about ${gameTitle}! This brilliant little indie gem on the Nintendo Switch has completely stolen my heart. From the charming pixel art to the addictive gameplay, it's a must-have for any fan of platformers."`
    };
    
    try {
      // Use Perplexity for certain sections
      if (section === 'releaseDetails' || section === 'systemRequirements' || 
          section === 'awards' || section === 'youtubeTrailer' || 
          section === 'multiplayerDetails') {
        
        console.log(`Using Perplexity API for ${section}`);
        
        try {
          // Set a timeout for the API call to prevent Netlify function timeouts
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('API request timed out')), 8000)
          );
          
          const apiCallPromise = perplexity.chat.completions.create({
            messages: [
              {
                role: "system",
                content: "You are a professional game information assistant. Your task is to search the internet and provide accurate, up-to-date information about video games. Always verify information from reliable sources and provide the most recent data available."
              },
              {
                role: "user",
                content: prompts[section]
              }
            ],
            model: "sonar-pro",
            temperature: 0.7,
            max_tokens: 4000
          });
          
          // Race the API call against the timeout
          const completion = await Promise.race([apiCallPromise, timeoutPromise]);
          
          const response = completion.choices[0].message.content;
          console.log(`Perplexity response received, length: ${response?.length || 0}`);
          
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
            return {
              statusCode: 500,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ [section]: null })
            };
          }
        } catch (error) {
          console.error(`Perplexity API error for ${section}:`, error);
          // Return a more specific error for timeouts
          if (error.message === 'API request timed out') {
            return {
              statusCode: 504,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                error: 'API request timed out',
                message: 'The request to the AI service took too long and timed out',
                section: section
              })
            };
          }
          
          // Generic error handling
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
      }

      // Use OpenAI for other sections
      console.log(`Using OpenAI API for ${section}`);
      
      try {
        // Set a timeout for the API call to prevent Netlify function timeouts
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('API request timed out')), 8000)
        );
        
        const apiCallPromise = openai.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are a professional Female game reviewer providing accurate information about video games. When writing full reviews, incorporate SEO best practices by naturally weaving in relevant keywords about the game's genre, platform, key features, and target audience throughout the text. However, never explicitly mention SEO or keywords in the review content itself."
            },
            {
              role: "user",
              content: prompts[section]
            }
          ],
          model: "gpt-4o-mini",
          temperature: 0.7,
          max_tokens: section === 'fullReview' ? 3000 : 4000, // Reduce tokens for full review to avoid timeouts
          response_format: { type: "text" },
        });
        
        // Race the API call against the timeout
        const completion = await Promise.race([apiCallPromise, timeoutPromise]);

        const response = completion.choices[0].message.content;
        console.log(`OpenAI response received, length: ${response?.length || 0}`);
        
        // For sections that expect JSON, parse the response
        if (section === "prosAndCons") {
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
            return {
              statusCode: 500,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ [section]: null })
            };
          }
        }

        // For text sections, return as is
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [section]: response })
        };
      } catch (error) {
        console.error(`OpenAI API error for ${section}:`, error);
        
        // Return a more specific error for timeouts
        if (error.message === 'API request timed out') {
          return {
            statusCode: 504,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              error: 'API request timed out',
              message: 'The request to the AI service took too long and timed out',
              section: section
            })
          };
        }
        
        // Generic error handling
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
      console.error('Error in AI request:', error);
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
    console.error('Error in game-info function:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to generate game info',
        message: error.message
      })
    };
  }
};

