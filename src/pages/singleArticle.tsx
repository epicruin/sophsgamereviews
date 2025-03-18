import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Clock, User, BookOpen, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StaticStarsBackground } from "@/components/home/StaticStarsBackground";
import { AuroraBackground } from "@/components/home/AuroraBackground";
import { ShootingStarsBackground } from "@/components/home/ShootingStarsBackground";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  };
}

const SingleArticle = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            author:profiles(username, avatar_url)
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <StaticStarsBackground />
        <AuroraBackground />
        <ShootingStarsBackground />
        <p className="text-muted-foreground relative z-10">Loading article...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
        <StaticStarsBackground />
        <AuroraBackground />
        <ShootingStarsBackground />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">{error || "The article you're looking for doesn't exist."}</p>
          <Button asChild>
            <Link to="/articles">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Articles
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <StaticStarsBackground />
      <AuroraBackground />
      <ShootingStarsBackground />
      
      {/* Full width hero header with image - similar to ReviewHeader style */}
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
        
        {/* Header content - centered over image */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
          <div className="container mx-auto max-w-4xl">
            <Button variant="outline" asChild className="mb-8 rounded-full bg-black/30 border-white/20 hover:bg-black/40 hover:border-white/30">
              <Link to="/articles" className="flex items-center gap-2 text-white">
                <ArrowLeft className="h-4 w-4" />
                Back to Articles
              </Link>
            </Button>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white drop-shadow-lg">{article.title}</h1>
            
            <div className="flex justify-center items-center gap-6 mb-8 flex-wrap">
              <div className="flex items-center gap-2">
                <Avatar className="h-10 w-10 ring-2 ring-white/30">
                  <AvatarImage src={article.author?.avatar_url} alt={article.author?.username} />
                  <AvatarFallback>{article.author?.username?.substring(0, 2) || "AN"}</AvatarFallback>
                </Avatar>
                <Link to={`/author/${article.author?.username}`} className="text-base font-medium text-white hover:text-rose-300 transition-colors">
                  {article.author?.username || "Anonymous"}
                </Link>
              </div>
              
              <div className="h-6 border-l border-white/30"></div>
              
              <div className="flex items-center gap-2 text-white/90">
                <Clock className="h-5 w-5" />
                <span className="text-base">{format(new Date(article.published_date || article.created_at), "MMMM d, yyyy")}</span>
              </div>
              
              <div className="h-6 border-l border-white/30"></div>
              
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-rose-300" />
                <span className="text-base font-medium text-rose-300">Article</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Content - positioned to overlap the fading hero image */}
      <div className="relative z-10 container mx-auto px-4 -mt-32">
        <div className="w-full max-w-3xl mx-auto">
          {article.summary && (
            <Card className="p-6 md:p-8 mb-12 bg-card/95 backdrop-blur-md">
              <h2 className="text-xl font-semibold mb-4 gradient-text">Summary</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">{article.summary}</p>
            </Card>
          )}
          
          <Card className="p-6 md:p-8 mb-12 bg-card/95 backdrop-blur-md">
            <article className="prose prose-lg dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {article.content}
              </ReactMarkdown>
            </article>
          </Card>
          
          {article.tldr && (
            <Card className="p-6 md:p-8 mb-12 bg-card/95 backdrop-blur-md border-rose-500/20">
              <h2 className="text-xl font-semibold mb-4 gradient-text">TL;DR</h2>
              <p className="text-muted-foreground leading-relaxed">{article.tldr}</p>
            </Card>
          )}
          
          <div className="flex justify-between items-center mt-12 mb-24">
            <Button variant="outline" asChild>
              <Link to="/articles" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Articles
              </Link>
            </Button>
            
            <Button variant="default" asChild>
              <a href="#" className="flex items-center gap-2" onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}>
                Back to Top
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleArticle; 