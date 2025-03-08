import { motion } from "framer-motion";
import { Heart, Share2, Trophy, Gamepad, MonitorSmartphone, Building2, Building, AlertOctagon, Calendar, DollarSign, PoundSterling, EuroIcon, Monitor, MessageCircle, Youtube, Medal, Users, UserPlus, Split, MonitorPlay, ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ReviewData } from '../../types/Review';
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Helper function to extract YouTube video ID from URL
const getYouTubeVideoId = (url: string): string => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : '';
};

interface ReviewSidebarProps {
  review: ReviewData;
}

export const ReviewSidebar = ({ review }: ReviewSidebarProps) => {
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  // Fetch initial likes count and check local storage
  useEffect(() => {
    const fetchLikesCount = async () => {
      try {
        // Get the count of likes for this review
        const { data, error } = await supabase
          .from('likes')
          .select('*')
          .eq('review_id', review.id);
        
        if (error) throw error;
        setLikes(data?.length || 0);
      } catch (error) {
        console.error('Error fetching likes count:', error);
        toast.error('Failed to load likes count');
      }
    };

    // Check if user has liked this review before in localStorage
    const likedReviews = JSON.parse(localStorage.getItem('likedReviews') || '[]');
    setHasLiked(likedReviews.includes(review.id));

    fetchLikesCount();
  }, [review.id]);

  const handleLike = async () => {
    try {
      const likedReviews = JSON.parse(localStorage.getItem('likedReviews') || '[]');
      
      if (hasLiked) {
        // First find all likes for this review
        const { data: existingLikes, error: fetchError } = await supabase
          .from('likes')
          .select('id')
          .eq('review_id', review.id);
        
        if (fetchError) throw fetchError;
        
        if (!existingLikes?.length) {
          console.error('No likes found to delete');
          return;
        }

        // Delete one like
        const { error: deleteError } = await supabase
          .from('likes')
          .delete()
          .eq('id', existingLikes[0].id);
        
        if (deleteError) throw deleteError;

        // Remove from local storage
        const updatedLikedReviews = likedReviews.filter((id: string) => id !== review.id);
        localStorage.setItem('likedReviews', JSON.stringify(updatedLikedReviews));
        setHasLiked(false);
        setLikes(prev => Math.max(0, prev - 1));
      } else {
        // Insert new like
        const { error: insertError } = await supabase
          .from('likes')
          .insert({ review_id: review.id });
        
        if (insertError) throw insertError;

        // Add to local storage
        likedReviews.push(review.id);
        localStorage.setItem('likedReviews', JSON.stringify(likedReviews));
        setHasLiked(true);
        setLikes(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error updating like:', error);
      toast.error('Failed to update like');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      {/* Purchase Links */}
      {review.purchaseLinks && review.purchaseLinks.length > 0 && (
        <Card className="p-6 mb-8 bg-card/95 backdrop-blur-md">
          <h3 className="text-xl font-semibold mb-6 flex items-center justify-center gap-2 gradient-text">
            <ShoppingCart className="w-5 h-5" />
            Where to Buy
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {review.purchaseLinks.map((link, index) => (
              <a 
                key={index} 
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-500/20 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>
        </Card>
      )}
      
      {/* Quick Actions */}
      <Card className="p-6 mb-8 bg-card/95 backdrop-blur-md">
        <h3 className="text-xl font-semibold mb-6 flex items-center justify-center gap-2 gradient-text">
          <MessageCircle className="w-5 h-5" />
          Social
        </h3>
        <div className="flex justify-between items-center">
          <button
            onClick={handleLike}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Heart 
              className={cn(
                "w-5 h-5 transition-all",
                hasLiked ? "text-rose-500 fill-rose-500" : "text-rose-500"
              )}
            />
            <span>{likes} likes</span>
          </button>
          <button className="p-2 hover:bg-accent rounded-full">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </Card>

      {/* YouTube Trailer */}
      {review.youtubeTrailerUrl && (
        <Card className="p-6 mb-8 bg-card/95 backdrop-blur-md">
          <h3 className="text-xl font-semibold mb-6 flex items-center justify-center gap-2 gradient-text">
            <Youtube className="w-5 h-5" />
            Trailer
          </h3>
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${getYouTubeVideoId(review.youtubeTrailerUrl)}`}
              title="Game Trailer"
              className="w-full h-full rounded-md"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </Card>
      )}

      {/* Awards */}
      <Card className="p-6 mb-8 bg-card/95 backdrop-blur-md">
        <h3 className="text-xl font-semibold mb-6 flex items-center justify-center gap-2 gradient-text">
          <Medal className="w-5 h-5" />
          Awards
        </h3>
        <div className="space-y-4">
          {review.awards && review.awards.length > 0 ? (
            review.awards.map((award, index) => (
              <div key={index} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                <Trophy className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium leading-tight">{award}</span>
                  {review.award_dates?.[award] && (
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(review.award_dates[award]), 'MMMM yyyy')}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground">No awards yet</div>
          )}
        </div>
      </Card>

      {/* Game Information */}
      <Card className="p-6 mb-8 bg-card/95 backdrop-blur-md">
        <h3 className="text-xl font-semibold mb-6 flex items-center justify-center gap-2 gradient-text">
          <Gamepad className="w-5 h-5" />
          Game Information
        </h3>
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            <h4 className="text-sm font-semibold">Developer</h4>
            <p className="text-base text-muted-foreground">{review.developer}</p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Building className="w-5 h-5 text-muted-foreground" />
            <h4 className="text-sm font-semibold">Publisher</h4>
            <p className="text-base text-muted-foreground">{review.publisher}</p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-muted-foreground" />
            <h4 className="text-sm font-semibold">Age Rating</h4>
            <p className="text-base text-muted-foreground">{review.ageRating}</p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <h4 className="text-sm font-semibold">Release Date</h4>
            <p className="text-base text-muted-foreground">{format(new Date(review.releaseDate), 'MMMM d, yyyy')}</p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <DollarSign className="w-5 h-5 text-muted-foreground" />
            <h4 className="text-sm font-semibold">Price</h4>
            <div className="flex gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span>{review.priceUSD.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1">
                <PoundSterling className="w-4 h-4" />
                <span>{review.priceGBP.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1">
                <EuroIcon className="w-4 h-4" />
                <span>{review.priceEUR.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {review.systems && review.systems.length > 0 && (
            <div className="flex flex-col items-center gap-2">
              <Monitor className="w-5 h-5 text-muted-foreground" />
              <h4 className="text-sm font-semibold">Available On</h4>
              <div className="flex flex-wrap justify-center gap-2">
                {review.systems.map((system) => (
                  <span key={system} className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-sm text-muted-foreground">
                    {system}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Multiplayer Details */}
      <Card className="p-6 mb-8 bg-card/95 backdrop-blur-md">
        <h3 className="text-xl font-semibold mb-6 flex items-center justify-center gap-2 gradient-text">
          <Users className="w-5 h-5" />
          Multiplayer Details
        </h3>
        <div className="space-y-4">
          {(review.online_coop || review.couch_coop || review.split_screen || review.max_players > 0) ? (
            <>
              {review.online_coop && (
                <div className="flex flex-col items-center gap-2">
                  <MonitorPlay className="w-5 h-5 text-muted-foreground" />
                  <h4 className="text-sm font-semibold">Online Co-Op</h4>
                  <p className="text-base text-muted-foreground">Available</p>
                </div>
              )}

              {review.couch_coop && (
                <div className="flex flex-col items-center gap-2">
                  <UserPlus className="w-5 h-5 text-muted-foreground" />
                  <h4 className="text-sm font-semibold">Couch Co-Op</h4>
                  <p className="text-base text-muted-foreground">Available</p>
                </div>
              )}

              {review.split_screen && (
                <div className="flex flex-col items-center gap-2">
                  <Split className="w-5 h-5 text-muted-foreground" />
                  <h4 className="text-sm font-semibold">Split Screen</h4>
                  <p className="text-base text-muted-foreground">Available</p>
                </div>
              )}

              {review.max_players > 0 && (
                <div className="flex flex-col items-center gap-2">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <h4 className="text-sm font-semibold">Maximum Players</h4>
                  <p className="text-base text-muted-foreground">{review.max_players} Players</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-muted-foreground">Single Player Only</div>
          )}
        </div>
      </Card>

      {/* System Requirements */}
      <Card className="p-6 bg-card/95 backdrop-blur-md">
        <h3 className="text-xl font-semibold mb-6 flex items-center justify-center gap-2 gradient-text">
          <MonitorSmartphone className="w-5 h-5" />
          System Requirements
        </h3>
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold mb-2 text-center">Minimum</h4>
            <div className="space-y-2 text-sm">
              {Object.entries(review.specifications.minimum).map(([key, value]) => (
                <div key={key} className="flex flex-col items-center py-1">
                  <span className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                  <span className="text-muted-foreground">{value as string}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2 text-center">Recommended</h4>
            <div className="space-y-2 text-sm">
              {Object.entries(review.specifications.recommended).map(([key, value]) => (
                <div key={key} className="flex flex-col items-center py-1">
                  <span className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                  <span className="text-muted-foreground">{value as string}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
