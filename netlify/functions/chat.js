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
        body: JSON.stringify({ error: 'Missing message parameter' })
      };
    }
    
    // Initialize Perplexity client using OpenAI format
    const perplexity = new OpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: 'https://api.perplexity.ai'
    });
    
    console.log('Processing chat request');
    
    // Create form context if form data is provided
    let formContext = '';
    if (formData && genres) {
      const selectedGenre = genres.find(g => g.id === formData.genreId)?.name || 'Not selected';
      formContext = formData ? `Current form state:
Title: ${formData.title || 'Not set'}
Genre: ${selectedGenre}
Rating: ${formData.rating || 'Not set'}
Homepage Sections: ${formData.homepage_sections || 'Not set'}
Excerpt: ${formData.excerpt || 'Not set'}
Content: ${formData.content ? formData.content.substring(0, 500) + '...' : 'Not set'}
Pros: ${formData.pros && formData.pros.length ? formData.pros.join(', ') : 'None listed'}
Cons: ${formData.cons && formData.cons.length ? formData.cons.join(', ') : 'None listed'}

Awards:
${formData.awards && formData.awards.length && formData.award_dates ? 
  formData.awards.map((award, index) => `- ${award} (${formData.award_dates[award]})`).join('\n') : 
  'None listed'}

Release Details:
- Developer: ${formData.developer || 'Not set'}
- Publisher: ${formData.publisher || 'Not set'}
- Age Rating: ${formData.ageRating || 'Not set'}
- Price: $${formData.priceUSD || '0'}, £${formData.priceGBP || '0'}, €${formData.priceEUR || '0'}
- Release Date: ${formData.releaseDate || 'Not set'}
- Systems: ${formData.systems && formData.systems.length ? formData.systems.join(', ') : 'None listed'}

Multiplayer Details:
- Online Co-Op: ${formData.online_coop ? 'Yes' : 'No'}
- Couch Co-Op: ${formData.couch_coop ? 'Yes' : 'No'}
- Split Screen: ${formData.split_screen ? 'Yes' : 'No'}
- Maximum Players: ${formData.max_players || '0'}

System Requirements:
${formData.specifications ? `
Minimum:
- OS: ${formData.specifications.minimum?.os || 'Not set'}
- Processor: ${formData.specifications.minimum?.processor || 'Not set'}
- Memory: ${formData.specifications.minimum?.memory || 'Not set'}
- Graphics: ${formData.specifications.minimum?.graphics || 'Not set'}
- Storage: ${formData.specifications.minimum?.storage || 'Not set'}

Recommended:
- OS: ${formData.specifications.recommended?.os || 'Not set'}
- Processor: ${formData.specifications.recommended?.processor || 'Not set'}
- Memory: ${formData.specifications.recommended?.memory || 'Not set'}
- Graphics: ${formData.specifications.recommended?.graphics || 'Not set'}
- Storage: ${formData.specifications.recommended?.storage || 'Not set'}` : 'Not set'}` : '';
    }
    
    const systemPrompt = `You are an AI assistant embedded in a game review form editor. You have real-time access to the form data which represents a game review being written.

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

Your primary goal is to assist in creating comprehensive, accurate game reviews while maintaining strict adherence to the actual form data available to you.`;
      
    // Prepare conversation history
    const messages = [
      { role: 'system', content: systemPrompt }
    ];
    
    // Add form context if available
    if (formContext) {
      messages.push({ role: 'system', content: formContext });
    }
    
    // Add conversation history
    if (history && history.length) {
      history.forEach(entry => {
        messages.push({ role: entry.role, content: entry.content });
      });
    }
    
    // Add the current message
    messages.push({ role: 'user', content: message });
    
    console.log('Sending chat request to Perplexity with messages:', 
      messages.length, 'messages, system prompt length:', systemPrompt.length);
    
    // Create a completion using Perplexity's Sonar model
    const completion = await perplexity.chat.completions.create({
      messages: messages,
      model: "sonar", // Changed from sonar-pro to match development environment
      temperature: 0.7,
      max_tokens: 4000,
    });
    
    const response = completion.choices[0].message.content;
    console.log(`Chat response received, length: ${response?.length || 0}`);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response })
    };
    
  } catch (error) {
    console.error('Error in chat function:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to process chat request',
        message: error.message,
        stack: error.stack
      })
    };
  }
}; 