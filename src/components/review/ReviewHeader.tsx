import { motion } from "framer-motion";
import { Star, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { ReviewData } from '../../types/Review';
import { cn } from "@/lib/utils";

interface ReviewHeaderProps {
  review: ReviewData;
}

export const ReviewHeader = ({ review }: ReviewHeaderProps) => {
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setHasScrolled(scrollPosition > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
