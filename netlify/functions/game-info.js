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
          const completion = await perplexity.chat.completions.create({
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
        // Special handling for fullReview to ensure it doesn't timeout
        if (section === 'fullReview') {
          console.log('Using parallel chunked approach for fullReview to avoid timeouts');
          
          // Define each section based on the original prompt structure
          const sectionPrompts = [
            {
              section: "introduction",
              prompt: `Write an engaging introduction (2-3 paragraphs) for a review of ${gameTitle} from the perspective of a female game reviewer from England. Include the game's genre, platform, and key features. Hook the reader with your initial impressions and what makes this game noteworthy.
              
              Start with a greeting like "Right, ladies" or "Alright, ladies" as this will be the beginning of the review.`
            },
            {
              section: "gameplay",
              prompt: `Write about the gameplay experience (2-3 paragraphs) for ${gameTitle}. Discuss core mechanics, controls, and overall feel. Share personal experiences and memorable moments to make the review relatable and authentic. 
              
              IMPORTANT: This is the second section of a review that has already begun. DO NOT start with "Alright, ladies" or any other greeting. DO NOT introduce the game again. Begin as if continuing a conversation already in progress.`
            },
            {
              section: "story",
              prompt: `Write about the story and narrative elements (2-3 paragraphs) of ${gameTitle}. Explore the game's story, characters, and narrative elements without spoiling key plot points.
              
              IMPORTANT: This is the middle section of a review that has already covered the introduction and gameplay. DO NOT start with "Alright, ladies" or any other greeting. DO NOT reintroduce the game. Begin as if continuing directly from a previous section about gameplay.`
            },
            {
              section: "presentation",
              prompt: `Write about the graphics and sound (2-3 paragraphs) of ${gameTitle}. Highlight standout elements and areas for improvement.
              
              IMPORTANT: This is a continuation of an ongoing review. DO NOT start with "Alright, ladies" or any other greeting. DO NOT reintroduce the game. Begin as if continuing directly from previous sections about gameplay and story.`
            },
            {
              section: "audience",
              prompt: `Write about the target audience (1-2 paragraphs) for ${gameTitle}. Share insights on why this game particularly resonates with female gamers. Discuss specific features and elements that make it appealing.
              
              IMPORTANT: This is a continuation of an ongoing review. DO NOT start with "Alright, ladies" or any other greeting. DO NOT reintroduce the game. Begin as if continuing directly from previous sections.`
            },
            {
              section: "conclusion",
              prompt: `Write a conclusion (2-3 paragraphs) for ${gameTitle} with an overall rating and recommendation. Explain your reasoning and specify who would enjoy this game most.
              
              IMPORTANT: This is the final section of an ongoing review. You may begin with a phrase like "To wrap things up" or similar, but DO NOT start with "Alright, ladies" or reintroduce the game. End with a catchy closing line that a female reviewer from England might use.`
            }
          ];
          
          // Generate each section in parallel for speed
          console.log('Generating all sections in parallel for speed');
          const results = await Promise.all(sectionPrompts.map(async (sectionPrompt) => {
            console.log(`Generating ${sectionPrompt.section} section for fullReview`);
            
            // Add retry logic with exponential backoff
            let retryCount = 0;
            const maxRetries = 3;
            
            while (retryCount <= maxRetries) {
              try {
                if (retryCount > 0) {
                  console.log(`Retry ${retryCount}/${maxRetries} for ${sectionPrompt.section} section`);
                }
                
                const completion = await openai.chat.completions.create({
                  messages: [
                    {
                      role: "system",
                      content: `You are a professional female game reviewer from England writing for a female audience. Write in an engaging, conversational tone. This is for the ${sectionPrompt.section} section of a game review about ${gameTitle}.
                      
                      IMPORTANT CONTEXT: This is part of a multi-section review where each section will be combined into a single cohesive review:
                      - Introduction: Sets up the review with "Alright, ladies" and introduces the game
                      - Gameplay: Continues the review (no greeting, no reintroduction)
                      - Story: Continues about narrative (no greeting, no reintroduction)
                      - Presentation: Continues about graphics/sound (no greeting, no reintroduction)
                      - Audience: Continues about who would enjoy it (no greeting, no reintroduction)
                      - Conclusion: Wraps everything up (no greeting, no reintroduction)
                      
                      Write ONLY your assigned section (${sectionPrompt.section}) in a way that flows naturally when combined with the others.
                      
                      Example tone (adapt to fit the specific game):
                      "This brilliant little gem has completely stolen my heart. From the charming visuals to the addictive gameplay, it's a must-have for any fan of the genre."`
                    },
                    {
                      role: "user",
                      content: sectionPrompt.prompt
                    }
                  ],
                  model: "gpt-4o-mini",
                  temperature: 0.7,
                  max_tokens: 800,
                  response_format: { type: "text" },
                });
                
                // If successful, return the content
                return completion.choices[0].message.content;
              } catch (error) {
                console.error(`Error generating ${sectionPrompt.section} section (attempt ${retryCount+1}/${maxRetries+1}):`, error);
                
                // Check if we should retry
                retryCount++;
                
                if (retryCount <= maxRetries) {
                  // Exponential backoff: 2^retry * 500ms (0.5s, 1s, 2s)
                  const backoffTime = Math.pow(2, retryCount) * 500;
                  console.log(`Retrying ${sectionPrompt.section} section in ${backoffTime}ms...`);
                  await new Promise(resolve => setTimeout(resolve, backoffTime));
                } else {
                  // All retries exhausted
                  return `[Error generating ${sectionPrompt.section} section. Please try again.]`;
                }
              }
            }
          }));
          
          // Combine all sections into a full review with subtle section transitions
          const sectionsWithHeaders = [
            results[0], // Introduction (no header needed)
            "\n\n" + results[1], // Gameplay 
            "\n\n" + results[2], // Story
            "\n\n" + results[3], // Presentation
            "\n\n" + results[4], // Audience
            "\n\n" + results[5]  // Conclusion
          ];
          const combinedReview = sectionsWithHeaders.join('');
          console.log(`Full review generated, total length: ${combinedReview.length}`);
          
          // Check if too many sections failed
          const failedSectionCount = results.filter(section => 
            section && section.includes('[Error generating')).length;
          
          // If more than 1 section failed, try a fallback approach with a single API call
          if (failedSectionCount > 1) {
            console.log(`${failedSectionCount} sections failed. Attempting fallback with single API call...`);
            
            try {
              const fallbackCompletion = await openai.chat.completions.create({
                messages: [
                  {
                    role: "system",
                    content: `You are a professional female game reviewer from England writing for a female audience. Write in an engaging, conversational tone. Create a complete game review for ${gameTitle}.
                    
                    Format your review with these sections:
                    1. Introduction with a greeting like "Alright, ladies"
                    2. Gameplay section
                    3. Story section
                    4. Presentation section (graphics/sound)
                    5. Target audience section
                    6. Conclusion with recommendation
                    
                    Keep the review concise but informative.`
                  },
                  {
                    role: "user",
                    content: `Write a complete review for ${gameTitle}. Start with "Alright, ladies" and structure it to cover gameplay, story, presentation, who would enjoy it, and end with your recommendation. Keep it authentic and conversational as if you're speaking directly to your audience.`
                  }
                ],
                model: "gpt-4o-mini",
                temperature: 0.7,
                max_tokens: 3000,
                response_format: { type: "text" },
              });
              
              const fallbackReview = fallbackCompletion.choices[0].message.content;
              console.log(`Generated fallback review, length: ${fallbackReview.length}`);
              
              // Use the fallback review if it's reasonably long (>500 characters)
              if (fallbackReview && fallbackReview.length > 500) {
                return {
                  statusCode: 200,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ fullReview: fallbackReview })
                };
              }
            } catch (fallbackError) {
              console.error('Error generating fallback review:', fallbackError);
              // Continue with the original combined review even if it has errors
            }
          }
          
          // Return the original combined review (either if fallback wasn't needed or fallback also failed)
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullReview: combinedReview })
          };
        }
        
        // Normal handling for other sections
        const completion = await openai.chat.completions.create({
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
          max_tokens: 4000,
          response_format: { type: "text" },
        });

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

