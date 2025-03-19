import { motion } from "framer-motion";
import { ReactNode, useState, useEffect } from "react";
import { LucideIcon, MonitorPlay, Users, Split, Heart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { FeaturedReview } from "@/components/FeaturedReview";
import { SmallCard } from "@/components/cards/SmallCard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define the common content item interface
interface ContentItem {
  id: string;
}

// Review specific interface
interface Review extends ContentItem {
  type: 'review';
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
  online_coop: boolean;
  couch_coop: boolean;
  split_screen: boolean;
}

// Genre specific interface
interface Genre extends ContentItem {
  type: 'genre';
  title: string;
  count: number;
  color: string;
}

// Props for the ContentGrid component
interface ContentGridProps {
  title: ReactNode;
  icon?: LucideIcon;
  items: (Review | Genre)[];
  variant?: "large" | "medium";
  contentType: "reviews" | "genres";
  sectionId?: string;
  linkPath?: string;
  className?: string;
  showTitle?: boolean;
  dotNavPosition?: ReactNode;
  isModal?: boolean;
  onArticleClick?: () => void;
}

export const ContentGrid = ({
  title,
  icon: Icon,
  items,
  variant = "medium",
  contentType,
  sectionId,
  linkPath,
  className = "",
  showTitle = true,
  dotNavPosition,
  isModal = false,
  onArticleClick
}: ContentGridProps) => {
  const [filters, setFilters] = useState({
    online_coop: false,
    couch_coop: false,
    split_screen: false
  });
  const [sortByLikes, setSortByLikes] = useState(false);
  const [sortByRating, setSortByRating] = useState(false);

  // Filter reviews based on selected multiplayer options
  const filterReviews = (reviews: Review[]) => {
    let filteredReviews = reviews.filter(review => {
      if (!filters.online_coop && !filters.couch_coop && !filters.split_screen) {
        return true; // No filters active, show all
      }
      return (
        (filters.online_coop && review.online_coop) ||
        (filters.couch_coop && review.couch_coop) ||
        (filters.split_screen && review.split_screen)
      );
    });

    // Sort by likes if enabled
    if (sortByLikes) {
      filteredReviews = [...filteredReviews].sort((a, b) => b.likes - a.likes);
    }
    // Sort by rating if enabled (takes precedence over likes)
    if (sortByRating) {
      filteredReviews = [...filteredReviews].sort((a, b) => b.rating - a.rating);
    }

    return filteredReviews;
  };

  // For reviews, separate large and normal reviews
  const allLargeReviews = contentType === "reviews" 
    ? items.filter(item => 'feature_size' in item && item.feature_size === 'large') as Review[]
    : [];
    
  const allNormalReviews = contentType === "reviews"
    ? items.filter(item => 'feature_size' in item && item.feature_size === 'normal') as Review[]
    : [];

  // Apply filters to reviews
  const largeReviews = filterReviews(allLargeReviews);
  const normalReviews = filterReviews(allNormalReviews);

  // For large reviews, we need two different approaches based on screen size
  // Desktop (lg and up): 2 rows of 3 cards (6 cards per slide)
  // Tablet (md): 1 row of 3 cards (3 cards per slide)
  // Small tablet (sm): 2 rows of 2 cards (4 cards per slide)
  // Mobile: 1 card per slide
  const getLargeReviewsSlides = () => {
    return Array.from({ 
      length: Math.ceil(largeReviews.length / 6) 
    }).map((_, slideIndex) => ({
      slideIndex,
      items: largeReviews.slice(slideIndex * 6, (slideIndex + 1) * 6)
    }));
  };

  // For genres, we'll use all items
  const genres = contentType === "genres" ? items as Genre[] : [];

  // Add a state to track window width
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Track window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine chunk size based on screen size
  // For mobile (2-column layout): shows 6 items (3 rows of 2)
  // For desktop (5-column layout): shows 10 items (2 rows of 5)
  // For large screens (>1280px): shows 20 items (4 rows of 5)
  const genreChunkSize = windowWidth >= 1280 ? 20 : 10;

  // Split genres into chunks for carousel
  const genreChunks = contentType === "genres" 
    ? genres.reduce((resultArray: Genre[][], item, index) => {
        const chunkIndex = Math.floor(index / genreChunkSize);
        if (!resultArray[chunkIndex]) {
          resultArray[chunkIndex] = []; // start a new chunk
        }
        resultArray[chunkIndex].push(item);
        return resultArray;
      }, [])
    : [];

  return (
    <section id={sectionId} className={`container mx-auto px-4 py-2 ${className}`}>
      {showTitle && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto_1fr] items-center gap-4 mb-2 md:mb-4">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold antialiased text-center xl:text-left">
            <div className="gradient-text inline-block">
              {title}
            </div>
          </h2>
          
          {/* Hide dots in header for mobile, show for larger screens */}
          <div className="hidden sm:flex justify-center relative z-[9999]">
            {dotNavPosition}
          </div>
          
          {contentType === "reviews" ? (
            <div className="flex justify-center xl:justify-end gap-1 sm:gap-2 md:gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        setSortByRating(!sortByRating);
                        if (!sortByRating) setSortByLikes(false);
                      }}
                      className={`p-1 sm:p-1.5 md:p-2 rounded-full transition-all ${
                        sortByRating 
                          ? 'text-yellow-500 fill-yellow-500' 
                          : 'text-yellow-500 hover:bg-yellow-500/10'
                      }`}
                    >
                      <Star className={`w-3.5 sm:w-4 md:w-5 h-3.5 sm:h-4 md:h-5 ${sortByRating ? 'fill-current' : ''}`} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-slate-900/95 backdrop-blur-sm border-slate-800 text-yellow-500 text-sm px-3 py-1.5">
                    <p>Sort by Highest Rating</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        setSortByLikes(!sortByLikes);
                        if (!sortByLikes) setSortByRating(false);
                      }}
                      className={`p-1 sm:p-1.5 md:p-2 rounded-full transition-all ${
                        sortByLikes 
                          ? 'text-rose-500 fill-rose-500' 
                          : 'text-rose-500 hover:bg-rose-500/10'
                      }`}
                    >
                      <Heart className={`w-3.5 sm:w-4 md:w-5 h-3.5 sm:h-4 md:h-5 ${sortByLikes ? 'fill-current' : ''}`} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-slate-900/95 backdrop-blur-sm border-slate-800 text-rose-500 text-sm px-3 py-1.5">
                    <p>Sort by Most Liked</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, online_coop: !prev.online_coop }))}
                      className={`p-1 sm:p-1.5 md:p-2 rounded-full transition-all ${
                        filters.online_coop 
                          ? 'bg-rose-500/20 text-rose-500' 
                          : 'text-emerald-300 hover:bg-rose-500/10 hover:text-rose-500'
                      }`}
                    >
                      <MonitorPlay className="w-3.5 sm:w-4 md:w-5 h-3.5 sm:h-4 md:h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-slate-900/95 backdrop-blur-sm border-slate-800 text-emerald-300 text-sm px-3 py-1.5">
                    <p>Online Co-op</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, couch_coop: !prev.couch_coop }))}
                      className={`p-1 sm:p-1.5 md:p-2 rounded-full transition-all ${
                        filters.couch_coop 
                          ? 'bg-rose-500/20 text-rose-500' 
                          : 'text-sky-300 hover:bg-rose-500/10 hover:text-rose-500'
                      }`}
                    >
                      <Users className="w-3.5 sm:w-4 md:w-5 h-3.5 sm:h-4 md:h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-slate-900/95 backdrop-blur-sm border-slate-800 text-sky-300 text-sm px-3 py-1.5">
                    <p>Couch Co-op</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, split_screen: !prev.split_screen }))}
                      className={`p-1 sm:p-1.5 md:p-2 rounded-full transition-all ${
                        filters.split_screen 
                          ? 'bg-rose-500/20 text-rose-500' 
                          : 'text-purple-300 hover:bg-rose-500/10 hover:text-rose-500'
                      }`}
                    >
                      <Split className="w-3.5 sm:w-4 md:w-5 h-3.5 sm:h-4 md:h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-slate-900/95 backdrop-blur-sm border-slate-800 text-purple-300 text-sm px-3 py-1.5">
                    <p>Split Screen</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ) : (
            <div className="hidden md:block" />
          )}
        </div>
      )}
      
      {/* Reviews Content - Large Reviews */}
      {contentType === "reviews" && largeReviews.length > 0 && (
        <div className="relative w-full mb-0 mt-0">
          {/* Desktop view - 2 rows of 3 */}
          <div className="hidden xl:block">
            <Carousel
              opts={{
                align: "start",
                loop: true,
                skipSnaps: false,
                dragFree: false,
              }}
              className="w-full"
            >
              <CarouselContent className="-mb-2">
                {getLargeReviewsSlides().map(({ slideIndex, items }) => (
                  <CarouselItem key={slideIndex} className="basis-full">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 w-full">
                      {items.map((review, index) => (
                        <motion.div
                          key={review.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: index * 0.2 }}
                          className="h-full"
                        >
                          <FeaturedReview {...review} variant="large" isModal={isModal} onArticleClick={onArticleClick} />
                        </motion.div>
                      ))}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
          
          {/* Tablet/iPad Pro view - 1 row of 3 */}
          <div className="hidden lg:block xl:hidden">
            <Carousel
              opts={{
                align: "start",
                loop: true,
                skipSnaps: false,
                dragFree: false,
              }}
              className="w-full"
            >
              <CarouselContent className="-mb-2">
                {Array.from({ length: Math.ceil(largeReviews.length / 3) }).map((_, slideIndex) => (
                  <CarouselItem key={slideIndex} className="basis-full">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 w-full">
                      {largeReviews.slice(slideIndex * 3, (slideIndex + 1) * 3).map((review, index) => (
                        <motion.div
                          key={review.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: index * 0.2 }}
                          className="h-full"
                        >
                          <FeaturedReview {...review} variant="large" isModal={isModal} onArticleClick={onArticleClick} />
                        </motion.div>
                      ))}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
          
          {/* Medium tablet view - 2 rows of 2 (4 cards total) */}
          <div className="hidden md:block lg:hidden">
            <Carousel
              opts={{
                align: "start",
                loop: true,
                skipSnaps: false,
                dragFree: false,
              }}
              className="w-full"
            >
              <CarouselContent className="-mb-2">
                {Array.from({ length: Math.ceil(largeReviews.length / 4) }).map((_, slideIndex) => (
                  <CarouselItem key={slideIndex} className="basis-full">
                    <div className="grid grid-cols-2 grid-rows-2 gap-2 sm:gap-3 w-full">
                      {largeReviews.slice(slideIndex * 4, (slideIndex + 1) * 4).map((review, index) => (
                        <motion.div
                          key={review.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: index * 0.2 }}
                          className="h-full"
                        >
                          <FeaturedReview {...review} variant="large" isModal={isModal} onArticleClick={onArticleClick} />
                        </motion.div>
                      ))}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
          
          {/* Mobile view - 1 card at a time */}
          <div className="block md:hidden">
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
                {largeReviews.map((review, index) => (
                  <CarouselItem key={review.id} className="pl-2 basis-full">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.2 }}
                      className="h-full p-2"
                    >
                      <div className="h-full transform-gpu">
                        <FeaturedReview {...review} variant="large" isModal={isModal} onArticleClick={onArticleClick} />
                      </div>
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>
      )}

      {/* Reviews Content - Normal Reviews */}
      {contentType === "reviews" && normalReviews.length > 0 && (
        <div className="relative w-full mt-4">
          <Carousel
            opts={{
              align: "start",
              loop: true,
              skipSnaps: false,
              dragFree: false,
              containScroll: "trimSnaps",
              breakpoints: {
                '(min-width: 1280px)': { slidesToScroll: 5 },
                '(min-width: 1024px) and (max-width: 1279px)': { slidesToScroll: 4 },
                '(min-width: 768px) and (max-width: 1023px)': { slidesToScroll: 3 },
                '(min-width: 640px) and (max-width: 767px)': { slidesToScroll: 2 },
                '(max-width: 639px)': { slidesToScroll: 1 }
              }
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2">
              {normalReviews.map((review, index) => (
                <CarouselItem key={review.id} className="pl-2 basis-full sm:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    className="h-full p-2"
                  >
                    <div className="h-full transform-gpu">
                      <FeaturedReview {...review} variant={variant} isModal={isModal} onArticleClick={onArticleClick} />
                    </div>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      )}

      {/* Genres Content */}
      {contentType === "genres" && genres.length > 0 && (
        <div className="relative w-full mt-40">
          <Carousel
            opts={{
              align: "start",
              loop: true,
              skipSnaps: false,
              dragFree: false,
              containScroll: "trimSnaps",
              breakpoints: {
                '(min-width: 768px)': { slidesToScroll: 1 },
                '(max-width: 767px)': { slidesToScroll: 1 }
              }
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2">
              {genreChunks.map((chunk, chunkIndex) => (
                <CarouselItem key={chunkIndex} className="pl-2 basis-full">
                  <div className="flex justify-center w-full">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-3 md:gap-4 place-items-center w-full max-w-[800px]">
                      {chunk.map((genre, index) => (
                        <motion.div
                          key={genre.title}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: index * 0.05 }}
                          className="w-full sm:flex sm:justify-center"
                        >
                          <SmallCard title={genre.title} count={genre.count} color={genre.color} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      )}

      {/* Add mobile dots at the bottom */}
      {showTitle && (
        <div className="block sm:hidden w-full mt-4">
          <div className="flex justify-center relative z-[9999]">
            {dotNavPosition}
          </div>
        </div>
      )}

      {/* No content message */}
      {items.length === 0 && (
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold mb-4">No Content Available</h2>
          <p className="text-muted-foreground">
            {contentType === "reviews" 
              ? "No reviews are available at this time." 
              : "No genres are available at this time."}
          </p>
        </div>
      )}
    </section>
  );
}; 