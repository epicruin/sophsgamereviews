const OpenAI = require('openai');

exports.handler = async function(event, context) {
  // Log incoming request for debugging
  console.log('Chat function invoked');
  console.log('HTTP Method:', event.httpMethod);
  console.log('Environment variables check:');
  console.log('- OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
  console.log('- PERPLEXITY_API_KEY exists:', !!process.env.PERPLEXITY_API_KEY);
  
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
    const { message, history, formData, genres } = payload;
    
    if (!message) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required parameter: message' })
      };
    }
    
    if (!Array.isArray(history)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'History must be an array' })
      };
    }
    
    // Initialize OpenAI client for main OpenAI API
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Initialize OpenAI client for Perplexity API
    const perplexity = new OpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: 'https://api.perplexity.ai'
    });
    
    // Create form context if form data is provided
    let formContext = '';
    if (formData && genres) {
      const selectedGenre = genres.find(g => g.id === formData.genreId)?.name || 'Not selected';
      formContext = formData ? `Current form state:
Title: ${formData.title}
Genre: ${selectedGenre}
Rating: ${formData.rating}
Homepage Sections: ${formData.homepage_sections}
Excerpt: ${formData.excerpt}
Content: ${formData.content}
Pros: ${formData.pros.join(', ')}
Cons: ${formData.cons.join(', ')}

Awards:
${formData.awards.map((award, index) => `- ${award} (${new Date(formData.award_dates[award]).toLocaleDateString()})`).join('\n')}

Release Details:
- Developer: ${formData.developer}
- Publisher: ${formData.publisher}
- Age Rating: ${formData.ageRating}
- Price: $${formData.priceUSD}, £${formData.priceGBP}, €${formData.priceEUR}
- Release Date: ${new Date(formData.releaseDate).toLocaleDateString()}
- Systems: ${formData.systems.join(', ')}

Multiplayer Details:
- Online Co-Op: ${formData.online_coop ? 'Yes' : 'No'}
- Couch Co-Op: ${formData.couch_coop ? 'Yes' : 'No'}
- Split Screen: ${formData.split_screen ? 'Yes' : 'No'}
- Maximum Players: ${formData.max_players}

System Requirements:
Minimum:
- OS: ${formData.specifications.minimum.os}
- Processor: ${formData.specifications.minimum.processor}
- Memory: ${formData.specifications.minimum.memory}
- Graphics: ${formData.specifications.minimum.graphics}
- Storage: ${formData.specifications.minimum.storage}

Recommended:
- OS: ${formData.specifications.recommended.os}
- Processor: ${formData.specifications.recommended.processor}
- Memory: ${formData.specifications.recommended.memory}
- Graphics: ${formData.specifications.recommended.graphics}
- Storage: ${formData.specifications.recommended.storage}` : '';
    }

    const messages = [
      {
        role: "system",
        content: `You are an AI assistant embedded in a game review form editor. You have real-time access to the form data which represents a game review being written.

FORM DATA STRUCTURE:
The form contains these specific fields, which you must understand and reference precisely:
1. Core Information
   - Title: The game being reviewed
   - Genre: The game's category/genre
   - Rating: Numerical rating given
   - Homepage Sections: Where this review appears on the site

2. Review Content
   - Excerpt: Brief summary/hook for the review
   - Content: Main review body
   - Pros: List of positive aspects
   - Cons: List of negative aspects

3. Technical Information
   - Developer: Company that made the game
   - Publisher: Company that published the game
   - Age Rating: Game's age/content rating
   - Price: In USD, GBP, and EUR
   - Release Date: When the game launched
   - Systems: Platforms the game is available on

4. Multiplayer Details
   - Online Co-Op: Whether online cooperative play is available
   - Couch Co-Op: Whether local cooperative play is available
   - Split Screen: Whether split screen multiplayer is supported
   - Maximum Players: Maximum number of players supported

5. System Requirements
   Minimum Specifications:
   - Operating System
   - Processor
   - Memory
   - Graphics Card
   - Storage Space
   
   Recommended Specifications:
   - Operating System
   - Processor
   - Memory
   - Graphics Card
   - Storage Space

6. Awards & Recognition
   - Award Names
   - Award Dates

UNDERSTANDING CONTEXT:
1. Form State
   - You can see ALL current form data in the 'Current form state:' section
   - This data updates in real-time as the review is being written
   - Empty fields indicate sections not yet completed

2. Data Interpretation
   - ALWAYS check actual values in the form
   - NEVER assume content exists if not shown
   - Distinguish between empty fields and missing data
   - Consider the relationships between different sections

RESPONSE GUIDELINES:
1. When Discussing Content
   - Quote exact text from the form
   - Specify which section you're referencing
   - Highlight relationships between different sections
   - Note any missing or incomplete information

2. When Answering Questions
   - Ground every response in the actual form data
   - Be explicit about what information is/isn't available
   - Use specific examples from the current review
   - Maintain context across the conversation

3. When Making Suggestions
   - Base suggestions on existing content
   - Reference similar fields or sections
   - Consider the review's current state
   - Respect the established tone and style

4. When Handling Technical Details
   - Verify specifications are complete
   - Check for consistency in platform information
   - Ensure pricing information is properly formatted
   - Validate date formats

CRITICAL RULES:
1. NEVER invent or assume content not in the form
2. ALWAYS quote actual form values when discussing content
3. BE EXPLICIT about missing or empty fields
4. MAINTAIN context throughout the conversation
5. CONSIDER the relationships between different sections
6. VERIFY technical details for consistency
7. RESPECT the review's current state and progress

ERROR HANDLING:
1. If asked about missing content:
   - Acknowledge what's missing
   - Reference related available content
   - Suggest relevant additions based on existing data

2. If encountering inconsistencies:
   - Highlight the discrepancy
   - Reference the specific fields involved
   - Suggest potential resolutions

Your primary goal is to assist in creating comprehensive, accurate game reviews while maintaining strict adherence to the actual form data available to you.`
      },
      formContext ? {
        role: "system",
        content: formContext
      } : null,
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: message }
    ].filter(Boolean);

    console.log('Processing chat with Perplexity API');
    
    const completion = await perplexity.chat.completions.create({
      messages: messages,
      model: "sonar",
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = completion.choices[0].message.content;
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    };
  } catch (error) {
    console.error('Error in chat function:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to process chat message',
        message: error.message,
        stack: error.stack
      })
    };
  }
};
