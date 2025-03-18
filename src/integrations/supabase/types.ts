export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      genres: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      homepage_section_order: {
        Row: {
          id: string
          section_id: string
          display_order: number
          created_at: string
          updated_at: string
          icon_name: string | null
          is_hidden: boolean
          current_genre_id: string | null
          is_custom: boolean
        }
        Insert: {
          id?: string
          section_id: string
          display_order: number
          created_at?: string
          updated_at?: string
          icon_name?: string | null
          is_hidden?: boolean
          current_genre_id?: string | null
          is_custom?: boolean
        }
        Update: {
          id?: string
          section_id?: string
          display_order?: number
          created_at?: string
          updated_at?: string
          icon_name?: string | null
          is_hidden?: boolean
          current_genre_id?: string | null
          is_custom?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "homepage_section_order_current_genre_id_fkey"
            columns: ["current_genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          }
        ]
      }
      leaderboard: {
        Row: {
          id: string
          name: string
          email: string
          gender: string | null
          age: number | null
          score: number
          wave: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          gender?: string | null
          age?: number | null
          score: number
          wave: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          gender?: string | null
          age?: number | null
          score?: number
          wave?: number
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          username: string | null
          bio: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          username?: string | null
          bio?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          username?: string | null
          bio?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          title: string
          image: string
          excerpt: string
          content: string
          rating: number
          author_id: string
          likes: number | null
          playtime: number
          published_date: string | null
          created_at: string | null
          updated_at: string | null
          genre_id: string | null
          feature_size: string
          homepage_sections: string[]
          pros: string[] | null
          cons: string[] | null
          min_os: string | null
          min_processor: string | null
          min_memory: string | null
          min_graphics: string | null
          min_storage: string | null
          rec_os: string | null
          rec_processor: string | null
          rec_memory: string | null
          rec_graphics: string | null
          rec_storage: string | null
          developer: string | null
          publisher: string | null
          age_rating: string | null
          price_usd: number | null
          price_gbp: number | null
          price_eur: number | null
          release_date: string | null
          systems: string[] | null
          screenshots: Json[] | null
          scheduled_for: string | null
          awards: string[] | null
          award_dates: Json | null
          heading_image: string | null
          custom_section_name: string | null
          youtube_trailer_url: string | null
          image_position: number | null
          purchase_links: Json | null
        }
        Insert: {
          id?: string
          title: string
          image: string
          excerpt: string
          content: string
          rating: number
          author_id: string
          likes?: number | null
          playtime: number
          published_date?: string | null
          created_at?: string | null
          updated_at?: string | null
          genre_id?: string | null
          feature_size?: string
          homepage_sections?: string[]
          pros?: string[] | null
          cons?: string[] | null
          min_os?: string | null
          min_processor?: string | null
          min_memory?: string | null
          min_graphics?: string | null
          min_storage?: string | null
          rec_os?: string | null
          rec_processor?: string | null
          rec_memory?: string | null
          rec_graphics?: string | null
          rec_storage?: string | null
          developer?: string | null
          publisher?: string | null
          age_rating?: string | null
          price_usd?: number | null
          price_gbp?: number | null
          price_eur?: number | null
          release_date?: string | null
          systems?: string[] | null
          screenshots?: Json[] | null
          scheduled_for?: string | null
          awards?: string[] | null
          award_dates?: Json | null
          heading_image?: string | null
          custom_section_name?: string | null
          youtube_trailer_url?: string | null
          image_position?: number | null
          purchase_links?: Json | null
        }
        Update: {
          id?: string
          title?: string
          image?: string
          excerpt?: string
          content?: string
          rating?: number
          author_id?: string
          likes?: number | null
          playtime?: number
          published_date?: string | null
          created_at?: string | null
          updated_at?: string | null
          genre_id?: string | null
          feature_size?: string
          homepage_sections?: string[]
          pros?: string[] | null
          cons?: string[] | null
          min_os?: string | null
          min_processor?: string | null
          min_memory?: string | null
          min_graphics?: string | null
          min_storage?: string | null
          rec_os?: string | null
          rec_processor?: string | null
          rec_memory?: string | null
          rec_graphics?: string | null
          rec_storage?: string | null
          developer?: string | null
          publisher?: string | null
          age_rating?: string | null
          price_usd?: number | null
          price_gbp?: number | null
          price_eur?: number | null
          release_date?: string | null
          systems?: string[] | null
          screenshots?: Json[] | null
          scheduled_for?: string | null
          awards?: string[] | null
          award_dates?: Json | null
          heading_image?: string | null
          custom_section_name?: string | null
          youtube_trailer_url?: string | null
          image_position?: number | null
          purchase_links?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_reviews_author"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_reviews_genre"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          id: string
          review_id: string
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          }
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: number;
          key: string;
          value: string;
          description: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: number;
          key: string;
          value: string;
          description?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: number;
          key?: string;
          value?: string;
          description?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "site_settings_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      articles: {
        Row: {
          id: string
          title: string
          summary: string
          content: string
          tldr: string
          image: string
          author_id: string
          created_at: string
          updated_at: string
          published_date: string | null
          scheduled_for: string | null
        }
        Insert: {
          id?: string
          title: string
          summary: string
          content: string
          tldr: string
          image: string
          author_id: string
          created_at?: string
          updated_at?: string
          published_date?: string | null
          scheduled_for?: string | null
        }
        Update: {
          id?: string
          title?: string
          summary?: string
          content?: string
          tldr?: string
          image?: string
          author_id?: string
          created_at?: string
          updated_at?: string
          published_date?: string | null
          scheduled_for?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_articles_author"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      update_review_section: {
        Args: {
          old_section_id: string
          new_section_id: string | null
        }
        Returns: void
      }
    }
    Enums: {
      app_role: "admin" | "user"
      homepage_section:
        | "featured"
        | "latest"
        | "genre_of_month"
        | "custom_section"
        | "cozy_corner"
        | "hidden_gems"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
