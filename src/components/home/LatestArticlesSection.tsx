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
  scheduled_for?: string | null;
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

      const { data: articlesData, error } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          summary,
          image,
          published_date,
          scheduled_for,
          author:profiles!inner(
            username,
            avatar_url
          )
        `)
        .or(`scheduled_for.is.null,scheduled_for.lt.${now}`) // Only published articles
        .order('published_date', { ascending: false })

      if (error) {
        throw error;
      }
      setArticles(articlesData || []);
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

  // Split articles into chunks for the carousel (3 rows of 3)
  const getArticleSlides = () => {
    const slidesCount = Math.ceil(articles.length / 9);
    return Array.from({ length: slidesCount }).map((_, slideIndex) => ({
      slideIndex,
      items: articles.slice(slideIndex * 9, (slideIndex + 1) * 9)
    }));
  };

  const slides = getArticleSlides();
  console.log("Slides created:", slides.length);

  return (
    <div className="container mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold antialiased">
          <div className="gradient-text inline-block">
            Latest Articles
          </div>
        </h2>
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
        {slides.length > 1 && (
          <div className="flex items-center justify-end gap-2 mb-4">
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
        <CarouselContent>
          {slides.map((slide) => (
            <CarouselItem key={slide.slideIndex}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-3 gap-y-3">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-3 gap-y-3 mt-3">
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
              
              {slide.items.length > 6 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-3 gap-y-3 mt-3">
                  {slide.items.slice(6, 9).map((article) => (
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
    </div>
  );
}; 