import { supabase } from '@/integrations/supabase/client';

export interface ArticleInfo {
  summary?: string;
  content?: string;
  tldr?: string;
  imageQuery?: string; // For generating image search queries
  titleAndSummary?: {
    title: string;
    summary: string;
  };
}

export async function generateArticleContent(articleTitle: string, section: keyof ArticleInfo): Promise<Partial<ArticleInfo>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/article-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        articleTitle,
        section,
        userId: user.id
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate article content');
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating article content:', error);
    throw error;
  }
}

export async function searchImages(query: string): Promise<string[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/image-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        userId: user.id
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to search for images');
    }

    const data = await response.json();
    return data.imageUrls || [];
  } catch (error) {
    console.error('Error searching for images:', error);
    throw error;
  }
} 