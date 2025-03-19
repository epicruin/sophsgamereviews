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
  likes?: number;
}

export const LatestArticlesSection = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    fetchLatestArticles();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

      // Initialize articles with likes=0
      const articlesWithLikes: Article[] = (articlesData || []).map(article => ({
        ...article,
        likes: 0
      }));

      // Fetch likes for all articles
      if (articlesWithLikes.length > 0) {
        try {
          const likesPromises = articlesWithLikes.map(article => 
            supabase
              .from('likes')
              .select('*', { count: 'exact' })
              .eq('article_id', article.id)
              .then(({ count, error }) => {
                if (error) {
                  console.error(`Error fetching likes for article ${article.id}:`, error);
                  return 0;
                }
                return count || 0;
              })
          );

          const likesResults = await Promise.all(likesPromises);
          
          // Update articles with likes counts
          articlesWithLikes.forEach((article, index) => {
            article.likes = likesResults[index];
          });
        } catch (likesError) {
          console.error("Error fetching likes for articles:", likesError);
        }
      }

      setArticles(articlesWithLikes);
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

  // Determine article display count based on screen width
  // 9 on large screens (lg+), 6 on medium screens (md), 3 on small screens (640-768px), 2 on smaller screens (480-640px), 2 on mobile
  const getArticlesPerPage = () => {
    if (windowWidth >= 1024) return 9; // lg and above: 9 articles
    if (windowWidth >= 768) return 6;  // md: 6 articles
    if (windowWidth >= 640) return 3;  // sm (640-768px): 3 articles
    if (windowWidth >= 480) return 2;  // sm (480-640px): 2 articles
    return 2;                          // xs (<480px): 2 articles
  };

  // Split articles into chunks for the carousel based on screen size
  const getArticleSlides = () => {
    const articlesPerPage = getArticlesPerPage();
    const slidesCount = Math.ceil(articles.length / articlesPerPage);
    return Array.from({ length: slidesCount }).map((_, slideIndex) => ({
      slideIndex,
      items: articles.slice(slideIndex * articlesPerPage, (slideIndex + 1) * articlesPerPage)
    }));
  };

  const slides = getArticleSlides();

  return (
    <div id="latest-articles" className="container mx-auto px-4 pt-6">
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
              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-3">
                {windowWidth < 480 ? (
                  // For mobile screens (<480px) - up to 2 articles
                  slide.items.slice(0, 2).map((article) => (
                    <div key={article.id} className="w-full col-span-1">
                      <ArticleLargeCard 
                        id={article.id}
                        title={article.title}
                        image={article.image}
                        excerpt={article.summary}
                        author={{
                          name: article.author?.username || 'Anonymous',
                          avatar: article.author?.avatar_url || '',
                        }}
                        likes={article.likes}
                      />
                    </div>
                  ))
                ) : windowWidth < 640 ? (
                  // For small screens (480-640px) - up to 2 articles 
                  slide.items.slice(0, 2).map((article) => (
                    <div key={article.id} className="w-full col-span-1">
                      <ArticleLargeCard 
                        id={article.id}
                        title={article.title}
                        image={article.image}
                        excerpt={article.summary}
                        author={{
                          name: article.author?.username || 'Anonymous',
                          avatar: article.author?.avatar_url || '',
                        }}
                        likes={article.likes}
                      />
                    </div>
                  ))
                ) : windowWidth < 768 ? (
                  // For small screens (640-768px) - up to 3 articles
                  slide.items.slice(0, 3).map((article) => (
                    <div key={article.id} className="w-full col-span-1">
                      <ArticleLargeCard 
                        id={article.id}
                        title={article.title}
                        image={article.image}
                        excerpt={article.summary}
                        author={{
                          name: article.author?.username || 'Anonymous',
                          avatar: article.author?.avatar_url || '',
                        }}
                        likes={article.likes}
                      />
                    </div>
                  ))
                ) : windowWidth < 1024 ? (
                  // For medium screens (up to 6 articles)
                  <>
                    {/* First row of 3 */}
                    {slide.items.slice(0, 3).map((article) => (
                      <div key={article.id} className="w-full col-span-1">
                        <ArticleLargeCard 
                          id={article.id}
                          title={article.title}
                          image={article.image}
                          excerpt={article.summary}
                          author={{
                            name: article.author?.username || 'Anonymous',
                            avatar: article.author?.avatar_url || '',
                          }}
                          likes={article.likes}
                        />
                      </div>
                    ))}
                    
                    {/* Second row of 3 if there are more */}
                    {slide.items.length > 3 && (
                      <>
                        {slide.items.slice(3, 6).map((article) => (
                          <div key={article.id} className="w-full col-span-1 mt-3">
                            <ArticleLargeCard 
                              id={article.id}
                              title={article.title}
                              image={article.image}
                              excerpt={article.summary}
                              author={{
                                name: article.author?.username || 'Anonymous',
                                avatar: article.author?.avatar_url || '',
                              }}
                              likes={article.likes}
                            />
                          </div>
                        ))}
                      </>
                    )}
                  </>
                ) : (
                  // For large screens (up to 9 articles)
                  <>
                    {/* First row of 3 */}
                    {slide.items.slice(0, 3).map((article) => (
                      <div key={article.id} className="w-full col-span-1">
                        <ArticleLargeCard 
                          id={article.id}
                          title={article.title}
                          image={article.image}
                          excerpt={article.summary}
                          author={{
                            name: article.author?.username || 'Anonymous',
                            avatar: article.author?.avatar_url || '',
                          }}
                          likes={article.likes}
                        />
                      </div>
                    ))}
                    
                    {/* Second row of 3 if there are more */}
                    {slide.items.length > 3 && (
                      <>
                        {slide.items.slice(3, 6).map((article) => (
                          <div key={article.id} className="w-full col-span-1 mt-3">
                            <ArticleLargeCard 
                              id={article.id}
                              title={article.title}
                              image={article.image}
                              excerpt={article.summary}
                              author={{
                                name: article.author?.username || 'Anonymous',
                                avatar: article.author?.avatar_url || '',
                              }}
                              likes={article.likes}
                            />
                          </div>
                        ))}
                      </>
                    )}
                    
                    {/* Third row of 3 if there are more */}
                    {slide.items.length > 6 && (
                      <>
                        {slide.items.slice(6, 9).map((article) => (
                          <div key={article.id} className="w-full col-span-1 mt-3">
                            <ArticleLargeCard 
                              id={article.id}
                              title={article.title}
                              image={article.image}
                              excerpt={article.summary}
                              author={{
                                name: article.author?.username || 'Anonymous',
                                avatar: article.author?.avatar_url || '',
                              }}
                              likes={article.likes}
                            />
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}; 