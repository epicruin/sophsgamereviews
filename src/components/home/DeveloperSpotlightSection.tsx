import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { Book } from "lucide-react";

interface Author {
  id: string;
  username: string;
  avatar_url: string;
  bio: string;
}

interface DeveloperSpotlightSectionProps {
  dotNavPosition?: ReactNode;
}

export const DeveloperSpotlightSection = ({ dotNavPosition }: DeveloperSpotlightSectionProps) => {
  const [authors, setAuthors] = useState<Author[]>([]);

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio')
        .not('username', 'is', null);

      if (error) throw error;
      setAuthors(data || []);
    } catch (error) {
      console.error('Error fetching authors:', error);
    }
  };

  return (
    <section className="container mx-auto px-4 py-2">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4 mb-2 md:mb-4">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold antialiased text-center md:text-left">
          <div className="gradient-text inline-block">Our Authors</div>
        </h2>
        
        <div className="flex justify-center relative z-[9999]">
          {dotNavPosition}
        </div>
        
        <div className="hidden md:block" />
      </div>

      <div className="flex flex-col items-center mt-40">
        <div className="flex flex-wrap justify-center gap-8">
          {authors.slice(0, 3).map((author) => (
            <motion.div
              key={author.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.5 }}
              className="w-[350px]"
            >
              <Link to={`/author/${author.username}`} className="block">
                <Card className="overflow-hidden card-hover group w-full bg-card">
                  <div className="p-6 flex flex-col items-center bg-card/95 backdrop-blur-sm">
                    <Avatar className="w-20 h-20 mb-4 ring-2 ring-rose-500/30 group-hover:ring-rose-500/50 transition-all">
                      <AvatarImage src={author.avatar_url || ''} alt={author.username} />
                      <AvatarFallback>{author.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    
                    <div className="px-4 py-1.5 bg-rose-400/10 text-rose-500 rounded-full font-medium group-hover:bg-rose-500/20 transition-colors mb-4">
                      {author.username}
                    </div>
                    
                    <div className="text-center px-2">
                      <p className="text-sm text-muted-foreground line-clamp-4 min-h-[5rem]">
                        {author.bio || "Author at Soph's Reviews. Writing thoughtful game reviews and sharing gaming experiences with our community."}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 py-3 px-4 flex justify-center">
                    <div className="glass-effect px-3 py-1 rounded-full flex items-center gap-1">
                      <Book className="w-3 h-3 text-rose-400" />
                      <span className="text-xs font-medium whitespace-nowrap leading-none">View Profile</span>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
