import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ReviewForm } from "@/components/admin/ReviewForm/index";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ReviewDetails {
  pros: string[];
  cons: string[];
  min_os: string | null;
  min_processor: string | null;
  min_memory: string | null;
  min_graphics: string | null;
  min_storage: string | null;
  rec_os: string | null;
  rec_processor: string | null;
  rec_memory: string | null;
  rec_graphics: string | null;
  rec_storage: string | null;
  developer: string | null;
  publisher: string | null;
  age_rating: string | null;
  price_usd: number | null;
  price_gbp: number | null;
  price_eur: number | null;
  release_date: string | null;
  systems: string[];
  online_coop: boolean;
  couch_coop: boolean;
  split_screen: boolean;
  max_players: number;
}

type HomepageSection = "latest" | "featured" | "genre_of_month" | "custom_section" | "cozy_corner" | "hidden_gems";

interface DatabaseReview {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  rating: number;
  genre_id: string;
  playtime: number;
  image: string;
  heading_image: string | null;
  homepage_sections: HomepageSection[];
  feature_size: "normal" | "large";
  pros: string[];
  cons: string[];
  min_os: string | null;
  min_processor: string | null;
  min_memory: string | null;
  min_graphics: string | null;
  min_storage: string | null;
  rec_os: string | null;
  rec_processor: string | null;
  rec_memory: string | null;
  rec_graphics: string | null;
  rec_storage: string | null;
  developer: string | null;
  publisher: string | null;
  age_rating: string | null;
  price_usd: number | null;
  price_gbp: number | null;
  price_eur: number | null;
  release_date: string | null;
  systems: string[];
  screenshots: { url: string; order_index: number }[];
  genre: { id: string; name: string };
  scheduled_for: string | null;
  awards: string[];
  award_dates: { [key: string]: string };
  youtube_trailer_url: string | null;
  online_coop: boolean;
  couch_coop: boolean;
  split_screen: boolean;
  max_players: number;
  purchase_links?: { name: string; url: string; }[];
}

interface Review {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  rating: number;
  genre_id: string;
  playtime: number;
  image: string;
  heading_image: string | null;
  homepage_sections: HomepageSection[];
  feature_size: "normal" | "large";
  details: ReviewDetails | null;
  screenshots: { url: string }[];
  genre: { id: string; name: string };
  scheduled_for: string | null;
  awards: string[];
  award_dates: { [key: string]: string };
  youtube_trailer_url: string | null;
  online_coop: boolean;
  couch_coop: boolean;
  split_screen: boolean;
  max_players: number;
  purchase_links?: { name: string; url: string; }[];
}

const EditReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [review, setReview] = useState<Review | null>(null);

  useEffect(() => {
    checkAdmin();
    fetchReview();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/admin");
      return;
    }

    const { data: isAdmin } = await supabase.rpc('is_admin', {
      user_id: session.user.id
    });

    if (!isAdmin) {
      await supabase.auth.signOut();
      navigate("/admin");
    }
  };

  const fetchReview = async () => {
    try {
      const { data: rawData, error } = await supabase
        .from('reviews')
        .select(`
          id,
          title,
          content,
          excerpt,
          rating,
          genre_id,
          playtime,
          image,
          heading_image,
          homepage_sections,
          feature_size,
          pros,
          cons,
          min_os,
          min_processor,
          min_memory,
          min_graphics,
          min_storage,
          rec_os,
          rec_processor,
          rec_memory,
          rec_graphics,
          rec_storage,
          developer,
          publisher,
          age_rating,
          price_usd,
          price_gbp,
          price_eur,
          release_date,
          systems,
          screenshots,
          genre:genres(*),
          scheduled_for,
          awards,
          award_dates,
          youtube_trailer_url,
          online_coop,
          couch_coop,
          split_screen,
          max_players,
          purchase_links
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      if (!rawData) {
        toast.error("Review not found");
        navigate("/admin/dashboard");
        return;
      }

      // Cast the raw data to our DatabaseReview type
      const data = rawData as unknown as DatabaseReview;

      // Format the review data to match the expected structure
      const formattedReview: Review = {
        id: data.id,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        rating: data.rating,
        genre_id: data.genre_id,
        playtime: data.playtime,
        image: data.image,
        heading_image: data.heading_image,
        homepage_sections: data.homepage_sections || [],
        feature_size: data.feature_size || "normal",
        screenshots: (data.screenshots || []).map((s) => ({ url: s.url })),
        genre: data.genre,
        scheduled_for: data.scheduled_for,
        awards: data.awards || [],
        award_dates: data.award_dates || {},
        youtube_trailer_url: data.youtube_trailer_url,
        online_coop: data.online_coop || false,
        couch_coop: data.couch_coop || false,
        split_screen: data.split_screen || false,
        max_players: data.max_players || 0,
        purchase_links: data.purchase_links || [],
        details: {
          pros: data.pros || [],
          cons: data.cons || [],
          min_os: data.min_os,
          min_processor: data.min_processor,
          min_memory: data.min_memory,
          min_graphics: data.min_graphics,
          min_storage: data.min_storage,
          rec_os: data.rec_os,
          rec_processor: data.rec_processor,
          rec_memory: data.rec_memory,
          rec_graphics: data.rec_graphics,
          rec_storage: data.rec_storage,
          developer: data.developer,
          publisher: data.publisher,
          age_rating: data.age_rating,
          price_usd: data.price_usd,
          price_gbp: data.price_gbp,
          price_eur: data.price_eur,
          release_date: data.release_date,
          systems: data.systems || [],
          online_coop: data.online_coop || false,
          couch_coop: data.couch_coop || false,
          split_screen: data.split_screen || false,
          max_players: data.max_players || 0
        }
      };

      setReview(formattedReview);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching review:', error);
      toast.error('Failed to load review');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Edit Review</h1>
          <Button variant="outline" onClick={() => navigate("/admin/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <ReviewForm initialData={review} />
      </main>
    </div>
  );
};

export default EditReview;
