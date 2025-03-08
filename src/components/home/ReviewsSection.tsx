import { motion } from "framer-motion";
import { FeaturedReview } from "@/components/FeaturedReview";
import { LucideIcon, ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, ReactNode } from "react";
import { toast } from "sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { ReviewPreview, ReviewResponse } from '../../types/Review';
import React from "react";

interface Review {
  id: string;
  title: string;
  image: string;
  imagePosition: number;
  rating: number;
  excerpt: string;
  author: {
    name: string;
    avatar: string;
  };
  likes: number;
  genre: string;
  feature_size: "normal" | "large";
}

interface ReviewsSectionProps {
  title: ReactNode;
  icon?: LucideIcon;
  variant?: "large" | "medium";
  className?: string;
  columns?: 1 | 2 | 3;
  section?: string;
}

export const ReviewsSection = ({
  title,
  icon: Icon,
  variant = "medium",
  className = "",
  columns = 2,
  section = "latest"
}: ReviewsSectionProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentGenre, setCurrentGenre] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [section]);

  const fetchReviews = async () => {
    try {
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
          author:profiles!fk_reviews_author(username, avatar_url),
          genre:genres!fk_reviews_genre(name),
          likes:likes(count)
        `)
        .order('created_at', { ascending: false });

      // First filter by section
      query = query.contains('homepage_sections', [section]);
      
      // Then only show reviews that are either not scheduled, or their scheduled time has passed
      const now = new Date().toISOString();
      query = query.or(`scheduled_for.is.null,scheduled_for.lte.${now}`);

      const { data, error } = await query as { data: ReviewResponse[] | null, error: Error | null };
      console.log("Fetched reviews data for section", section, ":", data);

      if (error) throw error;

      if (data && data.length > 0 && section === 'genre_of_month') {
        setCurrentGenre(data[0].genre?.name || null);
      }

      const formattedReviews = (data || []).map(review => {
        const feature_size = review.feature_size === "large" ? "large" : "normal";
        
        return {
          id: review.id,
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
          feature_size
        } satisfies Review;
      });

      setReviews(formattedReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  if (reviews.length === 0) {
    return null;
  }

  const largeReviews = reviews.filter(review => review.feature_size === 'large');
  const normalReviews = reviews.filter(review => review.feature_size === 'normal');

  return (
    <section className={`container mx-auto px-4 py-16 ${className}`}>
      <div className="flex items-center mb-0 mt-6">
        <div className="flex-1" />
        <h2 className="text-3xl font-bold text-center flex-grow antialiased">
          <div className="gradient-text inline-block">
            {title}
            {section === 'genre_of_month' && currentGenre && (
              <span className="ml-2">({currentGenre})</span>
            )}
          </div>
        </h2>
        <div className="flex-1 flex justify-end">
          {Icon && <Icon className="w-6 h-6 text-muted-foreground" />}
        </div>
      </div>
      
      {largeReviews.length > 0 && (
        <div className="relative w-full max-w-[calc(100vw-2rem)] sm:max-w-none mb-0 mt-4 sm:-mt-20">
          <Carousel
            opts={{
              align: "start",
              loop: true,
              skipSnaps: false,
              dragFree: false,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 sm:hidden">
              {largeReviews.map((review, index) => (
                <CarouselItem key={review.id} className="pl-2 basis-full">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    className="h-full p-2"
                  >
                    <div className="h-full transform-gpu">
                      <FeaturedReview {...review} variant="large" />
                    </div>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            <CarouselContent className="-mb-6 hidden sm:block">
              {Array.from({ length: Math.ceil(largeReviews.length / 6) }).map((_, slideIndex) => (
                <CarouselItem key={slideIndex} className="basis-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-2 gap-y-6 max-w-[1200px] mx-auto">
                    {largeReviews.slice(slideIndex * 6, (slideIndex + 1) * 6).map((review, index) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.2 }}
                      >
                        <FeaturedReview {...review} variant="large" />
                      </motion.div>
                    ))}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            <CarouselPrevious className="border-rose-400 text-rose-400 hover:bg-rose-50 hover:text-rose-500" />
            <CarouselNext className="border-rose-400 text-rose-400 hover:bg-rose-50 hover:text-rose-500" />
          </Carousel>
        </div>
      )}

      {normalReviews.length > 0 && (
        <div className="relative w-full max-w-[calc(100vw-2rem)] md:max-w-none mt-4 sm:-mt-8 max-[480px]:mt-4">
          <Carousel
            opts={{
              align: "start",
              loop: true,
              skipSnaps: false,
              dragFree: false,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2">
              {normalReviews.map((review, index) => (
                <CarouselItem key={review.id} className="pl-2 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    className="h-full p-2"
                  >
                    <div className="h-full transform-gpu">
                      <FeaturedReview {...review} variant={variant} />
                    </div>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="border-rose-400 text-rose-400 hover:bg-rose-50 hover:text-rose-500" />
            <CarouselNext className="border-rose-400 text-rose-400 hover:bg-rose-50 hover:text-rose-500" />
          </Carousel>
        </div>
      )}
    </section>
  );
};
