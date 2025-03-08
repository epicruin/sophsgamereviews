import express from 'express';
import cors from 'cors';
import { generateGameInfoSecure } from './openai';
import { generateGameTitle } from './game-title';
import { predictGameGenre } from './genre-prediction';
import { createClient } from '@supabase/supabase-js';
import { getIGDBToken, searchGame } from './igdb';
import dotenv from 'dotenv';
import path from 'path';
import { handleChat } from './chat';

// Load environment variables from the root directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Debug environment variables
console.log('Environment variables loaded:');
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('PORT:', process.env.PORT);
console.log('Current working directory:', process.cwd());

export const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

app.post('/api/game-info', async (req, res) => {
  try {
    const { gameTitle, section, userId } = req.body;
    
    if (!gameTitle || !section || !userId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const result = await generateGameInfoSecure(gameTitle, section, userId, supabase);
    res.json(result);
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(error.message === 'Unauthorized access' ? 403 : 500)
      .json({ error: error.message });
  }
});

app.post('/api/game-title', async (req, res) => {
  try {
    const { existingTitles } = req.body;
    
    if (!Array.isArray(existingTitles)) {
      return res.status(400).json({ error: 'existingTitles must be an array' });
    }

    const title = await generateGameTitle(existingTitles);
    
    if (!title) {
      return res.status(500).json({ error: 'Failed to generate title' });
    }

    res.json({ title });
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/predict-genre', async (req, res) => {
  try {
    const { title, genreList } = req.body;
    
    if (!title || !genreList) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const genre = await predictGameGenre(title, genreList);
    
    if (!genre) {
      return res.status(500).json({ error: 'Failed to predict genre' });
    }

    res.json({ genre });
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, formData, genres } = req.body;
    const response = await handleChat(message, history, formData, genres);
    res.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

app.post('/api/igdb/search', async (req, res) => {
  try {
    const { title } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const userId = authHeader.split('Bearer ')[1];
    if (!userId) {
      return res.status(401).json({ error: 'Invalid authorization header' });
    }

    // Get IGDB token
    const { access_token } = await getIGDBToken(userId);

    // Search for games
    const games = await searchGame(title, access_token);
    res.json(games);
  } catch (error: any) {
    console.error('IGDB Search Error:', error);
    res.status(error.message === 'Unauthorized access' ? 403 : 500)
      .json({ error: error.message });
  }
});

// Only start the server when running directly (not when imported by Netlify Functions)
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
