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
      titleAndSummary: `Create a catchy title and an engaging summary for an article about ${title} for a female gaming audience. The summary should be 2-3 sentences that hook the reader.

      Return your response in JSON format with the following structure:
      {
        "title": "The catchy title here",
        "summary": "The engaging summary here"
      }`,
      
      imageQuery: `Create a search query to find a compelling header image for an article titled "${title}" about gaming. The query should be specific enough to find relevant images but broad enough to return good results.`,
      
      tldr: `Write a TL;DR (Too Long; Didn't Read) summary for an article about ${title}. This should be a concise 1-2 sentence takeaway that captures the essence of what would be in a full article about this topic.`,
      
      content: `Write an engaging article about ${title} for a female gaming audience. The article should be informative, conversational in tone, and include relevant insights, examples, and perspectives.`
    };
    
    try {
      console.log(`Processing ${section} for article: ${title}`);
      
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
      
      // Special handling for content to use chunking approach similar to reviews
      if (section === 'content') {
        console.log('Using parallel chunked approach for article content to avoid timeouts');
        
        // Define each section based on the article structure
        const sectionPrompts = [
          {
            section: "introduction",
            prompt: `Write an engaging introduction (2-3 paragraphs) for an article about ${title} for a female gaming audience. Hook the reader with compelling information and set up what the article will discuss. Include relevant gaming context and why this topic matters to female gamers specifically.`
          },
          {
            section: "mainPoints",
            prompt: `Write the main body (3-4 paragraphs) for an article about ${title}. This section should contain the key information, examples, and insights. Include specific gaming references and perspectives that would resonate with female gamers.
            
            IMPORTANT: This is the second section of an article that has already begun with an introduction. DO NOT start with any introduction or greeting. DO NOT reintroduce the topic. Begin as if continuing seamlessly from the introduction section, with transitional phrasing that connects to the previous content.`
          },
          {
            section: "analysis",
            prompt: `Write an analysis section (2-3 paragraphs) for an article about ${title}. Discuss implications, patterns, or deeper insights about the topic as it relates to gaming and female gamers' experiences.
            
            IMPORTANT: This is the middle section of an article that has already covered the introduction and main points. DO NOT start with any introduction or greeting. DO NOT reintroduce the topic. Begin as if continuing directly from previous sections about the main points of ${title}, with transitional phrasing that connects to what came before.`
          },
          {
            section: "conclusion",
            prompt: `Write a conclusion (1-2 paragraphs) for an article about ${title}. Summarize key points and end with a thought-provoking statement or call to action that would resonate with female gamers.
            
            IMPORTANT: This is the final section of an ongoing article. You may begin with a phrase like "In conclusion" or "To wrap things up", but DO NOT reintroduce the topic or summarize the entire article again. End with a memorable closing statement that a female gaming writer might use.`
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
                    - Main Points: Continues the article (no introduction, no restatement of topic)
                    - Analysis: Continues with deeper perspectives (no introduction, no restatement of topic)
                    - Conclusion: Wraps everything up (may begin with "In conclusion" but no reintroduction)
                    
                    Write ONLY your assigned section (${sectionPrompt.section}) in a way that flows naturally when combined with the others. Use consistent voice and tone throughout.
                    
                    Example tone (adapt to fit the specific topic):
                    "The gaming industry's shift toward more diverse representation isn't just a trend—it's a vital evolution that's changing how games are made and who they're made for. As female gamers, we've seen firsthand how this transformation is creating more meaningful and authentic experiences."`
                  },
                  {
                    role: "user",
                    content: sectionPrompt.prompt
                  }
                ],
                model: "gpt-4o",
                temperature: 0.7,
                max_tokens: 1200,
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
        
        // Combine all sections into a full article with markdown formatting
        const sectionsWithFormatting = [
          results[0], // Introduction (no header needed)
          "\n\n" + results[1], // Main Points 
          "\n\n" + results[2], // Analysis
          "\n\n" + results[3]  // Conclusion
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
                  content: `You are a professional content writer for a female-focused gaming website. You specialize in creating engaging articles about video games, gaming culture, and the gaming industry specifically for female gamers.`
                },
                {
                  role: "user",
                  content: `Write a complete article about ${title} for a female gaming audience. The article should include:
                  1. An engaging introduction that hooks the reader
                  2. Main points with key information and insights about ${title}
                  3. An analysis with deeper perspectives on the topic
                  4. A conclusion with a memorable ending
                  
                  The article should be written in a consistent, flowing style that reads as a single cohesive piece rather than disjointed sections. Use a conversational but professional tone throughout.`
                }
              ],
              model: "gpt-4o",
              temperature: 0.7,
              max_tokens: 4000,
            });
            
            const fallbackContent = fallbackCompletion.choices[0].message.content;
            console.log(`Generated fallback article content, length: ${fallbackContent.length}`);
            
            // Use the fallback content if it's reasonably long (>500 characters)
            if (fallbackContent && fallbackContent.length > 500) {
              return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: fallbackContent.trim() })
              };
            }
          } catch (fallbackError) {
            console.error('Error generating fallback article content:', fallbackError);
            // Continue with the original combined content even if it has errors
          }
        }
        
        // Return the original combined content
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: combinedContent.trim() })
        };
      }
      
      // Use OpenAI for the other sections (imageQuery and tldr)
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