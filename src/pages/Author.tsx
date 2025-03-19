import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuroraBackground } from "@/components/home/AuroraBackground";
import { ShootingStarsBackground } from "@/components/home/ShootingStarsBackground";
import { StaticStarsBackground } from "@/components/home/StaticStarsBackground";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { SectionContainer } from "@/components/shared/SectionContainer";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselPrevious, 
  CarouselNext 
} from "@/components/ui/carousel";
import { ArticleLargeCard } from "@/components/cards/ArticleLargeCard";
import { cn } from "@/lib/utils";

interface AuthorProfile {
  id: string;
  username: string;
  avatar_url: string;
  bio: string | null;
  title: string;
}

interface Article {
  id: string;
  title: string;
  image: string;
  summary: string;
  author: {
    name: string;
    avatar: string;
  };
  likes: number;
  imagePosition?: number;
}

const Author = () => {
  const { username } = useParams();
  const [author, setAuthor] = useState<AuthorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bioDialogOpen, setBioDialogOpen] = useState(false);
  const [authorArticles, setAuthorArticles] = useState<Article[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);
  const [activeSection, setActiveSection] = useState<'reviews' | 'articles'>('reviews');

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchAuthor();
  }, [username]);

  const fetchAuthor = async () => {
    try {
      // Fetch author profile
      const { data: authorData, error: authorError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio')
        .eq('username', username)
        .single();

      if (authorError) throw authorError;
      if (!authorData) {
        setAuthor(null);
        setIsLoading(false);
        return;
      }

      setAuthor({
        id: authorData.id,
        username: authorData.username,
        avatar_url: authorData.avatar_url,
        bio: authorData.bio,
        title: 'Game Reviewer'
      });
      
      // Fetch author's articles
      fetchAuthorArticles(authorData.id);
    } catch (error) {
      console.error('Error fetching author:', error);
      toast.error('Failed to load author profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuthorArticles = async (authorId: string) => {
    try {
      setIsLoadingArticles(true);
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          image,
          summary,
          published_date,
          author:profiles!inner(
            username,
            avatar_url
          )
        `)
        .eq('author_id', authorId)
        .or(`scheduled_for.is.null,scheduled_for.lt.${now}`) // Only published articles
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Create initial array with all fields except for the likes
        const formattedArticles: Article[] = data.map(article => ({
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

        setAuthorArticles(formattedArticles);
      }
    } catch (error) {
      console.error('Error fetching author articles:', error);
      toast.error('Failed to load author articles');
    } finally {
      setIsLoadingArticles(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-500" />
      </div>
    );
  }

  if (!author) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-4xl font-bold text-center">Author not found</h1>
      </div>
    );
  }

  // Create author profile card to place in the middle column
  const AuthorProfileCard = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center"
    >
      <Card className="p-3 bg-card/95 backdrop-blur-md border-rose-200/30 w-[500px] max-w-full">
        <div className="flex flex-row items-center">
          <div className="flex items-center gap-3 shrink-0">
            <Avatar className="w-10 h-10 rounded-full">
              <AvatarImage
                src={author.avatar_url}
                alt={author.username}
                className="object-cover"
              />
              <AvatarFallback className="rounded-full text-sm">
                {author.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{author.username}</span>
              <span className="text-xs text-muted-foreground">{author.title}</span>
            </div>
          </div>
          
          {author.bio && (
            <>
              <div className="mx-3 self-stretch border-l border-rose-200/30" />
              <Dialog open={bioDialogOpen} onOpenChange={setBioDialogOpen}>
                <DialogTrigger asChild>
                  <p className="text-xs text-muted-foreground flex-1 leading-relaxed line-clamp-2 cursor-pointer hover:text-primary transition-colors">
                    {author.bio}
                  </p>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] bg-gradient-to-b from-rose-50/90 via-rose-100/70 to-rose-50/90 border-rose-200/40">
                  <DialogHeader>
                    <DialogTitle className="mb-2 text-center">{author.username}'s Bio</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col items-center -mt-1">
                    <div className="text-center mb-3">
                      <Avatar className="w-16 h-16 rounded-full mx-auto mb-2">
                        <AvatarImage
                          src={author.avatar_url}
                          alt={author.username}
                          className="object-cover"
                        />
                        <AvatarFallback className="rounded-full text-base">
                          {author.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col justify-center">
                        <span className="text-base font-medium">{author.username}</span>
                        <span className="text-sm text-muted-foreground">{author.title}</span>
                      </div>
                    </div>
                    
                    <div className="w-full h-px bg-rose-200/40 my-3" />
                    
                    <p className="text-sm text-muted-foreground w-full leading-relaxed text-center">
                      {author.bio}
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </Card>
    </motion.div>
  );

  // Create a custom title for the sections
  const SectionTitle = (
    <div className="container mx-auto flex items-center justify-center xl:justify-start mb-6">
      <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold antialiased translate-y-10">
        <div className="gradient-text inline-block">
          <span 
            className={cn(
              "cursor-pointer transition-colors", 
              activeSection === 'reviews' ? "text-rose-500" : "text-muted-foreground hover:text-rose-400"
            )}
            onClick={() => setActiveSection('reviews')}
          >
            REVIEWS
          </span>
          <span className="text-muted-foreground mx-4">|</span>
          <span 
            className={cn(
              "cursor-pointer transition-colors", 
              activeSection === 'articles' ? "text-rose-500" : "text-muted-foreground hover:text-rose-400"
            )}
            onClick={() => setActiveSection('articles')}
          >
            ARTICLES
          </span>
        </div>
      </h2>
    </div>
  );

  return (
    <div className="relative">
      <StaticStarsBackground />
      <AuroraBackground />
      <ShootingStarsBackground />

      <div className="relative z-10 container mx-auto px-4 py-0 -mt-3">
        <div className="-mt-3">
          {/* Always render the title in the same position */}
          <div className="py-4">
            {SectionTitle}
          </div>
          
          {activeSection === 'reviews' && (
            <SectionContainer
              id="author-reviews"
              title={<div style={{visibility: 'hidden'}}>{SectionTitle}</div>}
              sectionType="reviews"
              authorId={author.id}
              variant="medium"
              className="py-0 -mt-16"
              showTitle={true}
              dotNavPosition={AuthorProfileCard}
            />
          )}

          {activeSection === 'articles' && (
            <div className="py-0 -mt-16">
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto_1fr] items-center gap-4 mb-2 md:mb-4">
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold antialiased text-center xl:text-left">
                  <div style={{visibility: 'hidden'}} className="gradient-text inline-block">
                    {SectionTitle}
                  </div>
                </h2>
                
                <div className="hidden sm:flex justify-center relative z-[9999]">
                  {AuthorProfileCard}
                </div>
                
                <div /> {/* Empty div for the third column */}
              </div>

              <div className="flex flex-col items-center">
                {isLoadingArticles ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" />
                  </div>
                ) : authorArticles.length === 0 ? (
                  <div className="text-center py-8">
                    <h3 className="text-xl font-medium mb-2">No Articles Yet</h3>
                    <p className="text-muted-foreground">This author hasn't published any articles yet.</p>
                  </div>
                ) : (
                  <>
                    <Carousel
                      opts={{
                        align: "start",
                        loop: true,
                        skipSnaps: false,
                        dragFree: false,
                      }}
                      className="w-full"
                    >
                      <div className="flex items-center justify-end gap-2 mb-4">
                        <CarouselPrevious 
                          className="static transform-none data-[disabled]:opacity-30 h-9 w-9 border-rose-400 text-rose-400 hover:bg-rose-50 hover:text-rose-500"
                          aria-label="Previous slide"
                        />
                        <CarouselNext 
                          className="static transform-none data-[disabled]:opacity-30 h-9 w-9 border-rose-400 text-rose-400 hover:bg-rose-50 hover:text-rose-500"
                          aria-label="Next slide"
                        />
                      </div>
                      <CarouselContent>
                        {/* Chunk articles into groups of 9 (3x3 grid) */}
                        {Array.from({ length: Math.ceil(authorArticles.length / 9) }).map((_, chunkIndex) => (
                          <CarouselItem key={chunkIndex}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8">
                              {authorArticles.slice(chunkIndex * 9, (chunkIndex + 1) * 9).map((article, index) => (
                                <div key={article.id} className="w-full">
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
                                </div>
                              ))}
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                    </Carousel>
                    {/* Add mobile dots at the bottom */}
                    <div className="block sm:hidden w-full mt-4">
                      <div className="flex justify-center relative z-[9999]">
                        {AuthorProfileCard}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Author; 