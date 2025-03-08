import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ReviewHeader } from "@/components/review/ReviewHeader";
import { ReviewContent } from "@/components/review/ReviewContent";
import { ReviewGallery } from "@/components/review/ReviewGallery";
import { ReviewSidebar } from "@/components/review/ReviewSidebar";
import NotFound from "./NotFound";
import { ReviewData, ReviewResponse } from "../types/Review";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ReviewInfo } from "@/components/review/ReviewInfo";
import { Card } from "@/components/ui/card";
import { ThumbsUp, ThumbsDown, Star, Medal, Gem, Coffee, Library, Clock, Users } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { StaticStarsBackground } from "@/components/home/StaticStarsBackground";
import { AuroraBackground } from "@/components/home/AuroraBackground";
import { ShootingStarsBackground } from "@/components/home/ShootingStarsBackground";
import { Link } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { motion } from "framer-motion";
import { MediumCard } from "@/components/cards/MediumCard";

// Type for latest reviews which only includes fields needed for MediumCard
interface LatestReview {
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
}

const SingleReview = () => {
  const { id } = useParams<{ id: string }>();
  const [review, setReview] = useState<ReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [latestReviews, setLatestReviews] = useState<LatestReview[]>([]);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = '';
    document.body.style.scrollBehavior = '';
    
    document.documentElement.classList.remove('smooth-scroll');
    
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (id) {
      fetchReview(id);
      fetchLatestReviews(id);
    }
  }, [id]);

  const fetchLatestReviews = async (currentReviewId: string) => {
    try {
      const now = new Date().toISOString();
      
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id,
          title,
          image,
          excerpt,
          rating,
          likes,
          image_position,
          scheduled_for,
          author:profiles!inner(
            username,
            avatar_url
          ),
          genre:genres!inner(
            name
          )
        `)
        .neq('id', currentReviewId) // Exclude current review
        .or(`scheduled_for.is.null,scheduled_for.lt.${now}`) // Only published reviews
        .order('created_at', { ascending: false })
        .limit(100);

      if (reviewsError) throw reviewsError;

      if (reviewsData) {
        const formattedReviews: LatestReview[] = reviewsData.map(review => ({
          id: review.id,
          title: review.title,
          image: review.image,
          imagePosition: review.image_position || 50,
          excerpt: review.excerpt,
          rating: review.rating,
          author: {
            name: review.author?.username || 'Anonymous',
            avatar: review.author?.avatar_url || 'https://i.pravatar.cc/150',
          },
          likes: review.likes || 0,
          genre: review.genre?.name || 'Uncategorized'
        }));

        setLatestReviews(formattedReviews);
      }
    } catch (error) {
      console.error('Error fetching latest reviews:', error);
      toast.error('Failed to load latest reviews');
    }
  };

  const fetchReview = async (reviewId: string) => {
    try {
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .select(`
          id,
          title,
          image,
          heading_image,
          excerpt,
          content,
          rating,
          author_id,
          likes,
          playtime,
          published_date,
          created_at,
          updated_at,
          genre_id,
          feature_size,
          homepage_sections,
          pros,
          cons,
          min_os,
          min_processor,
          min_memory,
          min_graphics,
          min_storage,
          rec_os,
          rec_processor,
          rec_memory,
          rec_graphics,
          rec_storage,
          developer,
          publisher,
          age_rating,
          price_usd,
          price_gbp,
          price_eur,
          release_date,
          systems,
          screenshots,
          youtube_trailer_url,
          online_coop,
          couch_coop,
          split_screen,
          max_players,
          image_position,
          custom_section_name,
          scheduled_for,
          purchase_links,
          author:profiles!inner(
            username,
            avatar_url,
            bio
          ),
          genre:genres!inner(
            name
          ),
          awards,
          award_dates
        `)
        .eq('id', reviewId)
        .single() as { data: ReviewResponse | null, error: Error | null };

      if (reviewError) throw reviewError;
      if (!reviewData) {
        setReview(null);
        setIsLoading(false);
        return;
      }

      const formattedReview: ReviewData = {
        id: reviewData.id,
        title: reviewData.title,
        image: reviewData.image,
        headingImage: reviewData.heading_image,
        rating: reviewData.rating,
        excerpt: reviewData.excerpt,
        content: reviewData.content,
        imagePosition: reviewData.image_position,
        author: {
          name: reviewData.author?.username || 'Anonymous',
          avatar: reviewData.author?.avatar_url || 'https://i.pravatar.cc/150',
          title: 'Game Reviewer',
          bio: reviewData.author?.bio || null
        },
        likes: reviewData.likes || 0,
        genre: reviewData.genre?.name || 'Uncategorized',
        publishedDate: reviewData.published_date || new Date().toISOString(),
        createdAt: reviewData.created_at,
        updatedAt: reviewData.updated_at,
        genreId: reviewData.genre_id,
        playtime: reviewData.playtime || 0,
        homepageSections: reviewData.homepage_sections || [],
        pros: reviewData.pros || [],
        cons: reviewData.cons || [],
        screenshots: reviewData.screenshots?.map((s: any) => s.url) || [],
        featureSize: reviewData.feature_size || 'normal',
        minOS: reviewData.min_os,
        minProcessor: reviewData.min_processor,
        minMemory: reviewData.min_memory,
        minGraphics: reviewData.min_graphics,
        minStorage: reviewData.min_storage,
        recOS: reviewData.rec_os,
        recProcessor: reviewData.rec_processor,
        recMemory: reviewData.rec_memory,
        recGraphics: reviewData.rec_graphics,
        recStorage: reviewData.rec_storage,
        specifications: {
          minimum: {
            os: reviewData.min_os || 'Not specified',
            processor: reviewData.min_processor || 'Not specified',
            memory: reviewData.min_memory || 'Not specified',
            graphics: reviewData.min_graphics || 'Not specified',
            storage: reviewData.min_storage || 'Not specified'
          },
          recommended: {
            os: reviewData.rec_os || 'Not specified',
            processor: reviewData.rec_processor || 'Not specified',
            memory: reviewData.rec_memory || 'Not specified',
            graphics: reviewData.rec_graphics || 'Not specified',
            storage: reviewData.rec_storage || 'Not specified'
          }
        },
        developer: reviewData.developer || 'Not specified',
        publisher: reviewData.publisher || 'Not specified',
        ageRating: reviewData.age_rating || 'Not specified',
        priceUSD: reviewData.price_usd || 0,
        priceGBP: reviewData.price_gbp || 0,
        priceEUR: reviewData.price_eur || 0,
        releaseDate: reviewData.release_date || new Date().toISOString(),
        systems: reviewData.systems || [],
        awards: reviewData.awards || [],
        award_dates: reviewData.award_dates || {},
        youtubeTrailerUrl: reviewData.youtube_trailer_url || null,
        customSectionName: reviewData.custom_section_name,
        scheduledFor: reviewData.scheduled_for,
        online_coop: reviewData.online_coop || false,
        couch_coop: reviewData.couch_coop || false,
        split_screen: reviewData.split_screen || false,
        max_players: reviewData.max_players || 0,
        purchaseLinks: reviewData.purchase_links || []
      };

      setReview(formattedReview);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching review:', error);
      toast.error('Failed to load review');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <StaticStarsBackground />
        <AuroraBackground />
        <ShootingStarsBackground />
        <p className="text-muted-foreground relative z-10">Loading...</p>
      </div>
    );
  }

  if (!review) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen relative">
      <StaticStarsBackground />
      <AuroraBackground />
      <ShootingStarsBackground />
      
      {/* Main image with fade effect */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(to bottom, transparent 0%, var(--background) 100%), url(${review.headingImage || review.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.15,
        }}
      />

      {/* Content */}
      <div className="relative z-30">
        <ReviewHeader review={review} />
        <div className="container mx-auto px-4 -mt-16 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content Column */}
            <div className="lg:col-span-8 lg:sticky lg:top-8 lg:h-fit">
              {/* Author Info Card */}
              <Card className="p-8 mb-8 bg-card/95 backdrop-blur-md">
                <div className="flex items-center">
                  <Link to={`/author/${review.author.name}`} className="group/author shrink-0">
                    <div className="flex items-center gap-4">
                      <img
                        src={review.author.avatar}
                        alt={review.author.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <h3 className="font-semibold group-hover/author:text-rose-500 transition-colors gradient-text">{review.author.name}</h3>
                        <p className="text-sm text-muted-foreground">{review.author.title}</p>
                      </div>
                    </div>
                  </Link>
                  
                  {review.author.bio && (
                    <>
                      <div className="mx-6 self-stretch border-l border-rose-200/30 h-16" />
                      <p className="text-sm text-muted-foreground flex-1 leading-relaxed">
                        {review.author.bio}
                      </p>
                    </>
                  )}
                </div>
              </Card>

              {/* Summary Card */}
              <Card className="p-8 mb-8 bg-card/95 backdrop-blur-md">
                <h3 className="font-semibold mb-4 gradient-text">Summary</h3>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {review.excerpt}
                </p>
              </Card>

              {/* Pros/Cons Card */}
              <Card className="p-8 mb-8 bg-card/95 backdrop-blur-md">
                <h3 className="font-semibold mb-6 gradient-text">Pros & Cons</h3>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <ThumbsUp className="w-5 h-5 text-green-500" />
                      Pros
                    </h4>
                    <ul className="space-y-2">
                      {review.pros.map((pro, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <ThumbsDown className="w-5 h-5 text-rose-500" />
                      Cons
                    </h4>
                    <ul className="space-y-2">
                      {review.cons.map((con, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Main Article */}
              <Card className="p-8 mb-8 bg-card/95 backdrop-blur-md">
                <article className="prose prose-lg dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {review.content}
                  </ReactMarkdown>
                </article>
              </Card>
            </div>
            {/* Sidebar Column */}
            <div className="lg:col-span-4 lg:sticky lg:top-8 lg:h-fit pb-8">
              <ReviewSidebar review={review} />
            </div>
          </div>
          <ReviewGallery screenshots={review.screenshots} />
          
          {/* Latest Reviews Carousel */}
          {latestReviews.length > 0 && (
            <Card className="p-8 bg-card/95 backdrop-blur-md mt-8">
              <h3 className="text-2xl font-semibold mb-6 flex items-center justify-center gap-2 gradient-text">
                Latest Reviews
              </h3>
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                  skipSnaps: false,
                  dragFree: true,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-4">
                  {latestReviews.map((review, index) => (
                    <CarouselItem key={review.id} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                      >
                        <MediumCard {...review} />
                      </motion.div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="flex items-center justify-end space-x-2 mt-4">
                  <CarouselPrevious className="border-rose-400 text-rose-400 hover:bg-rose-50 hover:text-rose-500" />
                  <CarouselNext className="border-rose-400 text-rose-400 hover:bg-rose-50 hover:text-rose-500" />
                </div>
              </Carousel>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SingleReview;
