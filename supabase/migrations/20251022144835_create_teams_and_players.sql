/*
  # Create teams and players schema

  1. New Tables
    - `teams`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `formation` (text) - Formation type like "4-3-3"
      - `is_public` (boolean) - Whether team can be shared
      - `share_code` (text, unique) - Code for sharing team
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `players`
      - `id` (uuid, primary key)
      - `team_id` (uuid, references teams)
      - `name` (text)
      - `position` (text) - Field position
      - `shirt_number` (text)
      - `x_position` (integer) - X coordinate on field
      - `y_position` (integer) - Y coordinate on field
      - `image_url` (text)
      - `date_of_birth` (text)
      - `height` (text)
      - `origin` (text)
      - `games` (integer, default 0)
      - `goals` (integer, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only manage their own teams
    - Public teams are readable by anyone with share code
    - Players are managed through team ownership
*/

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Mitt Lag',
  formation text DEFAULT '4-3-3',
  is_public boolean DEFAULT false,
  share_code text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  position text DEFAULT '',
  shirt_number text DEFAULT '',
  x_position integer NOT NULL,
  y_position integer NOT NULL,
  image_url text DEFAULT '',
  date_of_birth text DEFAULT '',
  height text DEFAULT '',
  origin text DEFAULT '',
  games integer DEFAULT 0,
  goals integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS teams_user_id_idx ON teams(user_id);
CREATE INDEX IF NOT EXISTS teams_share_code_idx ON teams(share_code);
CREATE INDEX IF NOT EXISTS players_team_id_idx ON players(team_id);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Teams policies
CREATE POLICY "Users can view own teams"
  ON teams FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public teams with share code"
  ON teams FOR SELECT
  TO authenticated
  USING (is_public = true AND share_code IS NOT NULL);

CREATE POLICY "Users can insert own teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own teams"
  ON teams FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own teams"
  ON teams FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Players policies
CREATE POLICY "Users can view players of their teams"
  ON players FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = players.team_id
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view players of public teams"
  ON players FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = players.team_id
      AND teams.is_public = true
      AND teams.share_code IS NOT NULL
    )
  );

CREATE POLICY "Users can insert players to their teams"
  ON players FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = players.team_id
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update players of their teams"
  ON players FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = players.team_id
      AND teams.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = players.team_id
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete players of their teams"
  ON players FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = players.team_id
      AND teams.user_id = auth.uid()
    )
  );

-- Function to generate unique share code
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
