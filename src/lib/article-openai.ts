import { supabase } from "@/integrations/supabase/client";

export interface ArticleInfo {
  title: string;
  summary: string;
  content: string;
  tldr: string;
}

export async function generateArticleInfo(articleTitle: string, section: keyof ArticleInfo): Promise<Partial<ArticleInfo>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Use the Netlify function endpoint
    const response = await fetch(`/.netlify/functions/article-info`, {
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
      throw new Error(error.error || 'Failed to generate article info');
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating article info:', error);
    throw error;
  }
} 