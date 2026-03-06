-- ============================================================
-- VCEL — Schema Supabase
-- Coller dans Supabase → SQL Editor → Run
-- ============================================================

-- 1. Table utilisateurs
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nom TEXT NOT NULL,
  role TEXT DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  secteur TEXT,
  categorie TEXT,
  stripe_customer_id TEXT,
  statut TEXT DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'suspendu')),
  date_inscription TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table CA / Finances
CREATE TABLE ca_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mois TEXT NOT NULL,           -- "2026-03"
  ca_ht NUMERIC DEFAULT 0,
  charges NUMERIC DEFAULT 0,
  marge NUMERIC GENERATED ALWAYS AS (ca_ht - charges) STORED,
  nb_factures INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table factures
CREATE TABLE factures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  numero_facture TEXT NOT NULL,
  date_facture DATE,
  montant_ht NUMERIC DEFAULT 0,
  tva NUMERIC DEFAULT 0,
  montant_ttc NUMERIC DEFAULT 0,
  statut TEXT DEFAULT 'en attente' CHECK (statut IN ('payée', 'en attente', 'en retard')),
  stripe_invoice_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table leads CRM
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  nom TEXT,
  email TEXT,
  telephone TEXT,
  entreprise TEXT,
  secteur TEXT,
  message TEXT,
  score TEXT DEFAULT 'tiède' CHECK (score IN ('chaud', 'tiède', 'froid')),
  statut TEXT DEFAULT 'nouveau' CHECK (statut IN ('nouveau', 'contacté', 'qualifié', 'converti', 'perdu')),
  source TEXT DEFAULT 'Site VCEL',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Table workflows
CREATE TABLE workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workflow_id TEXT NOT NULL,    -- ex: "vcel-leads-crm"
  nom TEXT NOT NULL,
  actif BOOLEAN DEFAULT FALSE,
  derniere_execution TIMESTAMPTZ,
  nb_executions_mois INT DEFAULT 0,
  statut TEXT DEFAULT 'inactif' CHECK (statut IN ('ok', 'erreur', 'inactif')),
  erreur_message TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS) — chaque client voit ses données
-- ============================================================

ALTER TABLE users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ca_data  ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads    ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- users : chacun voit son propre profil
CREATE POLICY "users_own" ON users
  FOR ALL USING (id::text = current_setting('app.user_id', true));

-- ca_data
CREATE POLICY "ca_own" ON ca_data
  FOR ALL USING (user_id::text = current_setting('app.user_id', true));

-- factures
CREATE POLICY "factures_own" ON factures
  FOR ALL USING (user_id::text = current_setting('app.user_id', true));

-- leads
CREATE POLICY "leads_own" ON leads
  FOR ALL USING (user_id::text = current_setting('app.user_id', true));

-- workflows
CREATE POLICY "workflows_own" ON workflows
  FOR ALL USING (user_id::text = current_setting('app.user_id', true));

-- ============================================================
-- Créer le compte admin VCEL (Killyan)
-- Remplace 'TON_HASH' par : node -e "const b=require('bcryptjs');console.log(b.hashSync('TON_MDP',10))"
-- ============================================================

INSERT INTO users (email, password_hash, nom, role, statut)
VALUES (
  'houlette.killyan.vcel@gmail.com',
  '$2a$10$YsK6GmVW33dAjnt6WTCuhOAAP8DCpd/wf8BmNpCHaaoK280Pi7YQu',
  'Killyan',
  'admin',
  'actif'
);
