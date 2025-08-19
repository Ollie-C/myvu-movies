-- Activities schema for tracking user actions

-- Enum for activity types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'activity_type_enum'
  ) THEN
    CREATE TYPE activity_type_enum AS ENUM (
      'watched_added',
      'watched_removed',
      'rated_movie',
      'favorite_added',
      'favorite_removed',
      'notes_updated',
      'watchlist_added',
      'watchlist_removed',
      'watchlist_priority_updated',
      'collection_created',
      'collection_updated',
      'collection_movie_added',
      'collection_movie_removed',
      'ranking_battle',
      'top_ten_changed'
    );
  END IF;
END $$;

-- Activities table
CREATE TABLE IF NOT EXISTS public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type activity_type_enum NOT NULL,
  movie_id integer NULL REFERENCES public.movies(id) ON DELETE SET NULL,
  collection_id uuid NULL REFERENCES public.collections(id) ON DELETE SET NULL,
  ranking_list_id uuid NULL REFERENCES public.ranking_lists(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Helpful index for queries by user and time
CREATE INDEX IF NOT EXISTS activities_user_created_at_idx
  ON public.activities (user_id, created_at DESC);

-- RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'activities' AND policyname = 'Activities are viewable by owner'
  ) THEN
    CREATE POLICY "Activities are viewable by owner"
      ON public.activities FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'activities' AND policyname = 'Activities are insertable by owner'
  ) THEN
    CREATE POLICY "Activities are insertable by owner"
      ON public.activities FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


