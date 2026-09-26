-- Events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nickname VARCHAR(16) NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_players_token ON players(token);

-- Games table
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id),
    event_id UUID REFERENCES events(id),
    seed VARCHAR(64) NOT NULL,
    total_rounds INT NOT NULL DEFAULT 20,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    score INT DEFAULT 0,
    max_combo INT DEFAULT 0,
    correct_answers INT DEFAULT 0,
    errors INT DEFAULT 0,
    avg_reaction_ms INT DEFAULT 0,
    best_reaction_ms INT DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    submitted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_games_player ON games(player_id);
CREATE INDEX IF NOT EXISTS idx_games_event_score ON games(event_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);

-- Game rounds table
CREATE TABLE IF NOT EXISTS game_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    target_type VARCHAR(20) NOT NULL,
    target_value VARCHAR(10) NOT NULL,
    grid_data TEXT NOT NULL,
    selected_value VARCHAR(10),
    is_correct BOOLEAN,
    reaction_time_ms INT,
    score_earned INT DEFAULT 0,
    combo_at INT DEFAULT 0,
    answered_at TIMESTAMPTZ,
    presented_at TIMESTAMPTZ,
    UNIQUE(game_id, round_number)
);
CREATE INDEX IF NOT EXISTS idx_rounds_game ON game_rounds(game_id);

-- Insert default event
INSERT INTO events (name, is_active) VALUES ('CYBOTICS FAIR 2026', TRUE) ON CONFLICT DO NOTHING;
