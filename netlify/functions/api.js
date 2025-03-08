// Serverless function to handle API requests
// Import path and fs for resolving module paths
const path = require('path');

// We need to use dynamic import for TypeScript modules
exports.handler = async (event, context) => {
  console.log('Function invoked with path:', event.path);
  console.log('Headers:', JSON.stringify(event.headers));
  console.log('HTTP Method:', event.httpMethod);
  console.log('Body exists:', !!event.body);
  
  try {
    // Log environment variables (but don't show their actual values for security)
    console.log('Environment variables present:');
    console.log('OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);
    console.log('PERPLEXITY_API_KEY present:', !!process.env.PERPLEXITY_API_KEY);
    console.log('SUPABASE_URL present:', !!process.env.SUPABASE_URL);
    console.log('SUPABASE_SERVICE_KEY present:', !!process.env.SUPABASE_SERVICE_KEY);
    
    // Dynamically import the TypeScript module
    const { app } = await import('../../src/server/api/index.js');
    
    // Parse the request details
    const { path: requestPath, httpMethod, headers, body, queryStringParameters } = event;
    
    // Log the path being processed
    console.log('Processing path:', requestPath);
    console.log('After transform:', requestPath.replace('/.netlify/functions/api', '') || '/');

    // Create a request object for the server
    const req = {
      method: httpMethod,
      headers,
      url: requestPath.replace('/.netlify/functions/api', '') || '/',
      query: queryStringParameters || {},
      body: body ? JSON.parse(body) : undefined,
    };

    // Create a response object
    let responseBody = '';
    let responseStatusCode = 200;
    let responseHeaders = {};

    const res = {
      status(statusCode) {
        console.log('Setting status code:', statusCode);
        responseStatusCode = statusCode;
        return this;
      },
      set(header, value) {
        responseHeaders[header] = value;
        return this;
      },
      json(data) {
        console.log('Sending JSON response:', JSON.stringify(data).substring(0, 200) + '...');
        responseBody = JSON.stringify(data);
        if (!responseHeaders['Content-Type']) {
          responseHeaders['Content-Type'] = 'application/json';
        }
        return this;
      },
      send(data) {
        console.log('Sending response:', typeof data === 'string' ? data.substring(0, 200) + '...' : '[non-string data]');
        responseBody = data;
        return this;
      },
      end() {
        return Promise.resolve();
      }
    };

    // Process the request through Express
    await new Promise((resolve) => {
      app(req, res, resolve);
    });

    // Return the response
    console.log('Function completing with status:', responseStatusCode);
    return {
      statusCode: responseStatusCode,
      headers: responseHeaders,
      body: responseBody
    };
  } catch (error) {
    console.error('Function error:', error);
    console.error('Stack trace:', error.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Server error', 
        message: error.message,
        stack: error.stack 
      })
    };
  }
}; 