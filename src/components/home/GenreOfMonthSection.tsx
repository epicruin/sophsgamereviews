import { motion } from "framer-motion";
import { Medal } from "lucide-react";
import { FeaturedReview } from "@/components/FeaturedReview";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Review {
  id: string;
  title: string;
  image: string;
  rating: number;
  excerpt: string;
  author: {
    name: string;
    avatar: string;
  };
  likes: number;
  genre: string;
}

export const GenreOfMonthSection = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGenreOfMonthReviews();
  }, []);

  const fetchGenreOfMonthReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          title,
          image,
          rating,
          excerpt,
          likes,
          author:profiles!fk_reviews_author(username, avatar_url),
          genre:genres!fk_reviews_genre(name)
        `)
        .contains('homepage_sections', ['genre_of_month'])
        .limit(4);

      if (error) throw error;

      const formattedReviews = (data || []).map(review => ({
        id: review.id,
        title: review.title,
        image: review.image,
        rating: review.rating,
        excerpt: review.excerpt,
        author: {
          name: review.author?.username || 'Anonymous',
          avatar: review.author?.avatar_url || ''
        },
        likes: review.likes || 0,
        genre: review.genre?.name || 'Uncategorized'
      }));

      setReviews(formattedReviews);
    } catch (error) {
      console.error('Error fetching genre of month reviews:', error);
      toast.error('Failed to load genre of month reviews');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  // Don't render if there are no reviews
  if (reviews.length === 0) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold gradient-text text-center flex-grow">
          Genre of the Month
        </h2>
        <Medal className="w-6 h-6 text-muted-foreground" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
          >
            <FeaturedReview {...review} variant="medium" />
          </motion.div>
        ))}
      </div>
    </section>
  );
};
