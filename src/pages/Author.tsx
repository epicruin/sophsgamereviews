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

interface AuthorProfile {
  id: string;
  username: string;
  avatar_url: string;
  bio: string | null;
  title: string;
}

const Author = () => {
  const { username } = useParams();
  const [author, setAuthor] = useState<AuthorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bioDialogOpen, setBioDialogOpen] = useState(false);

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
    } catch (error) {
      console.error('Error fetching author:', error);
      toast.error('Failed to load author profile');
    } finally {
      setIsLoading(false);
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

  return (
    <div className="relative min-h-screen">
      <StaticStarsBackground />
      <AuroraBackground />
      <ShootingStarsBackground />

      <div className="relative z-10 container mx-auto px-4 py-0 -mt-3">
        {/* Author's Reviews with the author profile in the middle column */}
        <div className="-mt-3">
          <SectionContainer
            id="author-reviews"
            title="Reviews"
            sectionType="reviews"
            authorId={author.id}
            variant="medium"
            className="py-4"
            showTitle={true}
            dotNavPosition={AuthorProfileCard}
          />
        </div>
      </div>
    </div>
  );
};

export default Author; 