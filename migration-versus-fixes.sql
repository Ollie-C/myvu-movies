-- Migration for versus ranking fixes
-- Run this SQL in your Supabase SQL editor

-- 1. Add new columns to ranking_lists table
ALTER TABLE ranking_lists 
ADD COLUMN IF NOT EXISTS elo_handling TEXT DEFAULT 'global' CHECK (elo_handling IN ('global', 'local'));

ALTER TABLE ranking_lists 
ADD COLUMN IF NOT EXISTS battle_limit_type TEXT DEFAULT 'complete' CHECK (battle_limit_type IN ('complete', 'fixed', 'per-movie'));

ALTER TABLE ranking_lists 
ADD COLUMN IF NOT EXISTS battle_limit INTEGER;

-- 2. Update the status column to include 'paused' option
ALTER TABLE ranking_lists 
DROP CONSTRAINT IF EXISTS ranking_lists_status_check;

ALTER TABLE ranking_lists 
ADD CONSTRAINT ranking_lists_status_check CHECK (status IN ('active', 'paused', 'completed'));

-- 3. Update existing ranking lists based on description parsing (if needed)
UPDATE ranking_lists 
SET elo_handling = CASE 
  WHEN description LIKE '%(updates global ELO)%' THEN 'global'
  WHEN description LIKE '%(local ranking only)%' THEN 'local'
  ELSE 'global'  -- Default for existing records
END
WHERE elo_handling IS NULL;

-- 4. Update existing active ranking lists to paused status (for resumability)
UPDATE ranking_lists 
SET status = 'paused' 
WHERE status = 'active' AND ranking_method = 'versus';

-- 3. Create the RPC function for versus battles with config (if not already created)
CREATE OR REPLACE FUNCTION process_custom_versus_battle(
  p_winner_id TEXT,
  p_loser_id TEXT,
  p_ranking_list_id TEXT,
  p_use_global_elo BOOLEAN DEFAULT true
) RETURNS JSON AS $$
DECLARE
  winner_movie_id TEXT;
  loser_movie_id TEXT;
  winner_elo_before NUMERIC;
  loser_elo_before NUMERIC;
  winner_elo_after NUMERIC;
  loser_elo_after NUMERIC;
  k_factor NUMERIC := 32;
  expected_winner NUMERIC;
  expected_loser NUMERIC;
  battle_id TEXT;
  ranking_list_user_id TEXT;
BEGIN
  -- Get movie IDs (p_winner_id and p_loser_id are movie IDs)
  winner_movie_id := p_winner_id;
  loser_movie_id := p_loser_id;
  
  -- Get ranking list user for potential global ELO updates
  SELECT user_id INTO ranking_list_user_id
  FROM ranking_lists 
  WHERE id = p_ranking_list_id;
  
  -- Get current ELO scores from ranking list items
  SELECT elo_score INTO winner_elo_before
  FROM ranking_list_items
  WHERE ranking_list_id = p_ranking_list_id AND movie_id = winner_movie_id;
  
  SELECT elo_score INTO loser_elo_before
  FROM ranking_list_items
  WHERE ranking_list_id = p_ranking_list_id AND movie_id = loser_movie_id;
  
  -- Set default ELO if not found
  IF winner_elo_before IS NULL THEN
    winner_elo_before := 1200;
  END IF;
  
  IF loser_elo_before IS NULL THEN
    loser_elo_before := 1200;
  END IF;
  
  -- Calculate expected scores
  expected_winner := 1.0 / (1.0 + POW(10, (loser_elo_before - winner_elo_before) / 400.0));
  expected_loser := 1.0 / (1.0 + POW(10, (winner_elo_before - loser_elo_before) / 400.0));
  
  -- Calculate new ELO scores (winner gets score of 1, loser gets 0)
  winner_elo_after := winner_elo_before + k_factor * (1 - expected_winner);
  loser_elo_after := loser_elo_before + k_factor * (0 - expected_loser);
  
  -- Update ranking list items with new ELO scores
  UPDATE ranking_list_items
  SET elo_score = winner_elo_after, updated_at = NOW()
  WHERE ranking_list_id = p_ranking_list_id AND movie_id = winner_movie_id;
  
  UPDATE ranking_list_items
  SET elo_score = loser_elo_after, updated_at = NOW()
  WHERE ranking_list_id = p_ranking_list_id AND movie_id = loser_movie_id;
  
  -- Insert battle record
  INSERT INTO versus_battles (
    ranking_list_id,
    winner_movie_id,
    loser_movie_id,
    winner_elo_before,
    winner_elo_after,
    loser_elo_before,
    loser_elo_after,
    created_at
  ) VALUES (
    p_ranking_list_id,
    winner_movie_id,
    loser_movie_id,
    winner_elo_before,
    winner_elo_after,
    loser_elo_before,
    loser_elo_after,
    NOW()
  ) RETURNING id INTO battle_id;
  
  -- Update global ELO scores in watched_movies if enabled
  IF p_use_global_elo AND ranking_list_user_id IS NOT NULL THEN
    -- Update winner's global ELO
    UPDATE watched_movies
    SET elo_score = winner_elo_after, updated_at = NOW()
    WHERE user_id = ranking_list_user_id AND movie_id = winner_movie_id;
    
    -- Update loser's global ELO
    UPDATE watched_movies
    SET elo_score = loser_elo_after, updated_at = NOW()
    WHERE user_id = ranking_list_user_id AND movie_id = loser_movie_id;
  END IF;
  
  -- Update ranking list timestamp
  UPDATE ranking_lists
  SET updated_at = NOW()
  WHERE id = p_ranking_list_id;
  
  -- Return battle results
  RETURN json_build_object(
    'battle_id', battle_id,
    'winner_movie_id', winner_movie_id,
    'loser_movie_id', loser_movie_id,
    'winner_elo_before', winner_elo_before,
    'winner_elo_after', winner_elo_after,
    'loser_elo_before', loser_elo_before,
    'loser_elo_after', loser_elo_after,
    'global_elo_updated', p_use_global_elo
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to the function for documentation
COMMENT ON FUNCTION process_custom_versus_battle IS 'Process versus battle with configurable ELO handling (global vs local)';
