import { Star, Clock, Medal, Swords, Heart, Gem } from "lucide-react";

export interface Genre {
  id: string;
  name: string;
  created_at?: string;
}

// Base sections are the predefined ones
export type BaseSection = "featured" | "latest" | "genre_of_month" | "cozy_corner" | "hidden_gems";

// HomepageSection can be either a base section or any string (for custom sections)
export type HomepageSection = BaseSection | string;

// Only show the base sections in the default sections list
export const homepageSections: { value: BaseSection; label: string; icon: React.ElementType }[] = [
  { value: "featured", label: "Featured", icon: Star },
  { value: "latest", label: "Latest", icon: Clock },
  { value: "genre_of_month", label: "Genre of the Month", icon: Medal },
  { value: "cozy_corner", label: "Cozy Corner", icon: Heart },
  { value: "hidden_gems", label: "Hidden Gems", icon: Gem },
];

export interface ReviewFormData {
  title: string;
  excerpt: string;
  content: string;
  rating: number;
  genreId: string;
  playtime: number;
  image: string;
  imagePosition?: number;
  headingImage: string;
  homepage_sections: HomepageSection[];
  screenshots: string[];
  pros: string[];
  cons: string[];
  feature_size: "normal" | "large";
  scheduled_for: string | null;
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
  };
  developer: string;
  publisher: string;
  ageRating: string;
  priceUSD: number;
  priceGBP: number;
  priceEUR: number;
  releaseDate: string;
  systems: string[];
  purchaseLinks: {
    name: string;
    url: string;
  }[];
  awards: string[];
  award_dates: { [key: string]: string };
  youtubeTrailerUrl: string | null;
  online_coop: boolean;
  couch_coop: boolean;
  split_screen: boolean;
  max_players: number;
}

export interface ReviewFormProps {
  initialData?: any;
}

export const initialFormData: ReviewFormData = {
  title: "",
  excerpt: "",
  content: "",
  rating: 0,
  genreId: "",
  playtime: 0,
  image: "",
  imagePosition: undefined,
  headingImage: null,
  homepage_sections: ["latest"],
  screenshots: [],
  pros: [""],
  cons: [""],
  feature_size: "normal",
  scheduled_for: null,
  specifications: {
    minimum: {
      os: "",
      processor: "",
      memory: "",
      graphics: "",
      storage: "",
    },
    recommended: {
      os: "",
      processor: "",
      memory: "",
      graphics: "",
      storage: "",
    },
  },
  developer: "",
  publisher: "",
  ageRating: "",
  priceUSD: 0,
  priceGBP: 0,
  priceEUR: 0,
  releaseDate: new Date().toISOString().split('T')[0],
  systems: [],
  purchaseLinks: [],
  awards: [],
  award_dates: {},
  youtubeTrailerUrl: null,
  online_coop: false,
  couch_coop: false,
  split_screen: false,
  max_players: 0
}; 