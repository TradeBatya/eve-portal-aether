-- ============================================
-- MEMBER AUDIT PLUGIN DATABASE SCHEMA
-- ============================================

-- 1. Основная таблица метаданных синхронизации
CREATE TABLE member_audit_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id BIGINT UNIQUE NOT NULL,
  user_id UUID NOT NULL,
  
  -- Статус синхронизации
  last_full_sync_at TIMESTAMPTZ,
  last_update_at TIMESTAMPTZ DEFAULT now(),
  sync_status TEXT DEFAULT 'pending',
  sync_progress JSONB DEFAULT '{}',
  sync_errors JSONB DEFAULT '[]',
  
  -- Настройки модулей
  enabled_modules JSONB DEFAULT '{
    "skills": true,
    "assets": true,
    "wallet": true,
    "contacts": true,
    "implants": true,
    "clones": true,
    "mail": false,
    "contracts": true,
    "industry": true,
    "mining": false,
    "loyalty": true
  }',
  
  -- Статистика
  total_sp BIGINT DEFAULT 0,
  unallocated_sp INTEGER DEFAULT 0,
  total_assets_value NUMERIC DEFAULT 0,
  wallet_balance NUMERIC DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Навыки персонажа
CREATE TABLE member_audit_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id BIGINT NOT NULL,
  skill_id INTEGER NOT NULL,
  skill_name TEXT NOT NULL,
  trained_skill_level INTEGER NOT NULL,
  active_skill_level INTEGER NOT NULL,
  skillpoints_in_skill BIGINT NOT NULL,
  
  -- Метаданные навыка
  skill_group_id INTEGER,
  skill_group_name TEXT,
  rank INTEGER,
  
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(character_id, skill_id)
);

-- 3. Очередь обучения
CREATE TABLE member_audit_skillqueue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id BIGINT NOT NULL,
  queue_position INTEGER NOT NULL,
  skill_id INTEGER NOT NULL,
  skill_name TEXT NOT NULL,
  finished_level INTEGER NOT NULL,
  
  training_start_sp INTEGER,
  level_start_sp INTEGER,
  level_end_sp INTEGER,
  
  start_date TIMESTAMPTZ,
  finish_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(character_id, queue_position)
);

-- 4. Кеш названий локаций
CREATE TABLE member_audit_location_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id BIGINT UNIQUE NOT NULL,
  location_name TEXT NOT NULL,
  location_type TEXT,
  
  solar_system_id INTEGER,
  solar_system_name TEXT,
  region_id INTEGER,
  region_name TEXT,
  
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Журнал кошелька
CREATE TABLE member_audit_wallet_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id BIGINT NOT NULL,
  journal_id BIGINT UNIQUE NOT NULL,
  
  date TIMESTAMPTZ NOT NULL,
  ref_type TEXT NOT NULL,
  
  first_party_id INTEGER,
  first_party_name TEXT,
  first_party_type TEXT,
  
  second_party_id INTEGER,
  second_party_name TEXT,
  second_party_type TEXT,
  
  amount NUMERIC NOT NULL,
  balance NUMERIC,
  tax NUMERIC,
  
  reason TEXT,
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Рыночные транзакции
CREATE TABLE member_audit_wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id BIGINT NOT NULL,
  transaction_id BIGINT UNIQUE NOT NULL,
  
  date TIMESTAMPTZ NOT NULL,
  
  type_id INTEGER NOT NULL,
  type_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  
  client_id INTEGER NOT NULL,
  client_name TEXT,
  
  location_id BIGINT NOT NULL,
  location_name TEXT,
  
  is_buy BOOLEAN NOT NULL,
  is_personal BOOLEAN NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Импланты
CREATE TABLE member_audit_implants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id BIGINT NOT NULL,
  implant_id INTEGER NOT NULL,
  implant_name TEXT NOT NULL,
  slot INTEGER NOT NULL,
  
  attributes JSONB,
  
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(character_id, slot)
);

-- 8. Jump Clones
CREATE TABLE member_audit_clones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id BIGINT NOT NULL,
  jump_clone_id INTEGER NOT NULL,
  
  location_id BIGINT NOT NULL,
  location_name TEXT,
  location_type TEXT,
  
  implants JSONB DEFAULT '[]',
  clone_name TEXT,
  
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(character_id, jump_clone_id)
);

-- 9. Контакты
CREATE TABLE member_audit_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id BIGINT NOT NULL,
  contact_id INTEGER NOT NULL,
  contact_name TEXT NOT NULL,
  contact_type TEXT NOT NULL,
  
  standing REAL NOT NULL,
  
  is_watched BOOLEAN DEFAULT false,
  is_blocked BOOLEAN DEFAULT false,
  
  label_ids JSONB DEFAULT '[]',
  
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(character_id, contact_id)
);

-- 10. Контракты
CREATE TABLE member_audit_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id BIGINT NOT NULL,
  contract_id INTEGER UNIQUE NOT NULL,
  
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  
  issuer_id INTEGER NOT NULL,
  issuer_name TEXT,
  assignee_id INTEGER,
  assignee_name TEXT,
  acceptor_id INTEGER,
  acceptor_name TEXT,
  
  price NUMERIC,
  reward NUMERIC,
  collateral NUMERIC,
  volume NUMERIC,
  
  start_location_id BIGINT,
  start_location_name TEXT,
  end_location_id BIGINT,
  end_location_name TEXT,
  
  date_issued TIMESTAMPTZ NOT NULL,
  date_expired TIMESTAMPTZ,
  date_accepted TIMESTAMPTZ,
  date_completed TIMESTAMPTZ,
  
  title TEXT,
  for_corporation BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Производственные задания
CREATE TABLE member_audit_industry_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id BIGINT NOT NULL,
  job_id INTEGER UNIQUE NOT NULL,
  
  activity_id INTEGER NOT NULL,
  activity_name TEXT NOT NULL,
  status TEXT NOT NULL,
  
  blueprint_id BIGINT NOT NULL,
  blueprint_type_id INTEGER NOT NULL,
  blueprint_type_name TEXT NOT NULL,
  blueprint_location_id BIGINT NOT NULL,
  
  product_type_id INTEGER,
  product_type_name TEXT,
  
  facility_id BIGINT NOT NULL,
  facility_name TEXT,
  solar_system_id INTEGER,
  solar_system_name TEXT,
  
  runs INTEGER NOT NULL,
  licensed_runs INTEGER,
  
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  pause_date TIMESTAMPTZ,
  
  cost NUMERIC,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Заголовки почты
CREATE TABLE member_audit_mail_headers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id BIGINT NOT NULL,
  mail_id INTEGER UNIQUE NOT NULL,
  
  from_id INTEGER NOT NULL,
  from_name TEXT,
  
  subject TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  
  is_read BOOLEAN DEFAULT false,
  
  labels JSONB DEFAULT '[]',
  recipients JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Loyalty Points
CREATE TABLE member_audit_loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id BIGINT NOT NULL,
  corporation_id INTEGER NOT NULL,
  corporation_name TEXT NOT NULL,
  loyalty_points INTEGER NOT NULL,
  
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(character_id, corporation_id)
);

-- 14. Логи ESI запросов
CREATE TABLE member_audit_esi_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id BIGINT NOT NULL,
  
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'GET',
  
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  
  error_message TEXT,
  error_details JSONB,
  
  request_timestamp TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- ============================================

CREATE INDEX idx_audit_metadata_character ON member_audit_metadata(character_id);
CREATE INDEX idx_audit_metadata_user ON member_audit_metadata(user_id);
CREATE INDEX idx_audit_metadata_sync_status ON member_audit_metadata(sync_status);

CREATE INDEX idx_audit_skills_character ON member_audit_skills(character_id);
CREATE INDEX idx_audit_skills_group ON member_audit_skills(skill_group_id);

CREATE INDEX idx_audit_skillqueue_character ON member_audit_skillqueue(character_id);
CREATE INDEX idx_audit_skillqueue_finish ON member_audit_skillqueue(finish_date);

CREATE INDEX idx_location_cache_id ON member_audit_location_cache(location_id);

CREATE INDEX idx_wallet_journal_character ON member_audit_wallet_journal(character_id);
CREATE INDEX idx_wallet_journal_date ON member_audit_wallet_journal(character_id, date DESC);
CREATE INDEX idx_wallet_journal_type ON member_audit_wallet_journal(ref_type);

CREATE INDEX idx_wallet_transactions_character ON member_audit_wallet_transactions(character_id);
CREATE INDEX idx_wallet_transactions_date ON member_audit_wallet_transactions(character_id, date DESC);
CREATE INDEX idx_wallet_transactions_type ON member_audit_wallet_transactions(type_id);

CREATE INDEX idx_audit_implants_character ON member_audit_implants(character_id);

CREATE INDEX idx_audit_clones_character ON member_audit_clones(character_id);

CREATE INDEX idx_audit_contacts_character ON member_audit_contacts(character_id);
CREATE INDEX idx_audit_contacts_standing ON member_audit_contacts(standing);

CREATE INDEX idx_audit_contracts_character ON member_audit_contracts(character_id);
CREATE INDEX idx_audit_contracts_status ON member_audit_contracts(status);
CREATE INDEX idx_audit_contracts_date ON member_audit_contracts(date_issued DESC);

CREATE INDEX idx_audit_industry_character ON member_audit_industry_jobs(character_id);
CREATE INDEX idx_audit_industry_status ON member_audit_industry_jobs(status);
CREATE INDEX idx_audit_industry_end_date ON member_audit_industry_jobs(end_date);

CREATE INDEX idx_audit_mail_character ON member_audit_mail_headers(character_id);
CREATE INDEX idx_audit_mail_timestamp ON member_audit_mail_headers(timestamp DESC);

CREATE INDEX idx_audit_loyalty_character ON member_audit_loyalty_points(character_id);

CREATE INDEX idx_esi_logs_character ON member_audit_esi_logs(character_id);
CREATE INDEX idx_esi_logs_timestamp ON member_audit_esi_logs(request_timestamp DESC);
CREATE INDEX idx_esi_logs_endpoint ON member_audit_esi_logs(endpoint);

-- Дополнительные индексы для character_assets
CREATE INDEX IF NOT EXISTS idx_character_assets_location ON character_assets(location_id);
CREATE INDEX IF NOT EXISTS idx_character_assets_type ON character_assets(type_id);
CREATE INDEX IF NOT EXISTS idx_character_assets_parent ON character_assets(parent_item_id);

-- ============================================
-- RLS ПОЛИТИКИ
-- ============================================

-- Включаем RLS для всех таблиц
ALTER TABLE member_audit_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_audit_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_audit_skillqueue ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_audit_location_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_audit_wallet_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_audit_wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_audit_implants ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_audit_clones ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_audit_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_audit_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_audit_industry_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_audit_mail_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_audit_loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_audit_esi_logs ENABLE ROW LEVEL SECURITY;

-- Политики для member_audit_metadata
CREATE POLICY "Users can view their own metadata"
  ON member_audit_metadata FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM eve_characters 
      WHERE eve_characters.character_id = member_audit_metadata.character_id
      AND eve_characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all metadata"
  ON member_audit_metadata FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own metadata"
  ON member_audit_metadata FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM eve_characters 
      WHERE eve_characters.character_id = member_audit_metadata.character_id
      AND eve_characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own metadata"
  ON member_audit_metadata FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM eve_characters 
      WHERE eve_characters.character_id = member_audit_metadata.character_id
      AND eve_characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own metadata"
  ON member_audit_metadata FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM eve_characters 
      WHERE eve_characters.character_id = member_audit_metadata.character_id
      AND eve_characters.user_id = auth.uid()
    )
  );

-- Политики для member_audit_skills
CREATE POLICY "Users can view their own skills"
  ON member_audit_skills FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM eve_characters 
      WHERE eve_characters.character_id = member_audit_skills.character_id
      AND eve_characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all skills"
  ON member_audit_skills FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage their own skills"
  ON member_audit_skills FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM eve_characters 
      WHERE eve_characters.character_id = member_audit_skills.character_id
      AND eve_characters.user_id = auth.uid()
    )
  );

-- Политики для member_audit_skillqueue
CREATE POLICY "Users can view their own skillqueue"
  ON member_audit_skillqueue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM eve_characters 
      WHERE eve_characters.character_id = member_audit_skillqueue.character_id
      AND eve_characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all skillqueue"
  ON member_audit_skillqueue FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage their own skillqueue"
  ON member_audit_skillqueue FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM eve_characters 
      WHERE eve_characters.character_id = member_audit_skillqueue.character_id
      AND eve_characters.user_id = auth.uid()
    )
  );

-- Политики для member_audit_location_cache (общедоступен для чтения)
CREATE POLICY "Everyone can view location cache"
  ON member_audit_location_cache FOR SELECT
  USING (true);

CREATE POLICY "System can manage location cache"
  ON member_audit_location_cache FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Политики для member_audit_wallet_journal
CREATE POLICY "Users can view their own wallet journal"
  ON member_audit_wallet_journal FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM eve_characters 
      WHERE eve_characters.character_id = member_audit_wallet_journal.character_id
      AND eve_characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all wallet journal"
  ON member_audit_wallet_journal FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage their own wallet journal"
  ON member_audit_wallet_journal FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM eve_characters 
      WHERE eve_characters.character_id = member_audit_wallet_journal.character_id
      AND eve_characters.user_id = auth.uid()
    )
  );

-- Политики для member_audit_wallet_transactions
CREATE POLICY "Users can view their own wallet transactions"
  ON member_audit_wallet_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM eve_characters 
      WHERE eve_characters.character_id = member_audit_wallet_transactions.character_id
      AND eve_characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all wallet transactions"
  ON member_audit_wallet_transactions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage their own wallet transactions"
  ON member_audit_wallet_transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM eve_characters 
      WHERE eve_characters.character_id = member_audit_wallet_transactions.character_id
      AND eve_characters.user_id = auth.uid()
    )
  );

-- Политики для member_audit_implants
CREATE POLICY "Users can view their own implants"
  ON member_audit_implants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM eve_characters 
      WHERE eve_characters.character_id = member_audit_implants.character_id
      AND eve_characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all implants"
  ON member_audit_implants FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage their own implants"
  ON member_audit_implants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM eve_characters 
      WHERE eve_characters.character_id = member_audit_implants.character_id
      AND eve_characters.user_id = auth.uid()
    )
  );

-- Политики для member_audit_clones
CREATE POLICY "Users can view their own clones"
  ON member_audit_clones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM eve_characters 
      WHERE eve_characters.character_id = member_audit_clones.character_id
      AND eve_characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all clones"
  ON member_audit_clones FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage their own clones"
  ON member_audit_clones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM eve_characters 
      WHERE eve_characters.character_id = member_audit_clones.character_id
      AND eve_characters.user_id = auth.uid()
    )
  );

-- Политики для member_audit_contacts
CREATE POLICY "Users can view their own contacts"
  ON member_audit_contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM eve_characters 
      WHERE eve_characters.character_id = member_audit_contacts.character_id
      AND eve_characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all contacts"
  ON member_audit_contacts FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage their own contacts"
  ON member_audit_contacts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM eve_characters 
      WHERE eve_characters.character_id = member_audit_contacts.character_id
      AND eve_characters.user_id = auth.uid()
    )
  );

-- Политики для member_audit_contracts
CREATE POLICY "Users can view their own contracts"
  ON member_audit_contracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM eve_characters 
      WHERE eve_characters.character_id = member_audit_contracts.character_id
      AND eve_characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all contracts"
  ON member_audit_contracts FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage their own contracts"
  ON member_audit_contracts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM eve_characters 
      WHERE eve_characters.character_id = member_audit_contracts.character_id
      AND eve_characters.user_id = auth.uid()
    )
  );

-- Политики для member_audit_industry_jobs
CREATE POLICY "Users can view their own industry jobs"
  ON member_audit_industry_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM eve_characters 
      WHERE eve_characters.character_id = member_audit_industry_jobs.character_id
      AND eve_characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all industry jobs"
  ON member_audit_industry_jobs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage their own industry jobs"
  ON member_audit_industry_jobs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM eve_characters 
      WHERE eve_characters.character_id = member_audit_industry_jobs.character_id
      AND eve_characters.user_id = auth.uid()
    )
  );

-- Политики для member_audit_mail_headers
CREATE POLICY "Users can view their own mail"
  ON member_audit_mail_headers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM eve_characters 
      WHERE eve_characters.character_id = member_audit_mail_headers.character_id
      AND eve_characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all mail"
  ON member_audit_mail_headers FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage their own mail"
  ON member_audit_mail_headers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM eve_characters 
      WHERE eve_characters.character_id = member_audit_mail_headers.character_id
      AND eve_characters.user_id = auth.uid()
    )
  );

-- Политики для member_audit_loyalty_points
CREATE POLICY "Users can view their own loyalty points"
  ON member_audit_loyalty_points FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM eve_characters 
      WHERE eve_characters.character_id = member_audit_loyalty_points.character_id
      AND eve_characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all loyalty points"
  ON member_audit_loyalty_points FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage their own loyalty points"
  ON member_audit_loyalty_points FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM eve_characters 
      WHERE eve_characters.character_id = member_audit_loyalty_points.character_id
      AND eve_characters.user_id = auth.uid()
    )
  );

-- Политики для member_audit_esi_logs
CREATE POLICY "Users can view their own esi logs"
  ON member_audit_esi_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM eve_characters 
      WHERE eve_characters.character_id = member_audit_esi_logs.character_id
      AND eve_characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all esi logs"
  ON member_audit_esi_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can manage esi logs"
  ON member_audit_esi_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM eve_characters 
      WHERE eve_characters.character_id = member_audit_esi_logs.character_id
      AND eve_characters.user_id = auth.uid()
    )
  );

-- ============================================
-- TRIGGERS ДЛЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ updated_at
-- ============================================

CREATE TRIGGER update_member_audit_metadata_updated_at
  BEFORE UPDATE ON member_audit_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_member_audit_skillqueue_updated_at
  BEFORE UPDATE ON member_audit_skillqueue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ДОБАВЛЕНИЕ ПЛАГИНА В СИСТЕМУ
-- ============================================

INSERT INTO plugins (plugin_id, name, version, description, author, is_system, enabled, metadata)
VALUES (
  'member-audit',
  'Member Audit',
  '1.0.0',
  'Comprehensive character audit system with full ESI data synchronization including skills, assets, wallet, contacts, contracts, industry jobs and more',
  'EVE Portal Aether',
  true,
  true,
  '{"category": "character", "required_scopes": ["esi-skills.read_skills.v1", "esi-skills.read_skillqueue.v1", "esi-assets.read_assets.v1", "esi-wallet.read_character_wallet.v1", "esi-clones.read_clones.v1", "esi-clones.read_implants.v1", "esi-characters.read_contacts.v1", "esi-contracts.read_character_contracts.v1", "esi-industry.read_character_jobs.v1", "esi-mail.read_mail.v1", "esi-characters.read_loyalty.v1"]}'::jsonb
)
ON CONFLICT (plugin_id) DO UPDATE
SET 
  name = EXCLUDED.name,
  version = EXCLUDED.version,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  updated_at = now();