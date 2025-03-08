import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuroraBackground } from "@/components/home/AuroraBackground";
import { ShootingStarsBackground } from "@/components/home/ShootingStarsBackground";
import { StaticStarsBackground } from "@/components/home/StaticStarsBackground";
import { toast } from "sonner";
import { SectionContainer } from "@/components/shared/SectionContainer";

const Genre = () => {
  const { genreName } = useParams();
  const [genreId, setGenreId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchGenreId();
  }, [genreName]);

  const fetchGenreId = async () => {
    try {
      const { data: genreData, error: genreError } = await supabase
        .from('genres')
        .select('id')
        .ilike('name', genreName || '')
        .single();

      if (genreError) throw genreError;
      
      setGenreId(genreData.id);
    } catch (error) {
      console.error('Error fetching genre:', error);
      toast.error('Failed to load genre');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <StaticStarsBackground />
        <AuroraBackground />
        <ShootingStarsBackground />
        <p className="text-muted-foreground relative z-10">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <StaticStarsBackground />
      <AuroraBackground />
      <ShootingStarsBackground />
      <div className="w-full py-8 relative z-10">
        <SectionContainer
          id="genre-reviews"
          title={`${genreName} Games`}
          sectionType="reviews"
          genreId={genreId || undefined}
          variant="medium"
          className="py-4"
        />
      </div>
    </div>
  );
};

export default Genre; 