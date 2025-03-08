// Serverless function to handle API requests
// Import path and fs for resolving module paths
const path = require('path');

// We need to use dynamic import for TypeScript modules
exports.handler = async (event, context) => {
  try {
    // Dynamically import the TypeScript module
    const { app } = await import('../../src/server/api/index.js');
    
    // Parse the request details
    const { path: requestPath, httpMethod, headers, body, queryStringParameters } = event;

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
        responseStatusCode = statusCode;
        return this;
      },
      set(header, value) {
        responseHeaders[header] = value;
        return this;
      },
      json(data) {
        responseBody = JSON.stringify(data);
        if (!responseHeaders['Content-Type']) {
          responseHeaders['Content-Type'] = 'application/json';
        }
        return this;
      },
      send(data) {
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
    return {
      statusCode: responseStatusCode,
      headers: responseHeaders,
      body: responseBody
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error', details: error.message })
    };
  }
}; 