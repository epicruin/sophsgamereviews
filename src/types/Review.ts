// Review types for Sophs Reviews platform

// System requirements interface
export interface SystemRequirements {
  minOS: string;
  minProcessor: string;
  minMemory: string;
  minGraphics: string;
  minStorage: string;
  recOS: string;
  recProcessor: string;
  recMemory: string;
  recGraphics: string;
  recStorage: string;
}

// Author interface
export interface Author {
  name: string;
  avatar: string;
  title: string;
  bio: string | null;
}

// Screenshot interface
export interface Screenshot {
  url: string;
  caption?: string;
}

// Review data interface matching Supabase schema
export interface ReviewData {
  id: string;
  title: string;
  image: string;
  excerpt: string;
  content: string;
  rating: number;
  author: Author;
  likes: number | null;
  playtime: number;
  publishedDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  genreId: string | null;
  genre: string;
  featureSize: string;
  homepageSections: string[];
  
  // System requirements
  minOS: string | null;
  minProcessor: string | null;
  minMemory: string | null;
  minGraphics: string | null;
  minStorage: string | null;
  recOS: string | null;
  recProcessor: string | null;
  recMemory: string | null;
  recGraphics: string | null;
  recStorage: string | null;
  
  // Game details
  developer: string | null;
  publisher: string | null;
  ageRating: string | null;
  releaseDate: string | null;
  systems: string[] | null;
  
  // Pricing
  priceUSD: number | null;
  priceGBP: number | null;
  priceEUR: number | null;
  
  // Where to buy
  purchaseLinks?: {
    name: string;
    url: string;
  }[];
  
  // Pros and cons
  pros: string[] | null;
  cons: string[] | null;
  
  // Media
  screenshots: Screenshot[] | null;
  headingImage: string | null;
  youtubeTrailerUrl: string | null;
  imagePosition: number | null;
  
  // Awards
  awards: string[] | null;
  award_dates: Record<string, string> | null;
  
  // Custom section
  customSectionName: string | null;
  
  // Scheduling
  scheduledFor: string | null;

  // Multiplayer details
  online_coop: boolean;
  couch_coop: boolean;
  split_screen: boolean;
  max_players: number;

  // System requirements object
  specifications: {
    minimum: {
      os: string;
      processor: string;
      memory: string;
      graphics: string;
      storage: string;
    };
    recommended: {
      os: string;
      processor: string;
      memory: string;
      graphics: string;
      storage: string;
    };
  }
}

// Review preview interface for list/grid views
export interface ReviewPreview {
  id: string;
  title: string;
  image: string;
  excerpt: string;
  rating: number;
  author: Author;
  publishedDate: string | null;
  featureSize: string;
  customSectionName: string | null;
  imagePosition: number | null;
}

// Database response type for direct Supabase queries
// This represents the actual structure of the reviews table in Supabase
export interface ReviewResponse {
  id: string;
  title: string;
  image: string;
  excerpt: string;
  content: string;
  rating: number;
  author_id: string;
  author?: {
    username: string;
    avatar_url: string;
    bio: string | null;
  };
  genre?: {
    name: string;
  };
  likes: number | null;
  playtime: number;
  published_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  genre_id: string | null;
  feature_size: string;
  homepage_sections: string[];
  
  // System requirements
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
  
  // Game details
  developer: string | null;
  publisher: string | null;
  age_rating: string | null;
  release_date: string | null;
  systems: string[] | null;
  
  // Pricing
  price_usd: number | null;
  price_gbp: number | null;
  price_eur: number | null;
  
  // Where to buy
  purchase_links?: {
    name: string;
    url: string;
  }[];
  
  // Pros and cons
  pros: string[] | null;
  cons: string[] | null;
  
  // Media
  screenshots: Screenshot[] | null;
  heading_image: string | null;
  youtube_trailer_url: string | null;
  image_position: number | null;
  
  // Awards
  awards: string[] | null;
  award_dates: Record<string, string> | null;
  
  // Custom section
  custom_section_name: string | null;
  
  // Scheduling
  scheduled_for: string | null;

  // Multiplayer details
  online_coop: boolean | null;
  couch_coop: boolean | null;
  split_screen: boolean | null;
  max_players: number | null;
}

export interface Genre {
  id: string;
  name: string;
}

export interface HomepageSectionOrder {
  id: string;
  section_id: string;
  display_order: number;
  created_at: string;
  updated_at: string;
  icon_name: string | null;
  is_hidden: boolean;
  current_genre_id: string | null;
  is_custom: boolean;
}

export type HomepageSection = 
  | "featured"
  | "latest"
  | "genre_of_month"
  | "cozy_corner"
  | "hidden_gems"
  | "browse_genres"
  | "developer_spotlight"
  | string; // Allow any string for custom sections
