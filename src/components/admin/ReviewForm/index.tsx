import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { AIChat } from "./AIChat";
import { HomepageSections } from "./HomepageSections";
import { ImagesSection } from "./ImagesSection";
import { BasicInformation } from "./BasicInformation";
import { ReleaseDetails } from "./ReleaseDetails";
import { ProsAndCons } from "./ProsAndCons";
import { SystemRequirements } from "./SystemRequirements";
import { ReviewContent } from "./ReviewContent";
import { Awards } from "./Awards";
import { YoutubeTrailer } from "./YoutubeTrailer";
import { MultiplayerDetails } from "./MultiplayerDetails";
import { ReviewFormProps, ReviewFormData, initialFormData, Genre } from "./types";
import { fetchGenres, formatReviewData } from "./utils";

export const ReviewForm = ({ initialData }: ReviewFormProps) => {
  const [formData, setFormData] = useState<ReviewFormData>(
    initialData ? {
      title: initialData.title,
      excerpt: initialData.excerpt,
      content: initialData.content,
      rating: initialData.rating,
      genreId: initialData.genre_id,
      playtime: initialData.playtime,
      image: initialData.image,
      headingImage: initialData.heading_image,
      homepage_sections: initialData.homepage_sections || [],
      screenshots: initialData.screenshots?.map((s: any) => s.url) || [],
      pros: initialData.details?.pros?.length > 0 ? initialData.details.pros : [""],
      cons: initialData.details?.cons?.length > 0 ? initialData.details.cons : [""],
      feature_size: initialData.feature_size || "normal",
      scheduled_for: initialData.scheduled_for ? new Date(initialData.scheduled_for).toISOString().slice(0, 16) : null,
      specifications: {
        minimum: {
          os: initialData.details?.min_os || "",
          processor: initialData.details?.min_processor || "",
          memory: initialData.details?.min_memory || "",
          graphics: initialData.details?.min_graphics || "",
          storage: initialData.details?.min_storage || "",
        },
        recommended: {
          os: initialData.details?.rec_os || "",
          processor: initialData.details?.rec_processor || "",
          memory: initialData.details?.rec_memory || "",
          graphics: initialData.details?.rec_graphics || "",
          storage: initialData.details?.rec_storage || "",
        },
      },
      developer: initialData.details?.developer || "",
      publisher: initialData.details?.publisher || "",
      ageRating: initialData.details?.age_rating || "",
      priceUSD: initialData.details?.price_usd || 0,
      priceGBP: initialData.details?.price_gbp || 0,
      priceEUR: initialData.details?.price_eur || 0,
      releaseDate: initialData.details?.release_date ? new Date(initialData.details.release_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      systems: initialData.details?.systems || [],
      purchaseLinks: initialData.purchase_links || [],
      awards: initialData.awards || [],
      award_dates: initialData.award_dates || {},
      youtubeTrailerUrl: initialData.youtube_trailer_url || null,
      online_coop: initialData.online_coop || false,
      couch_coop: initialData.couch_coop || false,
      split_screen: initialData.split_screen || false,
      max_players: initialData.max_players || 0
    } : initialFormData
  );

  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      const genresData = await fetchGenres();
      setGenres(genresData);
    } catch (error) {
      toast.error("Failed to load genres");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session found");

      const reviewData = formatReviewData(formData, session.user.id);

      let review;
      if (initialData) {
        const { data, error: updateError } = await supabase
          .from("reviews")
          .update(reviewData)
          .eq('id', initialData.id)
          .select()
          .single();

        if (updateError) throw updateError;
        review = data;
      } else {
        const { data, error: insertError } = await supabase
          .from("reviews")
          .insert(reviewData)
          .select()
          .single();

        if (insertError) throw insertError;
        review = data;
      }

      toast.success(initialData ? "Review updated successfully" : "Review created successfully");
      navigate("/admin/dashboard");
    } catch (error: any) {
      toast.error(`Failed to ${initialData ? 'update' : 'create'} review: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormUpdate = (update: Partial<ReviewFormData>) => {
    setFormData(prev => ({ ...prev, ...update }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <HomepageSections formData={formData} onUpdate={handleFormUpdate} />
      <BasicInformation formData={formData} genres={genres} onUpdate={handleFormUpdate} />
      <ImagesSection formData={formData} onUpdate={handleFormUpdate} />
      <YoutubeTrailer formData={formData} onUpdate={handleFormUpdate} />
      <ReleaseDetails formData={formData} onUpdate={handleFormUpdate} />
      <MultiplayerDetails formData={formData} onUpdate={handleFormUpdate} />
      <ProsAndCons formData={formData} onUpdate={handleFormUpdate} />
      <SystemRequirements formData={formData} onUpdate={handleFormUpdate} />
      <ReviewContent formData={formData} onUpdate={handleFormUpdate} />
      <Awards formData={formData} onUpdate={handleFormUpdate} />
      
      <h3 className="text-lg font-semibold mt-8 mb-4">AI Assistant</h3>
      <AIChat formData={formData} genres={genres} />

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/admin/dashboard")}
        >
          Cancel
        </Button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="datetime-local"
              id="scheduleTime"
              value={formData.scheduled_for || ''}
              onChange={(e) => handleFormUpdate({ scheduled_for: e.target.value || null })}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => handleFormUpdate({ scheduled_for: null })}
            >
              Clear Schedule
            </Button>
          </div>
          <Button type="submit" disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Saving..." : formData.scheduled_for ? "Schedule Review" : "Save Review"}
          </Button>
        </div>
      </div>
    </form>
  );
}; 