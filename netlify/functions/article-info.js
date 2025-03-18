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
      
      tldr: `Create a concise TL;DR (Too Long; Didn't Read) summary for a gaming article. This should capture the key points in 2-3 sentences max.`
    };

    // Special handling for content generation to avoid timeout
    if (section === 'content') {
      console.log('Using parallel chunked approach for article content to avoid timeouts');
      
      // Use the article title in the prompts if available
      const topicDescription = articleTitle ? 
        `about "${articleTitle}"` : 
        "about gaming";
      
      // Define each section of the article
      const sectionPrompts = [
        {
          section: "introduction",
          prompt: `Write an engaging introduction (2 paragraphs) for a gaming article ${topicDescription}. Hook the reader with interesting facts, questions, or statements that make them want to continue reading. Introduce the main topic and why it matters to gamers.`
        },
        {
          section: "mainPoint1",
          prompt: `Write the first main section (2-3 paragraphs) for a gaming article ${topicDescription}. This should explore the first major point or aspect of the topic in detail. Include specific examples, insights, or analysis that would be valuable to gamers.
          
          IMPORTANT: This is the second section of an article that has already begun. DO NOT reintroduce the topic. Begin as if continuing from the introduction.`
        },
        {
          section: "mainPoint2",
          prompt: `Write the second main section (2-3 paragraphs) for a gaming article ${topicDescription}. This should explore another major aspect of the topic with supporting details and examples. Consider addressing common questions or misconceptions related to this aspect.
          
          IMPORTANT: This is a continuation of an ongoing article. DO NOT reintroduce the topic. Begin as if continuing directly from the previous section.`
        },
        {
          section: "mainPoint3",
          prompt: `Write the third main section (2-3 paragraphs) for a gaming article ${topicDescription}. This should cover a final major point, perspective, or aspect of the topic. Include practical tips, insights, or future trends if relevant.
          
          IMPORTANT: This is a continuation of an ongoing article. DO NOT reintroduce the topic. Begin as if continuing directly from previous sections.`
        },
        {
          section: "conclusion",
          prompt: `Write a conclusion (1-2 paragraphs) for a gaming article ${topicDescription}. Summarize the key points discussed in the article and end with a thought-provoking statement, call to action, or forward-looking perspective that leaves readers satisfied.
          
          IMPORTANT: This is the final section of an ongoing article. DO NOT reintroduce the topic. Begin as if wrapping up all previous sections.`
        }
      ];
      
      // Generate each section in parallel for speed
      console.log('Generating all article sections in parallel');
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
                  content: `You are a professional gaming writer and journalist who specializes in creating engaging content for game enthusiasts. This is for the ${sectionPrompt.section} section of an article ${topicDescription}.
                  
                  IMPORTANT CONTEXT: This is part of a multi-section article where each section will be combined into a single cohesive piece:
                  - Introduction: Sets up the article and introduces the topic
                  - Main Point 1: Explores the first major aspect (no reintroduction)
                  - Main Point 2: Explores the second major aspect (no reintroduction)
                  - Main Point 3: Explores the final major aspect (no reintroduction)
                  - Conclusion: Wraps everything up (no reintroduction)
                  
                  Write ONLY your assigned section (${sectionPrompt.section}) in a way that flows naturally when combined with the others. Use markdown formatting for headings and other elements.`
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
      
      // Combine all sections into a full article with proper markdown formatting
      const sectionsWithHeaders = [
        results[0], // Introduction (no header needed)
        "\n\n## " + (articleTitle ? articleTitle.split(' ').slice(0, 3).join(' ') : "Key Insights") + "\n\n" + results[1], // Main Point 1
        "\n\n## The Details\n\n" + results[2], // Main Point 2
        "\n\n## " + (articleTitle ? "Why " + articleTitle.split(' ').slice(0, 2).join(' ') + " Matters" : "Why This Matters") + "\n\n" + results[3], // Main Point 3
        "\n\n## Wrapping Up\n\n" + results[4]  // Conclusion
      ];
      const combinedContent = sectionsWithHeaders.join('');
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
                content: `You are a professional gaming writer and journalist creating an article ${topicDescription}. Write a complete, well-structured article using markdown formatting.`
              },
              {
                role: "user",
                content: `Write a complete article ${topicDescription}. Structure it with a clear introduction, 3-4 main sections with headings, and a conclusion. Use markdown formatting for headings and other elements. The article should be informative yet engaging, with a total length of approximately 800-1000 words.`
              }
            ],
            model: "gpt-4o-mini",
            temperature: 0.7,
            max_tokens: 3000,
            response_format: { type: "text" },
          });
          
          const fallbackContent = fallbackCompletion.choices[0].message.content;
          console.log(`Generated fallback article content, length: ${fallbackContent.length}`);
          
          // Use the fallback content if it's reasonably long (>400 characters)
          if (fallbackContent && fallbackContent.length > 400) {
            return {
              statusCode: 200,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: fallbackContent })
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
        body: JSON.stringify({ content: combinedContent })
      };
    }

    // If we have an article title, include it in the prompts for non-content sections
    if (articleTitle) {
      prompts.title = `The gaming article is about "${articleTitle}". Generate an engaging and SEO-friendly title for this article. The title should be catchy and appealing to gamers. Keep it under 10 words.`;
      
      prompts.summary = `The gaming article is about "${articleTitle}". Write a compelling summary for this gaming article. This summary will appear as a preview on the website and should hook readers. Keep it under 50 words and make it engaging.`;
      
      prompts.tldr = `Create a concise TL;DR (Too Long; Didn't Read) summary for a gaming article about "${articleTitle}". This should capture the key points in 2-3 sentences max.`;
    }

    // Normal handling for other sections (title, summary, tldr)
    if (section !== 'content') {
      // Add retry logic for other sections too
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount <= maxRetries) {
        try {
          if (retryCount > 0) {
            console.log(`Retry ${retryCount}/${maxRetries} for ${section} section`);
          }
          
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
          console.error(`Error generating ${section} (attempt ${retryCount+1}/${maxRetries+1}):`, error);
          
          // Check if we should retry
          retryCount++;
          
          if (retryCount <= maxRetries) {
            // Exponential backoff: 2^retry * 500ms (0.5s, 1s, 2s)
            const backoffTime = Math.pow(2, retryCount) * 500;
            console.log(`Retrying ${section} in ${backoffTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
          } else {
            // All retries exhausted
            throw error; // Rethrow to be caught by the outer try/catch
          }
        }
      }
    }
  } catch (error) {
    console.error('Error generating article info:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Something went wrong' })
    };
  }
}; 