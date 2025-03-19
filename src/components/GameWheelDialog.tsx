import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GameWheel } from "@/components/ui/game-wheel";
import { Dices, ThumbsUp, ThumbsDown, Youtube } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MediumCard } from "@/components/cards/MediumCard";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBackgroundSettings } from "@/hooks/useBackgroundSettings";

// Helper function to extract YouTube video ID from URL
const getYouTubeVideoId = (url: string): string => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : '';
};

// Define simplified types for our component
interface ReviewAuthor {
  name: string;
  avatar: string;
  title: string;
  bio: string | null;
}

interface SimpleReview {
  id: string;
  title: string;
  image: string;
  imagePosition: number;
  excerpt: string;
  content: string;
  rating: number;
  author: ReviewAuthor;
  likes: number;
  genre: string;
  publishedDate: string | null;
  playtime: number;
  pros: string[] | null;
  cons: string[] | null;
  youtubeTrailerUrl: string | null;
}

export function GameWheelDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [reviews, setReviews] = useState<SimpleReview[]>([]);
  const [reviewTitles, setReviewTitles] = useState<string[]>([]);
  const [selectedReview, setSelectedReview] = useState<SimpleReview | null>(null);
  const [showReviewDetails, setShowReviewDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isButtonVisible, setIsButtonVisible] = useState(true);
  const { wheelBackground } = useBackgroundSettings();

  // Add event listener for game state changes
  useEffect(() => {
    const handleGameStateChange = (event: CustomEvent) => {
      const newGameState = event.detail?.gameState;
      if (newGameState) {
        // Hide button when game is playing, show it otherwise
        setIsButtonVisible(newGameState !== 'playing');
      }
    };
    
    // Listen for game state change events
    window.addEventListener('gameStateChange', handleGameStateChange as EventListener);
    
    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('gameStateChange', handleGameStateChange as EventListener);
    };
  }, []);

  // Fetch reviews when dialog opens
  useEffect(() => {
    if (isOpen && reviews.length === 0) {
      fetchReviews();
    }
  }, [isOpen]);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          title,
          image,
          image_position,
          excerpt,
          content,
          rating,
          likes,
          playtime,
          published_date,
          pros,
          cons,
          youtube_trailer_url,
          author:profiles(
            username,
            avatar_url,
            bio
          ),
          genre:genres(
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data) {
        const formattedReviews = data.map(review => ({
          id: review.id,
          title: review.title,
          image: review.image,
          imagePosition: review.image_position || 50,
          excerpt: review.excerpt,
          content: review.content,
          rating: review.rating,
          author: {
            name: review.author?.username || 'Anonymous',
            avatar: review.author?.avatar_url || 'https://i.pravatar.cc/150',
            title: 'Game Reviewer',
            bio: review.author?.bio || null
          },
          likes: review.likes || 0,
          genre: review.genre?.name || 'Uncategorized',
          publishedDate: review.published_date || null,
          playtime: review.playtime || 0,
          pros: review.pros || [],
          cons: review.cons || [],
          youtubeTrailerUrl: review.youtube_trailer_url || null
        }));

        setReviews(formattedReviews);
        setReviewTitles(formattedReviews.map(review => review.title));
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
      // Fallback to default titles if we can't fetch reviews
      setReviewTitles([
        "Baldur's Gate 3",
        "Elden Ring",
        "Cyberpunk 2077",
        "Stardew Valley",
        "Hades",
        "Hollow Knight",
        "The Witcher 3",
        "Red Dead Redemption 2",
        "Minecraft",
        "Fortnite"
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGameSelected = (selectedTitle: string) => {
    // Find the review that matches the selected title
    const review = reviews.find(r => r.title === selectedTitle);
    
    if (review) {
      setSelectedReview(review);
      
      // Show review details after a short delay
      setTimeout(() => {
        setShowReviewDetails(true);
      }, 1500);
    }
  };

  const handleReset = () => {
    setShowReviewDetails(false);
    setSelectedReview(null);
  };

  const handleDialogClose = () => {
    // Reset state when dialog closes
    setShowReviewDetails(false);
    setSelectedReview(null);
  };

  // Function to get background style based on selected background
  const getWheelBackground = () => {
    const gradients = {
      staticPink: 'linear-gradient(to bottom right, rgb(245, 190, 220), rgb(235, 120, 170), rgb(70, 65, 75))',
      staticBlue: 'linear-gradient(to bottom right, rgb(180, 210, 250), rgb(140, 180, 245), rgb(65, 70, 85))',
      lavender: 'linear-gradient(to bottom right, rgb(220, 200, 245), rgb(180, 160, 235), rgb(75, 70, 95))',
      peach: 'linear-gradient(to bottom right, rgb(245, 205, 180), rgb(235, 165, 140), rgb(85, 70, 75))',
      mint: 'linear-gradient(to bottom right, rgb(200, 235, 215), rgb(160, 225, 185), rgb(70, 85, 80))',
      lilac: 'linear-gradient(to bottom right, rgb(225, 205, 245), rgb(185, 165, 235), rgb(80, 70, 95))',
      rosePetal: 'linear-gradient(to bottom right, rgb(245, 210, 220), rgb(235, 170, 180), rgb(85, 65, 75))',
      babyBlue: 'linear-gradient(to bottom right, rgb(195, 220, 245), rgb(155, 180, 235), rgb(70, 75, 90))',
      coral: 'linear-gradient(to bottom right, rgb(245, 195, 185), rgb(235, 155, 145), rgb(90, 70, 75))',
      periwinkle: 'linear-gradient(to bottom right, rgb(205, 210, 245), rgb(165, 170, 235), rgb(75, 75, 95))'
    };

    // Default to staticPink if the background is not in the list or is an animated one
    return gradients[wheelBackground as keyof typeof gradients] || gradients.staticPink;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) handleDialogClose();
    }}>
      <DialogTrigger asChild>
        {isButtonVisible && (
          <motion.div
            className="fixed z-50 top-4 left-4"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon" 
                    className="rounded-full bg-gradient-to-br from-rose-400/80 via-pink-400/80 to-rose-400/80 hover:from-rose-600/90 hover:via-rose-500/90 hover:to-pink-600/90 text-white hover:text-white border border-rose-300/50 shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                    aria-label="Open Game Wheel"
                  >
                    <Dices className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent 
                  side="right" 
                  className="bg-slate-900/95 backdrop-blur-sm border-slate-800 text-white text-sm px-3 py-1.5"
                >
                  Find Me A Game!
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.div>
        )}
      </DialogTrigger>
      
      <DialogContent 
        className={cn(
          "p-0 backdrop-blur-sm border-rose-200 max-h-[85vh] mt-12 md:mt-6 overflow-hidden rounded-2xl",
          showReviewDetails 
            ? "sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[950px] xl:max-w-[1100px]" 
            : "sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[600px] xl:max-w-[650px]"
        )}
        style={{ background: getWheelBackground() }}
      >
        <div className="flex flex-col h-full max-h-[85vh]">
          <DialogHeader className="p-3 pb-2 border-b border-rose-100/50 bg-white/20 backdrop-blur-sm flex-shrink-0 rounded-t-2xl">
            {showReviewDetails ? (
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-0 sm:justify-between relative">
                <div className="flex items-center gap-2 order-2 sm:order-1">
                  <Button 
                    onClick={handleReset}
                    className="bg-rose-500 hover:bg-rose-600 text-white"
                    size="sm"
                  >
                    <div className="flex items-center justify-center">
                      <Dices className="mr-1 h-3 w-3" />
                      <span className="text-xs sm:text-sm">Spin Again</span>
                    </div>
                  </Button>
                  
                  <Button 
                    asChild
                    variant="outline"
                    size="sm"
                    className="border-rose-200 hover:bg-rose-50 text-rose-600"
                  >
                    <a href={`/reviews/${selectedReview?.id}`} className="flex items-center justify-center">
                      <span className="text-xs sm:text-sm">Read Full Review</span>
                    </a>
                  </Button>
                </div>
                <DialogTitle className="text-base sm:text-lg md:text-xl font-bold text-rose-600 order-1 sm:order-2 sm:absolute sm:left-1/2 sm:-translate-x-1/2">
                  Your Random Game Pick
                </DialogTitle>
                {/* Empty div to balance the layout - only visible on non-mobile */}
                <div className="hidden sm:flex items-center gap-3 invisible order-3">
                  <Button size="sm" className="invisible">
                    <div className="flex items-center justify-center">
                      <Dices className="mr-1 h-3 w-3" />
                      <span>Spin Again</span>
                    </div>
                  </Button>
                </div>
              </div>
            ) : (
              <DialogTitle className="text-base sm:text-lg md:text-xl font-bold text-center text-rose-600">
                Spin the Game Wheel
              </DialogTitle>
            )}
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-4 md:p-5">
              <AnimatePresence mode="wait">
                {!showReviewDetails ? (
                  <motion.div
                    key="wheel"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.5 }}
                    className="w-full flex flex-col items-center"
                  >
                    {isLoading ? (
                      <div className="py-12 text-center text-muted-foreground">Loading games...</div>
                    ) : (
                      <GameWheel 
                        games={reviewTitles.length > 0 ? reviewTitles : ["Loading..."]} 
                        onSelect={handleGameSelected}
                        className="w-full max-w-[500px] mx-auto"
                      />
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="review-details"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full"
                  >
                    {selectedReview && (
                      <div className="flex flex-col space-y-3">
                        {/* Game Title and Rating */}
                        <div className="text-center mb-1">
                          <h2 className="text-xl font-bold text-rose-600 mb-0.5">{selectedReview.title}</h2>
                          <div className="flex items-center justify-center gap-2">
                            <div className="bg-rose-500 text-white font-bold rounded-full w-7 h-7 flex items-center justify-center text-sm">
                              {selectedReview.rating}
                            </div>
                            <span className="text-muted-foreground text-sm">{selectedReview.genre}</span>
                          </div>
                        </div>
                        
                        {/* Main Content Area - Responsive Grid Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          {/* Left Column - Game Image and Author */}
                          <div className="col-span-1 md:col-span-2">
                            <div className="flex flex-row md:flex-col gap-2 md:space-y-2">
                              {/* Game Image */}
                              <div 
                                className="w-24 md:w-full aspect-[4/5] rounded-lg overflow-hidden shadow-lg border border-rose-100"
                                style={{
                                  backgroundImage: `url(${selectedReview.image})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: `center ${selectedReview.imagePosition}%`
                                }}
                              />
                              
                              {/* Author Info */}
                              <div className="flex items-center gap-2 bg-rose-50 p-2 rounded-lg flex-1 md:flex-none">
                                <img 
                                  src={selectedReview.author.avatar} 
                                  alt={selectedReview.author.name}
                                  className="w-7 h-7 rounded-full object-cover border-2 border-rose-200"
                                />
                                <div>
                                  <p className="font-medium text-xs">{selectedReview.author.name}</p>
                                  <p className="text-xs text-muted-foreground">Game Reviewer</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Middle Column - Excerpt and Pros/Cons */}
                          <div className="col-span-1 md:col-span-6">
                            <div className="flex flex-col h-full space-y-2">
                              {/* Excerpt */}
                              <Card className="p-2 bg-white shadow-md border-rose-100">
                                <p className="italic text-gray-700 text-sm">{selectedReview.excerpt}</p>
                              </Card>
                              
                              {/* Pros and Cons */}
                              <Card className="p-2 bg-white shadow-md border-rose-100 flex-grow">
                                <h3 className="text-sm font-semibold mb-2 text-rose-600">Pros & Cons</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div className="bg-green-50 p-2 rounded-lg overflow-hidden">
                                    <h4 className="font-semibold mb-1 flex items-center gap-1 text-green-700 text-xs">
                                      <ThumbsUp className="w-3 h-3 text-green-500" />
                                      <span>Pros</span>
                                    </h4>
                                    <ul className="space-y-0.5 max-h-[120px] overflow-y-auto pr-1">
                                      {selectedReview.pros && selectedReview.pros.length > 0 ? (
                                        selectedReview.pros.map((pro, index) => (
                                          <li key={index} className="flex items-start text-xs">
                                            <span className="text-green-500 mr-1 mt-0.5 flex-shrink-0">✓</span>
                                            <span className="text-gray-700 break-words">{pro}</span>
                                          </li>
                                        ))
                                      ) : (
                                        <li className="text-xs text-muted-foreground">No pros listed</li>
                                      )}
                                    </ul>
                                  </div>
                                  <div className="bg-red-50 p-2 rounded-lg overflow-hidden">
                                    <h4 className="font-semibold mb-1 flex items-center gap-1 text-red-700 text-xs">
                                      <ThumbsDown className="w-3 h-3 text-red-500" />
                                      <span>Cons</span>
                                    </h4>
                                    <ul className="space-y-0.5 max-h-[120px] overflow-y-auto pr-1">
                                      {selectedReview.cons && selectedReview.cons.length > 0 ? (
                                        selectedReview.cons.map((con, index) => (
                                          <li key={index} className="flex items-start text-xs">
                                            <span className="text-red-500 mr-1 mt-0.5 flex-shrink-0">✗</span>
                                            <span className="text-gray-700 break-words">{con}</span>
                                          </li>
                                        ))
                                      ) : (
                                        <li className="text-xs text-muted-foreground">No cons listed</li>
                                      )}
                                    </ul>
                                  </div>
                                </div>
                              </Card>
                            </div>
                          </div>
                          
                          {/* Right Column - YouTube Trailer */}
                          <div className="col-span-1 md:col-span-4">
                            {selectedReview.youtubeTrailerUrl ? (
                              <Card className="p-2 bg-white shadow-md border-rose-100 h-full flex flex-col">
                                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1 text-rose-600">
                                  <Youtube className="w-3 h-3 text-red-500" />
                                  <span>Game Trailer</span>
                                </h3>
                                <div className="aspect-video md:aspect-[16/9] rounded-lg overflow-hidden shadow-md flex-grow">
                                  <iframe
                                    src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedReview.youtubeTrailerUrl)}`}
                                    title="Game Trailer"
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                </div>
                              </Card>
                            ) : (
                              <Card className="p-2 bg-white shadow-md border-rose-100 h-full flex flex-col justify-center items-center text-center">
                                <Youtube className="w-6 h-6 text-gray-300 mb-1" />
                                <p className="text-xs text-muted-foreground">No trailer available</p>
                              </Card>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 