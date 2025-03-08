import { motion } from "framer-motion";
import { Star, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ReviewData } from '../../types/Review';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReviewHeaderProps {
  review: ReviewData;
}

export const ReviewHeader = ({ review }: ReviewHeaderProps) => {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setHasScrolled(scrollPosition > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchRandomLatestReview = async () => {
    if (isNavigating) return;
    setIsNavigating(true);

    try {
      // Get current date in ISO format
      const now = new Date().toISOString();

      // Fetch all review IDs that are either not scheduled or their scheduled time has passed
      const { data: reviewIds, error } = await supabase
        .from('reviews')
        .select('id')
        .neq('id', review.id) // Exclude current review
        .or(`scheduled_for.is.null,scheduled_for.lte.${now}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!reviewIds || reviewIds.length === 0) {
        toast.error('No other reviews available');
        return;
      }

      // Select a random review ID
      const randomIndex = Math.floor(Math.random() * reviewIds.length);
      const randomReviewId = reviewIds[randomIndex].id;

      // Navigate to the random review
      navigate(`/reviews/${randomReviewId}`);
    } catch (error) {
      console.error('Error fetching random review:', error);
      toast.error('Failed to load random review');
    } finally {
      setIsNavigating(false);
    }
  };

  const buttonClasses = cn(
    // Base styles
    "fixed top-[35%] -translate-y-1/2 z-50",
    "w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20",
    "rounded-full border border-rose-300/50",
    "bg-gradient-to-br from-rose-400/80 via-rose-300/80 to-pink-400/80 backdrop-blur-sm",
    "text-white",
    "transition-all duration-300",
    // Hover state
    "hover:scale-110 hover:border-rose-500/60",
    "hover:from-rose-600/90 hover:via-rose-500/90 hover:to-pink-600/90",
    "hover:text-white",
    "shadow-lg hover:shadow-rose-500/30",
    // Disabled state
    "disabled:opacity-50 disabled:hover:scale-100 disabled:hover:from-rose-400/80 disabled:hover:via-rose-300/80 disabled:hover:to-pink-400/80 disabled:hover:text-white disabled:hover:border-rose-300/50",
    // Responsive positioning based on scroll
    hasScrolled ? "translate-x-0" : ""
  );

  return (
    <section className="relative w-[99.2vw] h-[85vh] -mt-20 -ml-[calc((99.2vw-100%)/2)]">
      <div className="absolute inset-0">
        <img
          src={review.headingImage || review.image}
          alt={review.title}
          className="w-full h-full object-cover"
          style={{
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent" />
      </div>

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          buttonClasses,
          "left-8 md:left-12 lg:left-16",
          hasScrolled ? "-translate-x-4 md:-translate-x-8" : "translate-x-4 md:translate-x-8"
        )}
        onClick={fetchRandomLatestReview}
        disabled={isNavigating}
      >
        <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
        <span className="sr-only">Previous Review</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          buttonClasses,
          "right-8 md:right-12 lg:right-16",
          hasScrolled ? "translate-x-4 md:translate-x-8" : "-translate-x-4 md:-translate-x-8"
        )}
        onClick={fetchRandomLatestReview}
        disabled={isNavigating}
      >
        <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
        <span className="sr-only">Next Review</span>
      </Button>

      <div className="relative h-full mx-auto">
        <div className="absolute bottom-24 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="container mx-auto px-4 md:px-8 xl:px-12 xl:max-w-[1280px]"
          >
            <div className="space-y-6">
              <h1 className="text-3xl md:text-5xl xl:text-7xl font-bold text-white tracking-tight">
                {review.title}
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
                <Badge variant="secondary" className="bg-black/40 hover:bg-black/50 backdrop-blur-sm text-white border-none flex items-center gap-1.5 md:gap-2 py-1.5 md:py-2 px-3 md:px-4">
                  <Star className="w-4 md:w-5 h-4 md:h-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-base md:text-lg font-semibold">{review.rating}</span>
                </Badge>
                <Badge variant="secondary" className="bg-black/40 hover:bg-black/50 backdrop-blur-sm text-white border-none flex items-center gap-1.5 md:gap-2 py-1.5 md:py-2 px-3 md:px-4">
                  <Clock className="w-4 md:w-5 h-4 md:h-5" />
                  <span className="text-base md:text-lg">{review.playtime}h playtime</span>
                </Badge>
                <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-none py-1.5 md:py-2 px-3 md:px-4 text-base md:text-lg">
                  {review.genre}
                </Badge>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
