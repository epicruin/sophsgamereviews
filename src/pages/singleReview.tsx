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
import { ThumbsUp, ThumbsDown, Star, Medal, Gem, Coffee, Library, Clock, Users, Heart } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { StaticStarsBackground } from "@/components/home/StaticStarsBackground";
import { AuroraBackground } from "@/components/home/AuroraBackground";
import { ShootingStarsBackground } from "@/components/home/ShootingStarsBackground";
import { Link } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { motion } from "framer-motion";
import { MediumCard } from "@/components/cards/MediumCard";
import { ArticleLargeCard } from "@/components/cards/ArticleLargeCard";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

// Type for latest articles
interface LatestArticle {
  id: string;
  title: string;
  image: string;
  imagePosition?: number;
  summary: string;
  author: {
    name: string;
    avatar: string;
  };
  likes: number;
}

const SingleReview = () => {
  const { id } = useParams<{ id: string }>();
  const [review, setReview] = useState<ReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [latestReviews, setLatestReviews] = useState<LatestReview[]>([]);
  const [latestArticles, setLatestArticles] = useState<LatestArticle[]>([]);
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
      fetchLatestArticles();
    }
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!review) return;
    
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
  }, [review]);

  const fetchLatestArticles = async () => {
    try {
      const now = new Date().toISOString();
      
      const { data: articlesData, error: articlesError } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          image,
          summary,
          published_date,
          scheduled_for,
          author:profiles!inner(
            username,
            avatar_url
          )
        `)
        .or(`scheduled_for.is.null,scheduled_for.lt.${now}`) // Only published articles
        .order('created_at', { ascending: false })
        .limit(18);

      if (articlesError) throw articlesError;

      if (articlesData) {
        // Create initial array with all fields except for the likes
        const formattedArticles: LatestArticle[] = articlesData.map(article => ({
          id: article.id,
          title: article.title,
          image: article.image,
          imagePosition: 50, // Default position
          summary: article.summary,
          author: {
            name: article.author?.username || 'Anonymous',
            avatar: article.author?.avatar_url || 'https://i.pravatar.cc/150',
          },
          likes: 0 // Default value will be updated
        }));

        // Now fetch likes for all articles
        await Promise.all(
          formattedArticles.map(async (article, index) => {
            try {
              const { data: likesData, error: likesError } = await supabase
                .from('likes')
                .select('*')
                .eq('article_id', article.id);

              if (!likesError && likesData) {
                formattedArticles[index].likes = likesData.length;
              }
            } catch (error) {
              console.error(`Error fetching likes for article ${article.id}:`, error);
            }
          })
        );

        setLatestArticles(formattedArticles);
      }
    } catch (error) {
      console.error('Error fetching latest articles:', error);
    }
  };

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

  const handleLike = async () => {
    if (!review) return;
    
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

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
            <div className="container mx-auto max-w-6xl mt-20">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white drop-shadow-lg">{review.title}</h1>
              
              <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-8">
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
              
              {/* Heart button in hero section - only visible when not scrolled */}
              <div className={`flex justify-center w-full mt-4 transition-opacity duration-300 ${isScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <div className="bg-black/40 backdrop-blur-md p-4 rounded-full shadow-lg transition-all hover:bg-black/50">
                  <button
                    onClick={handleLike}
                    className="flex flex-col items-center gap-2 group"
                    aria-label={hasLiked ? "Unlike this review" : "Like this review"}
                  >
                    <Heart 
                      className={cn(
                        "w-12 h-12 stroke-2 transition-all duration-300",
                        hasLiked 
                          ? "text-rose-500 fill-rose-500" 
                          : "text-rose-500 hover:fill-rose-500/20"
                      )}
                    />
                    <span className="text-white text-xl font-semibold">{likes}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Floating like button that follows scroll - only visible when scrolled */}
        <div className={`fixed right-6 top-1/2 transform -translate-y-1/2 z-50 transition-all duration-500 ${
          isScrolled 
            ? 'opacity-100 translate-x-0' 
            : 'opacity-0 translate-x-20 pointer-events-none'
        }`}>
          <div className="bg-black/40 backdrop-blur-md p-4 rounded-full shadow-lg transition-all hover:bg-black/50">
            <button
              onClick={handleLike}
              className="flex flex-col items-center gap-2"
              aria-label={hasLiked ? "Unlike this review" : "Like this review"}
            >
              <Heart 
                className={cn(
                  "w-12 h-12 stroke-2 transition-all duration-300",
                  hasLiked 
                    ? "text-rose-500 fill-rose-500" 
                    : "text-rose-500 hover:fill-rose-500/20"
                )}
              />
              <span className="text-white text-xl font-semibold">{likes}</span>
            </button>
          </div>
        </div>
        
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
                  dragFree: false,
                  containScroll: "trimSnaps",
                  slidesToScroll: 4
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
          
          {/* Latest Articles Carousel */}
          {latestArticles.length > 0 && (
            <Card className="p-8 bg-card/95 backdrop-blur-md mt-8 mb-12">
              <h3 className="text-2xl font-semibold mb-6 flex items-center justify-center gap-2 gradient-text">
                Latest Articles
              </h3>
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                  skipSnaps: false,
                  dragFree: false,
                  containScroll: "trimSnaps",
                  slidesToScroll: 3
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-4">
                  {latestArticles.map((article, index) => (
                    <CarouselItem key={article.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                      >
                        <ArticleLargeCard
                          id={article.id}
                          title={article.title}
                          image={article.image}
                          imagePosition={article.imagePosition}
                          excerpt={article.summary}
                          author={article.author}
                          likes={article.likes}
                        />
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
