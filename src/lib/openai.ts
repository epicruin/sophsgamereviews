import { supabase } from '@/integrations/supabase/client';

export interface GameInfo {
  excerpt?: string;
  releaseDetails?: {
    developer: string;
    publisher: string;
    ageRating: string;
    priceUSD: number;
    priceGBP: number;
    priceEUR: number;
    releaseDate: string;
    systems: string[];
    purchaseLinks?: {
      name: string;
      url: string;
    }[];
  };
  prosAndCons?: {
    pros: string[];
    cons: string[];
  };
  systemRequirements?: {
    minimum: {
      os: string;
      processor: string;
      memory: string;
      graphics: string;
      storage: string;
    };
    recommended: {
      os: string;
      processor: string;
      memory: string;
      graphics: string;
      storage: string;
    };
  };
  fullReview?: string;
  awards?: {
    awards: string[];
    award_dates: { [key: string]: string };
  };
  youtubeTrailer?: {
    url: string;
  };
  multiplayerDetails?: {
    online_coop: boolean;
    couch_coop: boolean;
    split_screen: boolean;
    max_players: number;
  };
}

export async function generateGameInfo(gameTitle: string, section: keyof GameInfo): Promise<Partial<GameInfo>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/game-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameTitle,
        section,
        userId: user.id
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate game info');
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating game info:', error);
    throw error;
  }
}