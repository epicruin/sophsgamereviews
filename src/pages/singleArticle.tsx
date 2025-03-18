import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Clock, User, BookOpen, ArrowLeft } from "lucide-react";

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading article...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
        <p className="text-muted-foreground mb-6">{error || "The article you're looking for doesn't exist."}</p>
        <Button asChild>
          <Link to="/articles">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Articles
          </Link>
        </Button>
      </div>
    );
  }

  // Format the content with paragraph breaks
  const formattedContent = article.content.split("\n").map((paragraph, index) => (
    <p key={index} className="mb-6">
      {paragraph}
    </p>
  ));

  return (
    <div className="min-h-screen bg-background">
      <div 
        className="h-96 w-full bg-cover bg-center relative"
        style={{ backgroundImage: `url(${article.image})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/80">
          <div className="container mx-auto px-4 h-full flex flex-col justify-end pb-16">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">{article.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-white/80">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{article.author?.username || "Anonymous"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{format(new Date(article.published_date || article.created_at), "MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>Article</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 bg-card p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">TL;DR</h2>
            <p className="text-muted-foreground">{article.tldr}</p>
          </div>

          <div className="mb-8 text-lg text-muted-foreground leading-relaxed">
            {article.summary}
          </div>

          <div className="prose prose-lg max-w-none">
            {formattedContent}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleArticle; 