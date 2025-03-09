const OpenAI = require('openai');

exports.handler = async function(event, context) {
  // Log incoming request for debugging
  console.log('Predict genre function invoked');
  console.log('HTTP Method:', event.httpMethod);
  console.log('Environment variables check:');
  console.log('- OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
  
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
    const { title, genreList } = payload;
    
    if (!title || !genreList) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }
    
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    console.log(`Predicting genre for title: ${title}`);
    console.log(`Available genres:`, genreList);
    
    // Prepare the prompt
    const prompt = `Given the video game "${title}", which ONE genre from this list best fits it: ${genreList}? Reply with ONLY the exact genre name.`;
    
    // Create a completion
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 50,
      response_format: { type: "text" },
    });
    
    const genre = completion.choices[0].message.content?.trim();
    console.log(`Predicted genre: ${genre}`);
    
    // Convert genreList to array if it's a string
    const genreArray = typeof genreList === 'string' 
      ? genreList.split(',').map(g => g.trim())
      : genreList;
    
    // Validate the response is in the genreList
    if (!genre || !genreArray.some(g => g.toLowerCase() === genre.toLowerCase())) {
      console.warn(`Predicted genre "${genre}" is not in the provided genre list`);
      // Fall back to the first genre
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre: genreArray[0] })
      };
    }
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ genre })
    };
    
  } catch (error) {
    console.error('Error in predict-genre function:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to predict genre',
        message: error.message,
        stack: error.stack
      })
    };
  }
};
