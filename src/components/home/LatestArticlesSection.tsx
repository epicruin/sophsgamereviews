import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArticleLargeCard } from "@/components/cards/ArticleLargeCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi
} from "@/components/ui/carousel";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Article {
  id: string;
  title: string;
  summary: string;
  image: string;
  published_date: string;
  author_id: string;
  author?: {
    username: string;
    avatar_url?: string;
  };
}

export const LatestArticlesSection = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetchLatestArticles();
  }, []);

  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      setCurrent(carouselApi.selectedScrollSnap());
    };

    const onResize = () => {
      setCount(carouselApi.scrollSnapList().length);
    };

    carouselApi.on("select", onSelect);
    carouselApi.on("reInit", onSelect);
    carouselApi.on("reInit", onResize);
    
    onSelect();
    onResize();

    return () => {
      carouselApi.off("select", onSelect);
      carouselApi.off("reInit", onSelect);
      carouselApi.off("reInit", onResize);
    };
  }, [carouselApi]);

  const fetchLatestArticles = async () => {
    try {
      setIsLoading(true);
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('articles')
        .select('id, title, summary, image, published_date, author_id, author:profiles(username, avatar_url)')
        .lte('published_date', now)
        .is('scheduled_for', null)
        .order('published_date', { ascending: false })
        .limit(6);

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error("Error fetching latest articles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-8 text-rose-500">Latest Articles</h2>
        <div className="flex justify-center">
          <p className="text-muted-foreground">Loading articles...</p>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return null; // Don't show the section if there are no articles
  }

  // Split articles into chunks for the carousel (2 rows of 3)
  const getArticleSlides = () => {
    const slidesCount = Math.ceil(articles.length / 6);
    return Array.from({ length: slidesCount }).map((_, slideIndex) => ({
      slideIndex,
      items: articles.slice(slideIndex * 6, (slideIndex + 1) * 6)
    }));
  };

  const slides = getArticleSlides();

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold antialiased">
          <div className="gradient-text inline-block">
            Latest Articles
          </div>
        </h2>
        
        {slides.length > 1 && (
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CarouselPrevious 
                    className="static transform-none data-[disabled]:opacity-30 h-9 w-9"
                    aria-label="Previous slide"
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Previous slide
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CarouselNext 
                    className="static transform-none data-[disabled]:opacity-30 h-9 w-9"
                    aria-label="Next slide"
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Next slide
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
      
      <Carousel
        opts={{
          align: "start",
          loop: true,
          skipSnaps: false,
          dragFree: false,
        }}
        className="w-full"
        setApi={setCarouselApi}
      >
        <CarouselContent>
          {slides.map((slide) => (
            <CarouselItem key={slide.slideIndex}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8">
                {slide.items.slice(0, Math.min(3, slide.items.length)).map((article) => (
                  <div key={article.id} className="w-full">
                    <ArticleLargeCard 
                      id={article.id}
                      title={article.title}
                      image={article.image}
                      excerpt={article.summary}
                      author={{
                        name: article.author?.username || 'Anonymous',
                        avatar: article.author?.avatar_url || '',
                      }}
                    />
                  </div>
                ))}
              </div>
              
              {slide.items.length > 3 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8 mt-8">
                  {slide.items.slice(3, 6).map((article) => (
                    <div key={article.id} className="w-full">
                      <ArticleLargeCard 
                        id={article.id}
                        title={article.title}
                        image={article.image}
                        excerpt={article.summary}
                        author={{
                          name: article.author?.username || 'Anonymous',
                          avatar: article.author?.avatar_url || '',
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      
      {slides.length > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex gap-1">
            {Array.from({ length: count }).map((_, i) => (
              <button
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === current ? "bg-rose-500" : "bg-rose-500/30"
                }`}
                onClick={() => carouselApi?.scrollTo(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 