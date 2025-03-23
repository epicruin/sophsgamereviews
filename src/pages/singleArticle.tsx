import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Clock, User, BookOpen, ArrowLeft, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StaticStarsBackground } from "@/components/home/StaticStarsBackground";
import { AuroraBackground } from "@/components/home/AuroraBackground";
import { AuroraBackgroundBlue } from "@/components/home/AuroraBackgroundBlue";
import { ShootingStarsBackground } from "@/components/home/ShootingStarsBackground";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Badge } from "@/components/ui/badge";
import { ArticleLargeCard } from "@/components/cards/ArticleLargeCard";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { motion } from "framer-motion";
import { MediumCard } from "@/components/cards/MediumCard";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useBackgroundSettings } from "@/hooks/useBackgroundSettings";
import { StaticBackground } from "@/components/home/StaticBackground";

interface ArticleData {
  id: string;
  title: string;
  summary: string;
  content: string;
  tldr: string;
  image: string;
  author_id: string;
  published_date: string;
  created_at: string;
  author?: {
    username: string;
    avatar_url?: string;
    bio?: string;
  };
}

// Interface for latest articles carousel
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

// Interface for latest reviews carousel
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

const SingleArticle = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestArticles, setLatestArticles] = useState<LatestArticle[]>([]);
  const [latestReviews, setLatestReviews] = useState<LatestReview[]>([]);
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { articleBackground } = useBackgroundSettings();

  useEffect(() => {
    document.documentElement.style.scrollBehavior = '';
    document.body.style.scrollBehavior = '';
    document.documentElement.classList.remove('smooth-scroll');
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('articles')
          .select(`
            *,
            author:profiles(username, avatar_url, bio)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Article not found");
        
        // Only show published articles or ones that have been scheduled and the time has passed
        const now = new Date();
        if (!data.published_date && (!data.scheduled_for || new Date(data.scheduled_for) > now)) {
          throw new Error("Article not yet published");
        }
        
        setArticle(data);
        
        // After getting the article, fetch latest articles and reviews
        fetchLatestArticles(data.id);
        fetchLatestReviews();
      } catch (error: any) {
        console.error("Error fetching article:", error);
        setError(error.message || "Failed to load article");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchArticle();
    }
  }, [id]);
  
  const fetchLatestArticles = async (currentArticleId: string) => {
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
        .neq('id', currentArticleId) // Exclude current article
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
  
  const fetchLatestReviews = async () => {
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
    }
  };

  useEffect(() => {
    if (article?.id) {
      fetchLikesCount(article.id);
    }
  }, [article?.id]);

  const fetchLikesCount = async (articleId: string) => {
    try {
      // Get the count of likes for this article
      const { data, error } = await supabase
        .from('likes')
        .select('*')
        .eq('article_id', articleId);
      
      if (error) throw error;
      setLikes(data?.length || 0);
      
      // Check if user has liked this article before in localStorage
      const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '[]');
      setHasLiked(likedArticles.includes(articleId));
    } catch (error) {
      console.error('Error fetching likes count:', error);
      toast.error('Failed to load likes count');
    }
  };
  
  const handleLike = async () => {
    if (!article?.id) return;
    
    // Get current liked articles from localStorage
    const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '[]');
    
    if (hasLiked) {
      // Remove from local storage first
      const updatedLikedArticles = likedArticles.filter((id: string) => id !== article.id);
      localStorage.setItem('likedArticles', JSON.stringify(updatedLikedArticles));
      
      // Update UI immediately 
      setHasLiked(false);
      setLikes(prev => Math.max(0, prev - 1));
      
      // Try database operation, but don't block UI update
      try {
        // First find all likes for this article
        const { data: existingLikes, error: fetchError } = await supabase
          .from('likes')
          .select('id')
          .eq('article_id', article.id);
        
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
      } catch (error) {
        console.error('Error removing like in database:', error);
        // UI already updated, so no need to revert
      }
    } else {
      // Add to local storage first
      likedArticles.push(article.id);
      localStorage.setItem('likedArticles', JSON.stringify(likedArticles));
      
      // Update UI immediately
      setHasLiked(true);
      setLikes(prev => prev + 1);
      
      // Try database operation, but don't block UI update
      try {
        // Insert new like
        const { error: insertError } = await supabase
          .from('likes')
          .insert({ article_id: article.id });
        
        if (insertError) throw insertError;
      } catch (error) {
        console.error('Error adding like in database:', error);
        // UI already updated, so no need to revert
      }
    }
  };

  // Add scroll listener effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <StaticStarsBackground />
        <ShootingStarsBackground />
        <p className="text-muted-foreground relative z-10">Loading...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <StaticStarsBackground />
        <ShootingStarsBackground />
        <p className="text-muted-foreground relative z-10">Article not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <StaticStarsBackground />
      {articleBackground === undefined ? null : articleBackground === 'aurora' ? (
        <AuroraBackground />
      ) : articleBackground === 'auroraBlue' ? (
        <AuroraBackgroundBlue />
      ) : (
        <StaticBackground color={articleBackground} />
      )}
      <ShootingStarsBackground />
      
      {/* Full width hero header with image */}
      <section className="relative w-[99.2vw] h-[85vh] -mt-20 -ml-[calc((99.2vw-100%)/2)]">
        <div className="absolute inset-0">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover"
            style={{
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent" />
        </div>
        
        {/* Header content - centered in image */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
          <div className="container mx-auto max-w-6xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white drop-shadow-lg">{article.title}</h1>
            
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-8">
              <Badge variant="secondary" className="bg-black/40 hover:bg-black/50 backdrop-blur-sm text-white border-none flex items-center gap-1.5 md:gap-2 py-1.5 md:py-2 px-3 md:px-4">
                <Clock className="w-4 md:w-5 h-4 md:h-5" />
                <span className="text-base md:text-lg">{format(new Date(article.published_date || article.created_at), "MMMM d, yyyy")}</span>
              </Badge>
              <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-none py-1.5 md:py-2 px-3 md:px-4 text-base md:text-lg">
                Article
              </Badge>
            </div>
            
            {/* Heart button in hero section - only visible when not scrolled */}
            <div className={`flex justify-center w-full mt-4 transition-opacity duration-300 ${isScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <div className="bg-black/40 backdrop-blur-md p-4 rounded-full shadow-lg transition-all hover:bg-black/50">
                <button
                  onClick={handleLike}
                  className="flex flex-col items-center gap-2 group"
                  aria-label={hasLiked ? "Unlike this article" : "Like this article"}
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
            aria-label={hasLiked ? "Unlike this article" : "Like this article"}
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
      
      {/* Content - positioned to overlap the fading hero image */}
      <div className="relative z-10 container mx-auto px-4 -mt-32">
        <div className="w-full max-w-5xl mx-auto">
          {/* Author Info Card - added at the top similar to review page */}
          <Card className="p-8 mb-8 bg-card/95 backdrop-blur-md">
            <div className="flex items-center">
              <Link to={`/author/${article.author?.username}`} className="group/author shrink-0">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={article.author?.avatar_url} alt={article.author?.username} />
                    <AvatarFallback>{article.author?.username?.substring(0, 2) || "AN"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold group-hover/author:text-rose-500 transition-colors gradient-text">{article.author?.username || "Anonymous"}</h3>
                    <p className="text-sm text-muted-foreground">Game Writer</p>
                  </div>
                </div>
              </Link>
              
              {article.author?.bio && (
                <>
                  <div className="mx-6 self-stretch border-l border-rose-200/30 h-16" />
                  <p className="text-sm text-muted-foreground flex-1 leading-relaxed">
                    {article.author.bio}
                  </p>
                </>
              )}
            </div>
          </Card>

          {article.summary && (
            <Card className="p-8 mb-8 bg-card/95 backdrop-blur-md">
              <h3 className="font-semibold mb-4 gradient-text">Summary</h3>
              <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {article.summary}
                </ReactMarkdown>
              </div>
            </Card>
          )}
          
          <Card className="p-8 mb-8 bg-card/95 backdrop-blur-md">
            <article className="prose prose-lg dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {article.content}
              </ReactMarkdown>
            </article>
          </Card>
          
          {article.tldr && (
            <Card className="p-8 mb-8 bg-card/95 backdrop-blur-md border-rose-500/20">
              <h3 className="font-semibold mb-4 gradient-text">TL;DR</h3>
              <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {article.tldr}
                </ReactMarkdown>
              </div>
            </Card>
          )}
          
          {/* Latest Articles Carousel */}
          {latestArticles.length > 0 && (
            <Card className="p-8 mt-12 mb-8 bg-card/95 backdrop-blur-md">
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
                  breakpoints: {
                    '(min-width: 1024px)': { slidesToScroll: 3 },
                    '(min-width: 768px) and (max-width: 1023px)': { slidesToScroll: 2 },
                    '(max-width: 767px)': { slidesToScroll: 1 }
                  }
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
          
          {/* Latest Reviews Carousel */}
          {latestReviews.length > 0 && (
            <Card className="p-8 bg-card/95 backdrop-blur-md mb-12">
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
                  breakpoints: {
                    '(min-width: 1024px)': { slidesToScroll: 4 },
                    '(min-width: 768px) and (max-width: 1023px)': { slidesToScroll: 3 },
                    '(min-width: 640px) and (max-width: 767px)': { slidesToScroll: 2 },
                    '(max-width: 639px)': { slidesToScroll: 1 }
                  }
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

export default SingleArticle; 