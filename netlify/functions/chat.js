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
    
    // Prepare the context based on form data and history
    let contextPrompt = '';
    
    if (formData) {
      contextPrompt += `Game Review Form Data:\n`;
      if (formData.title) contextPrompt += `Title: ${formData.title}\n`;
      if (formData.genre) contextPrompt += `Genre: ${formData.genre}\n`;
      if (formData.systems && formData.systems.length) contextPrompt += `Systems: ${formData.systems.join(', ')}\n`;
      if (formData.developer) contextPrompt += `Developer: ${formData.developer}\n`;
      if (formData.publisher) contextPrompt += `Publisher: ${formData.publisher}\n`;
      if (formData.ageRating) contextPrompt += `Age Rating: ${formData.ageRating}\n`;
      if (formData.releaseDate) contextPrompt += `Release Date: ${formData.releaseDate}\n`;
      if (formData.pros && formData.pros.length) contextPrompt += `Pros: ${formData.pros.join(', ')}\n`;
      if (formData.cons && formData.cons.length) contextPrompt += `Cons: ${formData.cons.join(', ')}\n`;
      if (formData.content) contextPrompt += `Review Content:\n${formData.content.substring(0, 500)}...\n`;
    }
    
    if (genres && genres.length) {
      contextPrompt += `\nAvailable genres: ${genres.join(', ')}\n`;
    }
    
    let systemContent = `You are a female game reviewer AI assistant specializing in providing detailed and informative responses about video games to help with writing game reviews. 
      Your responses should be knowledgeable but conversational, friendly, and helpful.

      ${contextPrompt}`;
      
    // Prepare conversation history
    const messages = [
      { role: 'system', content: systemContent }
    ];
    
    // Add conversation history
    if (history && history.length) {
      history.forEach(entry => {
        messages.push({ role: entry.role, content: entry.content });
      });
    }
    
    // Add the current message
    messages.push({ role: 'user', content: message });
    
    // Create a completion using Perplexity's Sonar model
    const completion = await perplexity.chat.completions.create({
      messages: messages,
      model: "sonar-pro",
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