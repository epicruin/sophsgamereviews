import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Article {
  id: string;
  title: string;
  summary: string;
  image: string;
  published_date: string;
  author_id: string;
  author?: {
    username: string;
  };
}

const Articles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredArticles(articles);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = articles.filter(
        article => 
          article.title.toLowerCase().includes(query) ||
          article.summary.toLowerCase().includes(query)
      );
      setFilteredArticles(filtered);
    }
  }, [searchQuery, articles]);

  const fetchArticles = async () => {
    try {
      setIsLoading(true);
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('articles')
        .select('id, title, summary, image, published_date, author_id, author:profiles(username)')
        .lte('published_date', now)
        .is('scheduled_for', null)
        .order('published_date', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
      setFilteredArticles(data || []);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-primary/10 to-background py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="h-6 w-6" />
            <h1 className="text-4xl font-bold text-center">Articles</h1>
          </div>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            Explore our collection of articles covering the latest in gaming news, reviews, and industry insights.
          </p>
          
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search articles..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex justify-center">
            <p className="text-muted-foreground">Loading articles...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">No articles found</h2>
            <p className="text-muted-foreground">
              {searchQuery 
                ? "Try a different search term or check back later."
                : "Check back soon for new articles!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article) => (
              <Link 
                key={article.id} 
                to={`/articles/${article.id}`} 
                className="group overflow-hidden rounded-lg bg-card shadow transition-all hover:shadow-lg flex flex-col h-full"
              >
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <div className="text-xs text-white opacity-90">
                      {format(new Date(article.published_date), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-bold text-xl mb-3 group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-muted-foreground flex-1 mb-4 line-clamp-3">
                    {article.summary}
                  </p>
                  {article.author && (
                    <div className="text-xs text-muted-foreground mt-auto">
                      By {article.author.username || 'Anonymous'}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Articles; 