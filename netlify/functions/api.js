// Serverless function to handle API requests
// Import path and fs for resolving module paths
const path = require('path');

// We need to use dynamic import for TypeScript modules
exports.handler = async (event, context) => {
  console.log('Function invoked with path:', event.path);
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

    // Create a simplified response object
    let finalResponse = {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: ''
    };

    const res = {
      status(statusCode) {
        console.log('Setting status code:', statusCode);
        finalResponse.statusCode = statusCode;
        return this;
      },
      set(header, value) {
        finalResponse.headers[header] = value;
        return this;
      },
      json(data) {
        console.log('Response data type:', typeof data);
        // Handle serialization properly - only stringify if not already a string
        finalResponse.body = typeof data === 'string' ? data : JSON.stringify(data);
        if (!finalResponse.headers['Content-Type']) {
          finalResponse.headers['Content-Type'] = 'application/json';
        }
        return this;
      },
      send(data) {
        console.log('Response data type:', typeof data);
        // Handle various data types
        if (typeof data === 'object' && data !== null) {
          finalResponse.body = JSON.stringify(data);
          if (!finalResponse.headers['Content-Type']) {
            finalResponse.headers['Content-Type'] = 'application/json';
          }
        } else {
          finalResponse.body = data.toString();
        }
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

    // Log the final response for debugging
    console.log('Function completing with status:', finalResponse.statusCode);
    console.log('Response body exists:', !!finalResponse.body);
    if (finalResponse.body) {
      console.log('First 100 chars of response:', finalResponse.body.substring(0, 100));
    }

    // Return the finalized response
    return finalResponse;
  } catch (error) {
    console.error('Function error:', error);
    console.error('Stack trace:', error.stack);
    
    // Return a properly formatted error
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Server error', 
        message: error.message,
        stack: error.stack 
      })
    };
  }
}; 