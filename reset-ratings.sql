-- Reset all ratings and ELO scores
-- This will clear all user ratings and ELO scores to start fresh

-- Reset watched_movies table
UPDATE watched_movies 
SET 
  rating = NULL,
  elo_score = NULL,
  updated_at = NOW()
WHERE rating IS NOT NULL OR elo_score IS NOT NULL;

-- Reset ranking_items table (clear ELO scores)
UPDATE ranking_items 
SET 
  elo_score = NULL,
  updated_at = NOW()
WHERE elo_score IS NOT NULL;

-- Clear ranking_battles table
DELETE FROM ranking_battles;

-- Reset sequence if needed (optional)
-- ALTER SEQUENCE ranking_battles_id_seq RESTART WITH 1;

-- Verify the reset
SELECT 
  'watched_movies' as table_name,
  COUNT(*) as total_records,
  COUNT(rating) as rated_movies,
  COUNT(elo_score) as movies_with_elo
FROM watched_movies
UNION ALL
SELECT 
  'ranking_items' as table_name,
  COUNT(*) as total_records,
  NULL as rated_movies,
  COUNT(elo_score) as movies_with_elo
FROM ranking_items
UNION ALL
SELECT 
  'ranking_battles' as table_name,
  COUNT(*) as total_records,
  NULL as rated_movies,
  NULL as movies_with_elo
FROM ranking_battles; 