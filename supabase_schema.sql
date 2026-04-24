-- ============================================================
-- Englify — Supabase Schema (v2)
-- Run in Supabase SQL Editor → New Query → Run All
-- ============================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  name text,
  native_language text DEFAULT 'Turkish',
  cefr_level text DEFAULT 'A1',
  subscription_plan text DEFAULT 'free',
  stripe_customer_id text,
  daily_goal integer DEFAULT 10,
  streak_count integer DEFAULT 0,
  last_active date,
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);

-- Words table (shared cache across all users — never call Claude twice for the same word)
CREATE TABLE IF NOT EXISTS words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text UNIQUE NOT NULL,           -- lowercase, unique — used as cache key
  phonetic text DEFAULT '',
  definition_en text DEFAULT '',       -- English definition
  definition_tr text DEFAULT '',       -- Turkish translation (always stored)
  example_sentence text DEFAULT '',    -- one strong example sentence
  part_of_speech text DEFAULT '',
  cefr_level text NOT NULL DEFAULT 'B1',
  synonyms jsonb DEFAULT '[]'::jsonb,
  word_family jsonb DEFAULT '[]'::jsonb,
  audio_url text,                      -- cached TTS audio URL (optional)
  source text DEFAULT 'oxford',        -- 'oxford' | 'ai' | 'touch_saved'
  ai_generated_at timestamp WITH TIME ZONE, -- when AI last enriched this word
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);

-- User words (per-user learning progress)
CREATE TABLE IF NOT EXISTS user_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  word_id uuid REFERENCES words(id) ON DELETE CASCADE,
  status text DEFAULT 'learning',      -- 'learning' | 'known' | 'saved' | 'touch_saved'
  save_source text DEFAULT 'flashcard', -- 'flashcard' | 'touch' | 'manual'
  ease_factor float DEFAULT 2.5,
  interval_days integer DEFAULT 1,
  next_review_date date,
  times_seen integer DEFAULT 0,
  times_correct integer DEFAULT 0,
  saved_at timestamp WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, word_id)
);

-- Articles (cached AI-generated reading content — never regenerate same topic+level)
CREATE TABLE IF NOT EXISTS articles (
  id text PRIMARY KEY,
  title text,
  content text,
  cefr_level text,
  topic text,
  word_count integer,
  comprehension_questions jsonb DEFAULT '[]'::jsonb,
  created_at timestamp WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(topic, cefr_level)            -- cache key: same topic+level → reuse
);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Users
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- User words
CREATE POLICY "Users can read own word progress"
  ON user_words FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own word progress"
  ON user_words FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own word progress"
  ON user_words FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own word progress"
  ON user_words FOR DELETE USING (auth.uid() = user_id);

-- Shared read access
CREATE POLICY "Anyone can read words"    ON words    FOR SELECT USING (true);
CREATE POLICY "Anyone can read articles" ON articles FOR SELECT USING (true);

-- Service role can write to words/articles (used by backend for caching)
CREATE POLICY "Service can write words"
  ON words FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update words"
  ON words FOR UPDATE USING (true);
CREATE POLICY "Service can write articles"
  ON articles FOR INSERT WITH CHECK (true);

-- Books table (PDF uploads)
CREATE TABLE IF NOT EXISTS books (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        text NOT NULL,
  paragraphs   text[] NOT NULL DEFAULT '{}',
  total_words  integer NOT NULL DEFAULT 0,
  page_count   integer NOT NULL DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own books" ON books
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Service role bypass for backend inserts
CREATE POLICY "Service role full access on books" ON books
  TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_words_user_id     ON user_words(user_id);
CREATE INDEX IF NOT EXISTS idx_user_words_review       ON user_words(user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_user_words_status       ON user_words(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_words_source       ON user_words(user_id, save_source);
CREATE INDEX IF NOT EXISTS idx_words_cefr              ON words(cefr_level);
CREATE INDEX IF NOT EXISTS idx_words_word              ON words(word);
CREATE INDEX IF NOT EXISTS idx_articles_topic_level    ON articles(topic, cefr_level);
CREATE INDEX IF NOT EXISTS idx_books_user_id           ON books(user_id);

-- ============================================================
-- Seed: Oxford 3000 sample words (new schema)
-- ============================================================
INSERT INTO words (word, phonetic, definition_en, definition_tr, example_sentence, part_of_speech, cefr_level, synonyms, word_family, source) VALUES
('ability',      '/əˈbɪlɪti/',   'The power or skill to do something.',                                                            'Yetenek, beceri.',                                                   'She has the ability to speak four languages.',                                   'noun',      'A2', '["skill","talent","capability"]',             '["able","inability","disable"]',                   'oxford'),
('achievement',  '/əˈtʃiːvmənt/', 'A thing done successfully, especially with effort.',                                             'Başarı, kazanım.',                                                   'Finishing the marathon was her greatest achievement.',                          'noun',      'B1', '["accomplishment","attainment","success"]',    '["achieve","achiever","overachieve"]',              'oxford'),
('ambiguous',    '/æmˈbɪɡjuəs/', 'Open to more than one interpretation; not having one obvious meaning.',                          'Belirsiz, çift anlamlı, muğlak.',                                    'Her ambiguous reply left us confused about her intentions.',                    'adjective', 'B2', '["unclear","vague","equivocal"]',             '["ambiguity","ambiguously","unambiguous"]',         'oxford'),
('analyze',      '/ˈænəlaɪz/',   'To examine something methodically and in detail.',                                               'Analiz etmek, incelemek.',                                           'Scientists analyzed the samples to identify the unknown substance.',             'verb',      'B1', '["examine","study","investigate"]',            '["analysis","analyst","analytical"]',              'oxford'),
('benefit',      '/ˈbenɪfɪt/',   'An advantage or profit gained from something.',                                                  'Fayda, yarar, avantaj.',                                             'Regular exercise has many proven health benefits.',                             'noun',      'A2', '["advantage","gain","profit"]',               '["beneficial","beneficiary"]',                     'oxford'),
('consequence',  '/ˈkɒnsɪkwəns/', 'A result or effect, typically a negative one, of an action.',                                   'Sonuç, etki.',                                                       'You must face the consequences of your own decisions.',                         'noun',      'B1', '["result","outcome","effect"]',               '["consequent","consequently"]',                    'oxford'),
('determine',    '/dɪˈtɜːrmɪn/', 'To cause something to occur in a particular way; to decide.',                                   'Belirlemek, tayin etmek, karar vermek.',                             'Your attitude will largely determine your success in life.',                    'verb',      'B2', '["decide","establish","ascertain"]',           '["determination","determined","indeterminate"]',   'oxford'),
('efficient',    '/ɪˈfɪʃənt/',   'Achieving maximum productivity with minimum wasted effort.',                                     'Verimli, etkin, randımanlı.',                                        'The new production system is far more efficient than the old one.',             'adjective', 'B1', '["effective","productive","streamlined"]',    '["efficiency","efficiently","inefficient"]',       'oxford'),
('elaborate',    '/ɪˈlæbərət/',  'Involving many carefully arranged parts or details; intricate.',                                 'Ayrıntılı, özenle hazırlanmış, karmaşık, süslü.',                   'She wore an elaborate costume decorated with hundreds of gems.',                'adjective', 'B2', '["detailed","intricate","complex","ornate"]', '["elaborate (v)","elaborately","elaboration"]',    'oxford'),
('eloquent',     '/ˈeləkwənt/',  'Fluent or persuasive in speaking or writing.',                                                  'Belagatli, etkili ve akıcı biçimde konuşan veya yazan.',            'The lawyer gave an eloquent speech that moved the entire courtroom.',           'adjective', 'C1', '["articulate","expressive","fluent"]',        '["eloquence","eloquently"]',                       'oxford'),
('fundamental',  '/ˌfʌndəˈmentəl/', 'Forming a necessary base; of central importance.',                                          'Temel, esaslı, zorunlu.',                                            'There is a fundamental difference between these two approaches.',              'adjective', 'B2', '["basic","essential","core"]',               '["fundamentally","fundamentals"]',                 'oxford'),
('persevere',    '/ˌpɜːrsɪˈvɪər/', 'To continue doing something despite difficulty or delay.',                                   'Zorluklar karşısında ısrarla devam etmek; azimle sürdürmek.',       'She persevered despite many setbacks and eventually reached her goal.',         'verb',      'B1', '["persist","endure","continue"]',             '["perseverance","perseverant"]',                   'oxford'),
('perspective',  '/pəˈspektɪv/', 'A particular attitude toward something; a point of view.',                                      'Bakış açısı, perspektif.',                                           'We should always try to consider different perspectives on an issue.',          'noun',      'B2', '["viewpoint","standpoint","outlook"]',        '["perspectival"]',                                 'oxford'),
('significant',  '/sɪɡˈnɪfɪkənt/', 'Sufficiently great or important to be worthy of attention.',                                 'Önemli, anlamlı, kayda değer.',                                      'There has been a significant improvement in her performance this year.',        'adjective', 'B1', '["important","notable","considerable"]',      '["significance","significantly","insignificant"]', 'oxford'),
('versatile',    '/ˈvɜːrsətaɪl/', 'Able to adapt or be adapted to many different functions or activities.',                       'Çok yönlü, çeşitli alanlarda kullanılabilir.',                       'She is a versatile actress who can play both comedy and drama.',                'adjective', 'C1', '["adaptable","flexible","multifaceted"]',    '["versatility","versatilely"]',                    'oxford')
ON CONFLICT (word) DO UPDATE SET
  phonetic       = EXCLUDED.phonetic,
  definition_en  = EXCLUDED.definition_en,
  definition_tr  = EXCLUDED.definition_tr,
  example_sentence = EXCLUDED.example_sentence,
  part_of_speech = EXCLUDED.part_of_speech,
  cefr_level     = EXCLUDED.cefr_level,
  synonyms       = EXCLUDED.synonyms,
  word_family    = EXCLUDED.word_family;
