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