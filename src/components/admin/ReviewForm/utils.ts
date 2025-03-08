import { supabase } from "@/integrations/supabase/client";
import { Genre } from "./types";

export const fetchGenres = async (): Promise<Genre[]> => {
  const { data: genresData, error } = await supabase
    .from('genres')
    .select('id, name, created_at')
    .order('name');

  if (error) {
    throw new Error("Failed to load genres");
  }

  return genresData;
};

export const formatReviewData = (formData: any, userId: string) => {
  // Filter out empty awards and their corresponding dates
  const filteredAwards = formData.awards.filter(Boolean);
  const filteredAwardDates = Object.fromEntries(
    Object.entries(formData.award_dates).filter(([award]) => filteredAwards.includes(award))
  );

  // Cast award_dates to Json type
  const awardDatesJson = filteredAwardDates as any;

  return {
    title: formData.title,
    excerpt: formData.excerpt,
    content: formData.content,
    rating: formData.rating,
    genre_id: formData.genreId,
    playtime: formData.playtime,
    image: formData.image,
    image_position: formData.imagePosition,
    heading_image: formData.headingImage,
    author_id: userId,
    feature_size: formData.feature_size,
    homepage_sections: formData.homepage_sections.filter(section => section !== 'latest'),
    scheduled_for: formData.scheduled_for,
    pros: formData.pros.filter(Boolean),
    cons: formData.cons.filter(Boolean),
    min_os: formData.specifications.minimum.os,
    min_processor: formData.specifications.minimum.processor,
    min_memory: formData.specifications.minimum.memory,
    min_graphics: formData.specifications.minimum.graphics,
    min_storage: formData.specifications.minimum.storage,
    rec_os: formData.specifications.recommended.os,
    rec_processor: formData.specifications.recommended.processor,
    rec_memory: formData.specifications.recommended.memory,
    rec_graphics: formData.specifications.recommended.graphics,
    rec_storage: formData.specifications.recommended.storage,
    developer: formData.developer,
    publisher: formData.publisher,
    age_rating: formData.ageRating,
    price_usd: formData.priceUSD,
    price_gbp: formData.priceGBP,
    price_eur: formData.priceEUR,
    release_date: new Date(formData.releaseDate).toISOString(),
    systems: formData.systems,
    purchase_links: formData.purchaseLinks.filter(link => link.name && link.url),
    screenshots: formData.screenshots.map((url: string, index: number) => ({
      url,
      order_index: index
    })),
    awards: filteredAwards,
    award_dates: awardDatesJson,
    youtube_trailer_url: formData.youtubeTrailerUrl,
    online_coop: formData.online_coop,
    couch_coop: formData.couch_coop,
    split_screen: formData.split_screen,
    max_players: formData.max_players
  };
}; 