-- Add missing columns to movies table for complete TMDB data caching
ALTER TABLE movies 
ADD COLUMN IF NOT EXISTS vote_count INTEGER,
ADD COLUMN IF NOT EXISTS runtime INTEGER,
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS credits JSONB;

-- Add comments for documentation
COMMENT ON COLUMN movies.vote_count IS 'Number of votes from TMDB';
COMMENT ON COLUMN movies.runtime IS 'Movie runtime in minutes from TMDB';
COMMENT ON COLUMN movies.tagline IS 'Movie tagline from TMDB';
COMMENT ON COLUMN movies.credits IS 'Cast and crew information from TMDB'; 