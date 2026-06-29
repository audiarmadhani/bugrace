-- BugRace initial schema

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Profiles
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  username text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seasons
CREATE TABLE seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_number int NOT NULL UNIQUE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  application text NOT NULL DEFAULT 'store',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER seasons_updated_at
  BEFORE UPDATE ON seasons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Season user points
CREATE TABLE season_user_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(season_id, user_id)
);

CREATE TRIGGER season_user_points_updated_at
  BEFORE UPDATE ON season_user_points
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Daily challenges
CREATE TABLE daily_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  challenge_date date NOT NULL UNIQUE,
  bug_id text NOT NULL,
  bug_title text NOT NULL,
  correct_page text NOT NULL,
  correct_category text NOT NULL,
  correct_severity text NOT NULL,
  root_cause text NOT NULL,
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'REVEALED')),
  revealed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER daily_challenges_updated_at
  BEFORE UPDATE ON daily_challenges
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Submissions
CREATE TABLE submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  daily_challenge_id uuid NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  page_found text NOT NULL,
  category text NOT NULL,
  severity text NOT NULL,
  description text NOT NULL,
  accuracy_score int NOT NULL,
  started_at timestamptz,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  submission_duration_seconds int,
  ip_hash text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, daily_challenge_id)
);

CREATE TRIGGER submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Challenge views
CREATE TABLE challenge_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  daily_challenge_id uuid NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  opened_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER challenge_views_updated_at
  BEFORE UPDATE ON challenge_views
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- User badges
CREATE TABLE user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_key text NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_key)
);

CREATE TRIGGER user_badges_updated_at
  BEFORE UPDATE ON user_badges
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Challenge store persistence
CREATE TABLE challenge_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER challenge_profiles_updated_at
  BEFORE UPDATE ON challenge_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE challenge_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  status text NOT NULL DEFAULT 'Processing',
  total numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER challenge_orders_updated_at
  BEFORE UPDATE ON challenge_orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE challenge_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES challenge_orders(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  quantity int NOT NULL,
  unit_price numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER challenge_order_items_updated_at
  BEFORE UPDATE ON challenge_order_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Seasons viewable by authenticated"
  ON seasons FOR SELECT TO authenticated USING (true);

CREATE POLICY "Season points viewable by authenticated"
  ON season_user_points FOR SELECT TO authenticated USING (true);

CREATE POLICY "Daily challenges viewable by authenticated"
  ON daily_challenges FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can read own submissions"
  ON submissions FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own submissions"
  ON submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenge views"
  ON challenge_views FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own badges"
  ON user_badges FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Challenge profiles readable by authenticated"
  ON challenge_profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Challenge profiles updatable by authenticated"
  ON challenge_profiles FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Challenge orders readable by authenticated"
  ON challenge_orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Challenge orders insertable by authenticated"
  ON challenge_orders FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Challenge order items readable by authenticated"
  ON challenge_order_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Challenge order items insertable by authenticated"
  ON challenge_order_items FOR INSERT TO authenticated WITH CHECK (true);

-- Indexes
CREATE INDEX idx_submissions_daily_challenge ON submissions(daily_challenge_id);
CREATE INDEX idx_submissions_user ON submissions(user_id);
CREATE INDEX idx_daily_challenges_date ON daily_challenges(challenge_date);
CREATE INDEX idx_season_user_points_season ON season_user_points(season_id);
CREATE INDEX idx_challenge_views_daily ON challenge_views(daily_challenge_id);
CREATE INDEX idx_challenge_orders_username ON challenge_orders(username);
