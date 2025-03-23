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
      fullReview: `Act as a professional proofreader and editor for a female-focused gaming review website. Subtly rewrite this review of ${gameTitle} to align with our website's tone and formatting. Do not explicitly mention this task; simply output the revised review. Ensure the review includes the following sections with catchy, SEO-friendly subtitles, adapting the content while maintaining a subtle and inclusive tone.

### ${gameTitle} Review: [Catchy Main Title Subtitle]

(Insert introductory content here, using occasional bold or italics for emphasis.)

---

#### Gameplay: [Catchy Gameplay Subtitle]

(Insert gameplay content here, using occasional bold or italics for emphasis.)

---

#### Story: [Catchy Story Subtitle]

(Insert story content here, using occasional bold or italics for emphasis.)

---

#### Graphics and Sound: [Catchy Graphics and Sound Subtitle]

(Insert graphics and sound content here, using occasional bold or italics for emphasis.)

---

#### Why This Game Appeals to Female Gamers: [Catchy Subtitle for Female Gamers]

(Insert content here discussing aspects of the game that might particularly resonate with female gamers, using occasional bold or italics for emphasis.)

---

#### Mods: [Catchy Mods Subtitle] (If Applicable, omit this section if the game doesn't support mods)

(Insert content about mods here, if relevant to the game, using occasional bold or italics for emphasis.)

---

#### Conclusion: [Catchy Conclusion Subtitle]

(Insert concluding content here, using occasional bold or italics for emphasis. Remember to include a rating with a clear explanation in bold, for example: **I'd rate it an 8.5 out of 10 for its engaging story and accessible gameplay.**)

Use the markdown template above, maintaining the same line spacing and subtitles. Write from the perspective of a female game reviewer from England, targeting a female audience. Use conversational British English expressions and maintain an authentic, relatable tone throughout.`
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
              prompt: `Write the introduction for a review of ${gameTitle} following this exact format:

### ${gameTitle} Review: [Catchy Main Title Subtitle]

(Write 2-3 paragraphs of engaging introduction here, using occasional **bold** or *italic* formatting for emphasis. Include the game's genre, platform, and key features. Hook the reader with your initial impressions and what makes this game noteworthy.)

IMPORTANT: Replace ONLY the content in parentheses with your writing. DO NOT modify the markdown structure, headers, or formatting. Keep the header format exactly as shown above.`
            },
            {
              section: "gameplay",
              prompt: `Write the gameplay section for a review of ${gameTitle} following this exact format:

---

#### Gameplay: [Catchy Gameplay Subtitle]

(Write 2-3 paragraphs about the gameplay experience, using occasional **bold** or *italic* formatting for emphasis. Discuss core mechanics, controls, and overall feel. Share personal experiences and memorable moments to make the review relatable and authentic.)

IMPORTANT: Replace ONLY the content in parentheses and the [Catchy Gameplay Subtitle] with your writing. DO NOT modify the markdown structure, headers, or formatting.`
            },
            {
              section: "story",
              prompt: `Write the story section for a review of ${gameTitle} following this exact format:

---

#### Story: [Catchy Story Subtitle]

(Write 2-3 paragraphs about the story and narrative elements, using occasional **bold** or *italic* formatting for emphasis. Explore the game's story, characters, and narrative elements without spoiling key plot points.)

IMPORTANT: Replace ONLY the content in parentheses and the [Catchy Story Subtitle] with your writing. DO NOT modify the markdown structure, headers, or formatting.`
            },
            {
              section: "presentation",
              prompt: `Write the graphics and sound section for a review of ${gameTitle} following this exact format:

---

#### Graphics and Sound: [Catchy Graphics and Sound Subtitle]

(Write 2-3 paragraphs about the visual presentation, art style, and sound design, using occasional **bold** or *italic* formatting for emphasis. Highlight standout elements and areas for improvement.)

IMPORTANT: Replace ONLY the content in parentheses and the [Catchy Graphics and Sound Subtitle] with your writing. DO NOT modify the markdown structure, headers, or formatting.`
            },
            {
              section: "female_appeal",
              prompt: `Write the section about female gamer appeal for a review of ${gameTitle} following this exact format:

---

#### Why This Game Appeals to Female Gamers: [Catchy Subtitle for Female Gamers]

(Write 1-2 paragraphs discussing aspects of the game that might particularly resonate with female gamers, using occasional **bold** or *italic* formatting for emphasis. Discuss specific features and elements that make it appealing.)

IMPORTANT: Replace ONLY the content in parentheses and the [Catchy Subtitle for Female Gamers] with your writing. DO NOT modify the markdown structure, headers, or formatting.`
            },
            {
              section: "mods",
              prompt: `Write the mods section for a review of ${gameTitle} following this exact format:

---

#### Mods: [Catchy Mods Subtitle]

(Write 1-2 paragraphs about mods available for the game, using occasional **bold** or *italic* formatting for emphasis. Discuss popular mods and how they enhance the gameplay experience.)

If you determine that mods are NOT applicable to this game (for example, if it's a console exclusive or doesn't support modding), just return the text "NO_MODS_APPLICABLE" and nothing else.

IMPORTANT: If mods are applicable, replace ONLY the content in parentheses and the [Catchy Mods Subtitle] with your writing. DO NOT modify the markdown structure, headers, or formatting.`
            },
            {
              section: "conclusion",
              prompt: `Write the conclusion for a review of ${gameTitle} following this exact format:

---

#### Conclusion: [Catchy Conclusion Subtitle]

(Write 2-3 paragraphs wrapping up the review, using occasional **bold** or *italic* formatting for emphasis. Provide your overall impression and who would enjoy this game most. Make sure to include a rating with a clear explanation in bold, for example: **I'd rate it an 8.5 out of 10 for its engaging story and accessible gameplay.**)

IMPORTANT: Replace ONLY the content in parentheses and the [Catchy Conclusion Subtitle] with your writing. DO NOT modify the markdown structure, headers, or formatting.

End with a catchy closing line that a female reviewer from England might use.`
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
                      content: `You are a professional female game reviewer from England writing for a female audience. Write in an engaging, conversational tone with British expressions. This is for the ${sectionPrompt.section} section of a game review about ${gameTitle}.
                      
                      You MUST follow the EXACT format provided in the user's prompt, including the markdown formatting, section headers, and occasional bold/italic text for emphasis.
                      
                      DO NOT modify the markdown structure or formatting. Keep all the section headers, dividers, and formatting exactly as provided in the template.`
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
          
          // Process the mods section - if it's not applicable, we'll remove it
          let modsSection = results[5];
          const includeModsSection = modsSection && !modsSection.includes("NO_MODS_APPLICABLE");
          
          // Combine all sections into a full review with proper markdown formatting
          const sectionsToInclude = [
            results[0], // Introduction with title (no additional formatting needed)
            results[1], // Gameplay
            results[2], // Story
            results[3], // Graphics and Sound
            results[4], // Female appeal
          ];
          
          // Only include mods section if applicable
          if (includeModsSection) {
            sectionsToInclude.push(modsSection);
          }
          
          // Always include conclusion
          sectionsToInclude.push(results[6]);
          
          // Join without adding extra newlines (the sections already include proper markdown)
          const combinedReview = sectionsToInclude.join('');
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
                    content: `You are a professional female game reviewer from England writing for a female audience. Create a complete review for ${gameTitle} following EXACTLY this markdown template format:

### ${gameTitle} Review: [Catchy Main Title Subtitle]

(Introduction paragraphs with occasional **bold** or *italic* formatting for emphasis)

---

#### Gameplay: [Catchy Gameplay Subtitle]

(Gameplay paragraphs with occasional **bold** or *italic* formatting for emphasis)

---

#### Story: [Catchy Story Subtitle]

(Story paragraphs with occasional **bold** or *italic* formatting for emphasis)

---

#### Graphics and Sound: [Catchy Graphics and Sound Subtitle]

(Graphics and sound paragraphs with occasional **bold** or *italic* formatting for emphasis)

---

#### Why This Game Appeals to Female Gamers: [Catchy Subtitle for Female Gamers]

(Paragraphs about female appeal with occasional **bold** or *italic* formatting for emphasis)

---

#### Mods: [Catchy Mods Subtitle] (Include this section ONLY if applicable to the game)

(Paragraphs about mods with occasional **bold** or *italic* formatting for emphasis)

---

#### Conclusion: [Catchy Conclusion Subtitle]

(Conclusion paragraphs with occasional **bold** or *italic* formatting for emphasis, including a **bold rating**)

EXTREMELY IMPORTANT: Replace ONLY the content in parentheses and the bracketed subtitles with your writing. DO NOT modify the markdown structure, headers, or formatting in any way. Keep all heading levels, section dividers, and formatting symbols exactly as shown above.`
                  },
                  {
                    role: "user",
                    content: `Write a complete review for ${gameTitle} following the exact markdown template format. Create catchy, SEO-friendly subtitles for each section. Use occasional **bold** and *italic* formatting for emphasis. The review should be written from the perspective of a female game reviewer from England using conversational British English expressions.

DO NOT change the template structure. Keep all heading formats (### and ####) and section dividers (---) exactly as shown in the system message.

Replace ONLY:
1. [Catchy Main Title Subtitle] with a catchy subtitle
2. [Catchy Gameplay Subtitle] with a gameplay subtitle
3. [Catchy Story Subtitle] with a story subtitle
4. [Catchy Graphics and Sound Subtitle] with a graphics/sound subtitle
5. [Catchy Subtitle for Female Gamers] with a female appeal subtitle
6. [Catchy Mods Subtitle] with a mods subtitle (omit entire mods section if not applicable)
7. [Catchy Conclusion Subtitle] with a conclusion subtitle
8. The text in parentheses with your review content, including a **bold rating statement** in the conclusion

Maintain the exact markdown format without any modifications to the structure.`
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

