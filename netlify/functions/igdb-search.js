const { createClient } = require('@supabase/supabase-js');

// Function to validate user session
async function validateSession(supabase, userId) {
  const { data: isAdmin } = await supabase.rpc('is_admin', {
    user_id: userId
  });
  return isAdmin;
}

// Get IGDB token
async function getIGDBToken(userId) {
  // Initialize Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  
  // Validate user session
  const isAuthorized = await validateSession(supabase, userId);
  if (!isAuthorized) {
    throw new Error('Unauthorized access');
  }

  try {
    // Get Twitch OAuth token (IGDB uses Twitch authentication)
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.IGDB_CLIENT_ID,
        client_secret: process.env.IGDB_CLIENT_SECRET,
        grant_type: 'client_credentials'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get IGDB token');
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      expires_in: data.expires_in
    };
  } catch (error) {
    console.error('Error getting IGDB token:', error);
    throw error;
  }
}

// Search for games in IGDB
async function searchGame(title, token) {
  try {
    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Client-ID': process.env.IGDB_CLIENT_ID,
        'Authorization': `Bearer ${token}`,
      },
      body: `
        search "${title}";
        fields name,cover.*,screenshots.*,screenshots.url;
        where version_parent = null;
        limit 10;
      `
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from IGDB');
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching game:', error);
    throw error;
  }
}

exports.handler = async function(event, context) {
  // Log incoming request for debugging
  console.log('IGDB search function invoked');
  console.log('HTTP Method:', event.httpMethod);
  console.log('Environment variables check:');
  console.log('- IGDB_CLIENT_ID exists:', !!process.env.IGDB_CLIENT_ID);
  console.log('- IGDB_CLIENT_SECRET exists:', !!process.env.IGDB_CLIENT_SECRET);
  console.log('- SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
  console.log('- SUPABASE_SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_KEY);
  
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
    const { title } = payload;
    
    if (!title) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing title parameter' })
      };
    }
    
    // Get authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No authorization header' })
      };
    }

    const userId = authHeader.split('Bearer ')[1];
    if (!userId) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid authorization header' })
      };
    }
    
    console.log(`Searching for game with title: ${title}`);
    
    // Get IGDB token
    const { access_token } = await getIGDBToken(userId);
    console.log('IGDB token acquired');
    
    // Search for games
    const games = await searchGame(title, access_token);
    console.log(`Found ${games.length} games`);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(games)
    };
    
  } catch (error) {
    console.error('Error in IGDB search function:', error);
    
    const statusCode = error.message === 'Unauthorized access' ? 403 : 500;
    
    return {
      statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: error.message || 'Failed to search IGDB',
        stack: error.stack
      })
    };
  }
}; 