import { supabase } from '@/integrations/supabase/client';

interface IGDBImage {
  id: string;
  image_id: string;
  url: string;
}

interface IGDBGame {
  id: number;
  name: string;
  cover?: {
    image_id: string;
  };
  screenshots?: {
    image_id: string;
  }[];
}

const IGDB_ENDPOINT = 'https://api.igdb.com/v4';

async function getIGDBToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No session found');

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/igdb-token`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get IGDB token');
    }

    const { access_token } = await response.json();
    return access_token;
  } catch (error) {
    console.error('Error getting IGDB token:', error);
    throw error;
  }
}

export async function searchGame(title: string): Promise<IGDBGame[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No session found');

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/igdb/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.user.id}`
      },
      body: JSON.stringify({ title })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to search game');
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching game:', error);
    throw error;
  }
}

export type IGDBImageSize = 
  | 'cover_small' 
  | 'cover_big' 
  | 'screenshot_med' 
  | 'screenshot_big' 
  | 'screenshot_huge' 
  | '1080p' 
  | '2160p';

export function getImageUrl(imageId: string, size: IGDBImageSize = '1080p'): string {
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}

export async function getGameImages(title: string): Promise<{ cover: string; screenshots: string[] }> {
  try {
    const games = await searchGame(title);
    if (!games || games.length === 0) {
      throw new Error('No games found');
    }

    const game = games[0];
    const cover = game.cover ? getImageUrl(game.cover.image_id, '1080p') : '';
    const screenshots = (game.screenshots || [])
      .slice(0, 20)
      .map(screenshot => getImageUrl(screenshot.image_id, '1080p'));

    return {
      cover,
      screenshots
    };
  } catch (error) {
    console.error('Error getting game images:', error);
    throw error;
  }
} 