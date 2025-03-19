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
      titleAndSummary: `Create a viral, SEO-optimized title and summary for an article about ${title} targeting female gamers.

      TITLE GUIDELINES:
      - Use proven formulas: "Why X Changes Everything", "What X Reveals About Y"
      - Focus on revelations: "The Truth Behind", "What Players Discovered"
      - Add emotional triggers: "Shocking", "Game-Changing", "Mind-Blowing"
      - Use power words: "Ultimate", "Essential", "Revolutionary"
      - Create curiosity gaps that demand clicks
      - Keep it under 60 characters for SEO
      - Make bold claims backed by content
      
      SUMMARY GUIDELINES:
      - Open with a shocking stat or claim
      - Tease exclusive insights
      - Promise valuable takeaways
      - End with clear FOMO
      - Keep it under 155 characters for SEO

      Example High-Performance Titles:
      - "The Hidden Truth Behind Gaming's Most Controversial Trend"
      - "Why This Indie Game's Success Has Developers Worried"
      - "What Elden Ring Really Reveals About Modern Gaming"
      
      Format:
      {
        "title": "Your viral title here",
        "summary": "Your SEO-optimized summary that creates intense curiosity and promises value"
      }`,
      
      imageQuery: `Create a concise 2-3 word search term to find a header image for "${title}". Focus on the main subject or visual element.

      RULES:
      - Maximum 3 words
      - No articles (a, an, the)
      - No filler words
      - Focus on visual elements
      
      Examples:
      For "Why Elden Ring's Difficulty Sparked Debate":
      → "Elden Ring boss"
      
      For "The Hidden Psychology Behind Roguelike Addiction":
      → "roguelike gaming setup"
      
      For "What Starfield's Launch Reveals About Modern Gaming":
      → "Starfield exploration"`,
      
      tldr: `Write a TL;DR (Too Long; Didn't Read) summary for an article about ${title}. This should be a concise 1-2 sentence takeaway that captures the essence of what would be in a full article about this topic.`,
      
      content: `Write an engaging article about ${title} for a female gaming audience. The article should be informative, conversational in tone, and include relevant insights, examples, and perspectives.`
    };
    
    try {
      console.log(`Processing ${section} for article: ${title}`);
      
      // Use OpenAI for all sections including titleAndSummary
      if (section === 'titleAndSummary') {
        console.log(`Using GPT-4o-mini for ${section}`);
        const completion = await openai.chat.completions.create({
          messages: [
            {
              role: "system",
              content: `You are an expert gaming content strategist specializing in viral, SEO-optimized content. You create titles that dominate search rankings and social shares while maintaining credibility. Your content consistently achieves:
- High CTR on Google and social media
- Strong engagement from female gamers
- Viral sharing potential
- Top search rankings for gaming terms
- Perfect balance of intrigue and value`
            },
            {
              role: "user",
              content: prompts[section]
            }
          ],
          model: "gpt-4o-mini",
          temperature: 0.8,
          max_tokens: 500,
          response_format: { type: "text" }
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
      
      // Special handling for content to use chunking approach similar to reviews
      if (section === 'content') {
        console.log('Using parallel chunked approach for article content to avoid timeouts');
        
        // Define each section based on the article structure
        const sectionPrompts = [
          {
            section: "introduction",
            prompt: `Write an engaging introduction (2 paragraphs) for an article about ${title} for a female gaming audience. Hook the reader with compelling information and set up what the article will discuss. Include relevant gaming context and why this topic matters to female gamers specifically.`
          },
          {
            section: "mainPoints1",
            prompt: `Write the first part of the main body (2 paragraphs) for an article about ${title}. Focus on the first key points and examples.
            
            IMPORTANT: This is the second section of an article that has already begun. DO NOT start with any introduction or greeting. DO NOT reintroduce the topic. Begin as if continuing seamlessly from the introduction section.`
          },
          {
            section: "mainPoints2",
            prompt: `Write the second part of the main body (2 paragraphs) for an article about ${title}. Focus on additional key points and insights.
            
            IMPORTANT: This is a continuation of an article that has already covered the introduction and first main points. DO NOT start with any introduction. DO NOT reintroduce the topic. Begin as if continuing directly from the previous section.`
          },
          {
            section: "analysis1",
            prompt: `Write the first analysis section (2 paragraphs) for an article about ${title}. Discuss initial implications and insights about the topic as it relates to gaming and female gamers' experiences.
            
            IMPORTANT: This is a continuation of an ongoing article. DO NOT start with any introduction. DO NOT reintroduce the topic. Begin as if continuing from the main points section.`
          },
          {
            section: "analysis2",
            prompt: `Write the second analysis section (2 paragraphs) for an article about ${title}. Discuss additional patterns or deeper insights about the topic.
            
            IMPORTANT: This is a continuation of an ongoing article. DO NOT start with any introduction. DO NOT reintroduce the topic. Begin as if continuing from the previous analysis section.`
          },
          {
            section: "conclusion",
            prompt: `Write a conclusion (2 paragraphs) for an article about ${title}. Summarize key points and end with a thought-provoking statement or call to action that would resonate with female gamers.
            
            IMPORTANT: This is the final section of an ongoing article. You may begin with a phrase like "In conclusion" or "To wrap things up", but DO NOT reintroduce the topic. End with a memorable closing statement.`
          }
        ];
        
        // Generate each section in parallel for speed
        console.log('Generating all sections in parallel for speed');
        const results = await Promise.all(sectionPrompts.map(async (sectionPrompt) => {
          console.log(`Generating ${sectionPrompt.section} section for article content`);
          
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
                    content: `You are a professional content writer for a female-focused gaming website. You specialize in creating engaging articles about video games, gaming culture, and the gaming industry specifically for female gamers. This is for the ${sectionPrompt.section} section of an article about ${title}.
                    
                    IMPORTANT CONTEXT: This is part of a multi-section article where each section will be combined into a single cohesive piece:
                    - Introduction: Sets up the article and hooks the reader
                    - Main Points (Part 1): First key points and examples
                    - Main Points (Part 2): Additional key points
                    - Analysis (Part 1): Initial implications and insights
                    - Analysis (Part 2): Additional patterns and deeper insights
                    - Conclusion: Wraps everything up
                    
                    Write ONLY your assigned section (${sectionPrompt.section}) in a way that flows naturally when combined with the others.`
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
        
        // Combine all sections into a full article
        const sectionsWithFormatting = [
          results[0], // Introduction
          "\n\n" + results[1], // Main Points 1
          "\n\n" + results[2], // Main Points 2
          "\n\n" + results[3], // Analysis 1
          "\n\n" + results[4], // Analysis 2
          "\n\n" + results[5]  // Conclusion
        ];
        const combinedContent = sectionsWithFormatting.join('');
        console.log(`Full article content generated, total length: ${combinedContent.length}`);
        
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
                  content: `You are a professional content writer for a female-focused gaming website. You specialize in creating engaging articles about video games, gaming culture, and the gaming industry specifically for female gamers. Create a complete article about ${title}.
                  
                  Structure your article with these sections:
                  1. Introduction (hook and context)
                  2. Main points and examples
                  3. Analysis and implications
                  4. Conclusion with call to action
                  
                  Keep the article informative but engaging, written specifically for female gamers.`
                },
                {
                  role: "user",
                  content: `Write a complete article about ${title}. Structure it to cover the main points, analysis, and end with a strong conclusion. Keep it authentic and engaging, written specifically for female gamers.`
                }
              ],
              model: "gpt-4o-mini",
              temperature: 0.7,
              max_tokens: 3000,
              response_format: { type: "text" },
            });
            
            const fallbackContent = fallbackCompletion.choices[0].message.content;
            console.log(`Generated fallback content, length: ${fallbackContent.length}`);
            
            // Use the fallback content if it's reasonably long (>500 characters)
            if (fallbackContent && fallbackContent.length > 500) {
              return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: fallbackContent })
              };
            }
          } catch (fallbackError) {
            console.error('Error generating fallback content:', fallbackError);
            // Continue with the original combined content even if it has errors
          }
        }
        
        // Return the original combined content (either if fallback wasn't needed or fallback also failed)
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: combinedContent })
        };
      }
      
      // Use Perplexity only for imageQuery, OpenAI for everything else
      if (section === 'imageQuery') {
        console.log(`Using Perplexity API for image search query generation`);
        const completion = await perplexity.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are an image search specialist. Return ONLY 2-3 words that would make a good image search term. No explanations, just the words."
            },
            {
              role: "user",
              content: prompts[section]
            }
          ],
          model: "sonar-pro",
          temperature: 0.3,
          max_tokens: 50
        });
        
        const response = completion.choices[0].message.content.trim();
        console.log(`Generated image search query: "${response}"`);
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [section]: response })
        };
      }

      // Use OpenAI for all other sections
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
        model: "gpt-4o",
        temperature: 0.7,
        max_tokens: 500
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