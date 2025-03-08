import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Ensure environment variables are loaded
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

// Function to validate user session
async function validateSession(userId: string) {
  const { data: isAdmin } = await supabase.rpc('is_admin', {
    user_id: userId
  });
  return isAdmin;
}

export async function getIGDBToken(userId: string) {
  // Validate user session
  const isAuthorized = await validateSession(userId);
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

export async function searchGame(title: string, token: string) {
  try {
    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Client-ID': process.env.IGDB_CLIENT_ID!,
        'Authorization': `Bearer ${token}`,
      },
      body: `
        search "${title}";
        fields name,cover.*,screenshots.*,screenshots.url;
        where version_parent = null;
        limit 1;
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