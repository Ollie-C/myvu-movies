export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          collection_id: string | null
          created_at: string
          id: string
          metadata: Json
          movie_id: string | null
          ranking_list_id: string | null
          type: Database["public"]["Enums"]["activity_type_enum"]
          user_id: string
        }
        Insert: {
          collection_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          movie_id?: string | null
          ranking_list_id?: string | null
          type: Database["public"]["Enums"]["activity_type_enum"]
          user_id: string
        }
        Update: {
          collection_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          movie_id?: string | null
          ranking_list_id?: string | null
          type?: Database["public"]["Enums"]["activity_type_enum"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_ranking_list_id_fkey"
            columns: ["ranking_list_id"]
            isOneToOne: false
            referencedRelation: "ranking_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_items: {
        Row: {
          added_at: string | null
          collection_id: string
          id: string
          movie_id: string | null
          notes: string | null
          position: number | null
        }
        Insert: {
          added_at?: string | null
          collection_id: string
          id?: string
          movie_id?: string | null
          notes?: string | null
          position?: number | null
        }
        Update: {
          added_at?: string | null
          collection_id?: string
          id?: string
          movie_id?: string | null
          notes?: string | null
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          is_ranked: boolean
          name: string
          ranking_list_id: string | null
          slug: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          is_ranked?: boolean
          name: string
          ranking_list_id?: string | null
          slug?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          is_ranked?: boolean
          name?: string
          ranking_list_id?: string | null
          slug?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collections_ranking_list_id_fkey"
            columns: ["ranking_list_id"]
            isOneToOne: true
            referencedRelation: "ranking_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      movies: {
        Row: {
          backdrop_path: string | null
          created_at: string | null
          credits: Json | null
          genres: Json | null
          id: string
          original_language: string | null
          original_title: string | null
          overview: string | null
          popularity: number | null
          poster_path: string | null
          release_date: string | null
          runtime: number | null
          search_vector: unknown | null
          tagline: string | null
          title: string
          tmdb_id: number
          updated_at: string | null
          vote_average: number | null
          vote_count: number | null
        }
        Insert: {
          backdrop_path?: string | null
          created_at?: string | null
          credits?: Json | null
          genres?: Json | null
          id?: string
          original_language?: string | null
          original_title?: string | null
          overview?: string | null
          popularity?: number | null
          poster_path?: string | null
          release_date?: string | null
          runtime?: number | null
          search_vector?: unknown | null
          tagline?: string | null
          title: string
          tmdb_id: number
          updated_at?: string | null
          vote_average?: number | null
          vote_count?: number | null
        }
        Update: {
          backdrop_path?: string | null
          created_at?: string | null
          credits?: Json | null
          genres?: Json | null
          id?: string
          original_language?: string | null
          original_title?: string | null
          overview?: string | null
          popularity?: number | null
          poster_path?: string | null
          release_date?: string | null
          runtime?: number | null
          search_vector?: unknown | null
          tagline?: string | null
          title?: string
          tmdb_id?: number
          updated_at?: string | null
          vote_average?: number | null
          vote_count?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      ranking_list_items: {
        Row: {
          created_at: string | null
          elo_score: number | null
          id: string
          movie_id: string | null
          notes: string | null
          position: number | null
          ranking_list_id: string | null
          tier: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          elo_score?: number | null
          id?: string
          movie_id?: string | null
          notes?: string | null
          position?: number | null
          ranking_list_id?: string | null
          tier?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          elo_score?: number | null
          id?: string
          movie_id?: string | null
          notes?: string | null
          position?: number | null
          ranking_list_id?: string | null
          tier?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ranking_items_ranking_list_id_fkey"
            columns: ["ranking_list_id"]
            isOneToOne: false
            referencedRelation: "ranking_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ranking_list_items_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      ranking_lists: {
        Row: {
          battle_limit: number | null
          battle_limit_type: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          elo_handling: string | null
          id: string
          is_public: boolean | null
          name: string
          ranking_method: Database["public"]["Enums"]["ranking_method_enum"]
          slug: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          battle_limit?: number | null
          battle_limit_type?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          elo_handling?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          ranking_method?: Database["public"]["Enums"]["ranking_method_enum"]
          slug?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          battle_limit?: number | null
          battle_limit_type?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          elo_handling?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          ranking_method?: Database["public"]["Enums"]["ranking_method_enum"]
          slug?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      versus_battles: {
        Row: {
          created_at: string | null
          id: string
          loser_elo_after: number | null
          loser_elo_before: number | null
          loser_movie_id: string | null
          ranking_list_id: string | null
          winner_elo_after: number | null
          winner_elo_before: number | null
          winner_movie_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          loser_elo_after?: number | null
          loser_elo_before?: number | null
          loser_movie_id?: string | null
          ranking_list_id?: string | null
          winner_elo_after?: number | null
          winner_elo_before?: number | null
          winner_movie_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          loser_elo_after?: number | null
          loser_elo_before?: number | null
          loser_movie_id?: string | null
          ranking_list_id?: string | null
          winner_elo_after?: number | null
          winner_elo_before?: number | null
          winner_movie_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ranking_battles_ranking_list_id_fkey"
            columns: ["ranking_list_id"]
            isOneToOne: false
            referencedRelation: "ranking_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "versus_battles_loser_movie_id_fkey"
            columns: ["loser_movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "versus_battles_winner_movie_id_fkey"
            columns: ["winner_movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      watched_movies: {
        Row: {
          created_at: string | null
          elo_score: number | null
          favorite: boolean | null
          id: string
          movie_id: string | null
          notes: string | null
          rating: number | null
          updated_at: string | null
          user_id: string | null
          watched_date: string
        }
        Insert: {
          created_at?: string | null
          elo_score?: number | null
          favorite?: boolean | null
          id?: string
          movie_id?: string | null
          notes?: string | null
          rating?: number | null
          updated_at?: string | null
          user_id?: string | null
          watched_date: string
        }
        Update: {
          created_at?: string | null
          elo_score?: number | null
          favorite?: boolean | null
          id?: string
          movie_id?: string | null
          notes?: string | null
          rating?: number | null
          updated_at?: string | null
          user_id?: string | null
          watched_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "watched_movies_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watched_movies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlist: {
        Row: {
          added_date: string | null
          created_at: string | null
          id: string
          movie_id: string | null
          notes: string | null
          priority: string | null
          reminder_date: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          added_date?: string | null
          created_at?: string | null
          id?: string
          movie_id?: string | null
          notes?: string | null
          priority?: string | null
          reminder_date?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          added_date?: string | null
          created_at?: string | null
          id?: string
          movie_id?: string | null
          notes?: string | null
          priority?: string | null
          reminder_date?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watchlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_elo_battle: {
        Args: {
          p_k_factor?: number
          p_loser_rating: number
          p_winner_rating: number
        }
        Returns: Json
      }
      calculate_merged_ranking_scores: {
        Args: { p_ranking_list_id: string; p_weights?: Json }
        Returns: Json
      }
      elo_to_rating: {
        Args: { elo_score: number }
        Returns: number
      }
      get_dynamic_k_factor: {
        Args: { p_rating_diff: number }
        Returns: number
      }
      get_user_movie_rating: {
        Args: { movie_id_param: number; user_uuid: string }
        Returns: number
      }
      get_user_stats: {
        Args: { user_id: string }
        Returns: {
          average_elo_score: number
          average_rating: number
          total_collections: number
          total_favorites: number
          total_ranking_lists: number
          total_rated: number
          total_watched: number
        }[]
      }
      has_user_watched_movie: {
        Args: { movie_id_param: number; user_uuid: string }
        Returns: boolean
      }
      process_battle: {
        Args: {
          p_loser_id: string
          p_ranking_list_id: string
          p_winner_id: string
        }
        Returns: Json
      }
      process_custom_versus_battle: {
        Args: {
          p_loser_id: string
          p_ranking_list_id: string
          p_use_global_elo?: boolean
          p_winner_id: string
        }
        Returns: Json
      }
      process_enhanced_rating: {
        Args:
          | {
              favorite?: boolean
              movie_id: number
              notes?: string
              rating: number
            }
          | {
              p_initial_rating: number
              p_movie_id: number
              p_notes?: string
              p_tolerance?: number
              p_user_id: string
            }
        Returns: undefined
      }
      process_ranking_battle: {
        Args: {
          p_loser_current_rating?: number
          p_loser_movie_id: number
          p_ranking_list_id: string
          p_winner_current_rating?: number
          p_winner_movie_id: number
        }
        Returns: Json
      }
      process_versus_battle: {
        Args: {
          p_loser_id: string
          p_ranking_list_id: string
          p_winner_id: string
        }
        Returns: Json
      }
      rating_to_elo: {
        Args: { rating: number }
        Returns: number
      }
      reorder_ranking_items: {
        Args: { p_ranking_list_id: string; p_reordered_items: Json }
        Returns: Json
      }
      reorder_ranking_list_items: {
        Args: { ranking_list_id: string; reordered_items: Json }
        Returns: undefined
      }
      search_local_movies: {
        Args: { search_query: string; user_id_param?: string }
        Returns: {
          genres: string[]
          id: number
          is_in_watchlist: boolean
          is_watched: boolean
          original_title: string
          overview: string
          poster_path: string
          release_date: string
          relevance_score: number
          title: string
          vote_average: number
        }[]
      }
    }
    Enums: {
      activity_type_enum:
        | "watched_added"
        | "watched_removed"
        | "rated_movie"
        | "favorite_added"
        | "favorite_removed"
        | "notes_updated"
        | "watchlist_added"
        | "watchlist_removed"
        | "watchlist_priority_updated"
        | "collection_created"
        | "collection_updated"
        | "collection_movie_added"
        | "collection_movie_removed"
        | "ranking_battle"
        | "top_ten_changed"
      ranking_method_enum: "versus" | "tier" | "manual" | "merged"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_type_enum: [
        "watched_added",
        "watched_removed",
        "rated_movie",
        "favorite_added",
        "favorite_removed",
        "notes_updated",
        "watchlist_added",
        "watchlist_removed",
        "watchlist_priority_updated",
        "collection_created",
        "collection_updated",
        "collection_movie_added",
        "collection_movie_removed",
        "ranking_battle",
        "top_ten_changed",
      ],
      ranking_method_enum: ["versus", "tier", "manual", "merged"],
    },
  },
} as const
