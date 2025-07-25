-- Database Indexes for Performance Optimization
-- Run these in your Supabase SQL editor

-- Index for user_movies table to optimize queries by user_id and movie_id
CREATE INDEX IF NOT EXISTS idx_user_movies_user_id ON user_movies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_movies_movie_id ON user_movies(movie_id);
CREATE INDEX IF NOT EXISTS idx_user_movies_user_movie ON user_movies(user_id, movie_id);

-- Index for collections table to optimize queries by user_id
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_user_updated ON collections(user_id, updated_at DESC);

-- Index for collection_items table
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_movie_id ON collection_items(movie_id);

-- Index for movies table (if not already indexed)
CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id ON movies(tmdb_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_user_movies_watched ON user_movies(user_id, is_watched) WHERE is_watched = true;
CREATE INDEX IF NOT EXISTS idx_user_movies_watchlist ON user_movies(user_id, is_in_watchlist) WHERE is_in_watchlist = true;
CREATE INDEX IF NOT EXISTS idx_user_movies_rating ON user_movies(user_id, rating) WHERE rating IS NOT NULL; 