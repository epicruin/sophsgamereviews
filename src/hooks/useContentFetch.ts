import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ReviewResponse } from '@/types/Review';

// Define the return types for the hook
export interface ContentFetchResult {
  items: any[];
  isLoading: boolean;
  error: Error | null;
  currentGenre?: string | null;
}

interface FetchOptions {
  contentType: 'reviews' | 'genres';
  section?: string;
  authorId?: string;
  genreId?: string;
  limit?: number;
}

// Define extended ReviewResponse type to include joined fields from the query
interface ExtendedReviewResponse extends ReviewResponse {
  author?: {
    username: string;
    avatar_url: string;
    bio: string | null;
  };
  genre?: {
    name: string;
  };
}

export const useContentFetch = ({
  contentType,
  section,
  authorId,
  genreId,
  limit
}: FetchOptions): ContentFetchResult => {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentGenre, setCurrentGenre] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true);
        
        if (contentType === 'reviews') {
          await fetchReviews();
        } else if (contentType === 'genres') {
          await fetchGenres();
        }
      } catch (err) {
        console.error(`Error fetching ${contentType}:`, err);
        setError(err as Error);
        toast.error(`Failed to load ${contentType}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [contentType, section, authorId, genreId]);

  const fetchReviews = async () => {
    let query = supabase
      .from('reviews')
      .select(`
        id,
        title,
        image,
        image_position,
        rating,
        excerpt,
        feature_size,
        homepage_sections,
        scheduled_for,
        online_coop,
        couch_coop,
        split_screen,
        max_players,
        author:profiles!fk_reviews_author(username, avatar_url),
        genre:genres!fk_reviews_genre(name),
        likes:likes(count)
      `)
      .order('created_at', { ascending: false });

    // Apply filters based on options
    if (section) {
      if (section === "latest") {
        // For latest section, just order by creation date
        query = query.order('created_at', { ascending: false });
      } else if (section === "genre_of_month") {
        // For genre of month, get the current genre ID from homepage_section_order
        const { data: sectionData, error: sectionError } = await supabase
          .from('homepage_section_order')
          .select('current_genre_id')
          .eq('section_id', 'genre_of_month')
          .single();

        if (sectionError) throw sectionError;

        if (sectionData?.current_genre_id) {
          query = query.eq('genre_id', sectionData.current_genre_id);
          
          // Also get the genre name for display
          const { data: genreData, error: genreError } = await supabase
            .from('genres')
            .select('name')
            .eq('id', sectionData.current_genre_id)
            .single();

          if (genreError) throw genreError;
          if (genreData) {
            setCurrentGenre(genreData.name);
          }
        }
      } else {
        // For other sections, filter by homepage_sections
        query = query.contains('homepage_sections', [section]);
      }
    }
    
    if (authorId) {
      query = query.eq('author_id', authorId);
    }
    
    if (genreId) {
      query = query.eq('genre_id', genreId);
    }
    
    // Only show published reviews
    const now = new Date().toISOString();
    query = query.or(`scheduled_for.is.null,scheduled_for.lte.${now}`);
    
    // Apply limit if specified
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query as { data: ExtendedReviewResponse[] | null, error: Error | null };

    if (error) throw error;

    const formattedReviews = (data || []).map(review => {
      const feature_size = review.feature_size === "large" ? "large" : "normal";
      
      return {
        id: review.id,
        type: 'review',
        title: review.title,
        image: review.image,
        imagePosition: review.image_position || 50,
        rating: review.rating,
        excerpt: review.excerpt,
        author: {
          name: review.author?.username || 'Anonymous',
          avatar: review.author?.avatar_url || ''
        },
        likes: review.likes?.[0]?.count || 0,
        genre: review.genre?.name || 'Uncategorized',
        feature_size,
        online_coop: review.online_coop || false,
        couch_coop: review.couch_coop || false,
        split_screen: review.split_screen || false
      };
    });

    setItems(formattedReviews);
  };

  const fetchGenres = async () => {
    try {
      // First get all genres
      const { data: genresData, error: genresError } = await supabase
        .from('genres')
        .select('id, name');

      if (genresError) throw genresError;

      // Then get the count of non-scheduled reviews for each genre
      const genreCounts = await Promise.all(
        genresData.map(async (genre) => {
          const { count } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('genre_id', genre.id)
            .is('scheduled_for', null);
          
          return {
            name: genre.name,
            count: count || 0
          };
        })
      );

      const colors = [
        'text-orange-400', 'text-rose-400', 'text-sky-400', 'text-emerald-400',
        'text-purple-400', 'text-amber-400', 'text-lime-400', 'text-blue-400',
        'text-pink-400', 'text-violet-400', 'text-orange-500', 'text-rose-500',
        'text-sky-500', 'text-emerald-500', 'text-purple-500', 'text-amber-500',
        'text-lime-500', 'text-blue-500', 'text-pink-500', 'text-violet-500'
      ];

      const formattedGenres = genreCounts.map((genre, index) => ({
        id: `genre-${index}`,
        type: 'genre',
        title: genre.name,
        count: genre.count,
        color: colors[index % colors.length]
      }));

      setItems(formattedGenres);
    } catch (error) {
      console.error('Error fetching genres:', error);
      throw error;
    }
  };

  return { items, isLoading, error, currentGenre };
}; 