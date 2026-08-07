-- =============================================
-- TORREN PORTAL - Supabase Schema
-- Ejecutar en Supabase Dashboard → SQL Editor
-- =============================================

-- === ENUMS ===
CREATE TYPE client_status AS ENUM ('prospecto', 'activo', 'suspendido', 'baja');
CREATE TYPE user_role AS ENUM ('admin', 'agent', 'client_user');
CREATE TYPE subscription_status AS ENUM ('solicitada', 'activa', 'pausada', 'cancelada');
CREATE TYPE ledger_type AS ENUM ('allocation', 'consumption', 'adjustment', 'rollover');
CREATE TYPE ticket_type AS ENUM ('soporte', 'bug', 'nuevo_desarrollo', 'actualizacion');
CREATE TYPE ticket_priority AS ENUM ('baja', 'media', 'alta', 'critica');
CREATE TYPE ticket_status AS ENUM ('nuevo', 'en_analisis', 'en_progreso', 'esperando_cliente', 'resuelto', 'cerrado');

-- === TABLES ===

-- Clients
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  client_number VARCHAR(20) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  status client_status NOT NULL DEFAULT 'prospecto',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Users (linked to Supabase Auth)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  supabase_uid UUID UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'client_user',
  client_id INTEGER REFERENCES clients(id),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Plans
CREATE TABLE plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  dev_hours_monthly INTEGER NOT NULL,
  features JSON NOT NULL DEFAULT '[]',
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  plan_id INTEGER NOT NULL REFERENCES plans(id),
  status subscription_status NOT NULL DEFAULT 'solicitada',
  start_date TIMESTAMP,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tickets
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  folio VARCHAR(30) UNIQUE NOT NULL,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  created_by INTEGER NOT NULL REFERENCES users(id),
  type ticket_type NOT NULL,
  priority ticket_priority NOT NULL DEFAULT 'media',
  status ticket_status NOT NULL DEFAULT 'nuevo',
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  assigned_to INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Ticket Comments
CREATE TABLE ticket_comments (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Time Entries
CREATE TABLE time_entries (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id),
  agent_id INTEGER NOT NULL REFERENCES users(id),
  hours DECIMAL(10,2) NOT NULL,
  work_date TIMESTAMP NOT NULL,
  notes TEXT,
  billable BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Hour Ledger (append-only)
CREATE TABLE hour_ledger (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  type ledger_type NOT NULL,
  hours DECIMAL(10,2) NOT NULL,
  ticket_id INTEGER REFERENCES tickets(id),
  time_entry_id INTEGER REFERENCES time_entries(id),
  description TEXT,
  period VARCHAR(7) NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User Sessions (for connect-pg-simple if needed later)
CREATE TABLE user_sessions (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL,
  PRIMARY KEY (sid)
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON user_sessions (expire);

-- === INDEXES ===
CREATE INDEX idx_users_supabase_uid ON users(supabase_uid);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_client_id ON users(client_id);
CREATE INDEX idx_tickets_client_id ON tickets(client_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_hour_ledger_client_id ON hour_ledger(client_id);
CREATE INDEX idx_hour_ledger_period ON hour_ledger(period);
CREATE INDEX idx_subscriptions_client_id ON subscriptions(client_id);
CREATE INDEX idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX idx_time_entries_ticket_id ON time_entries(ticket_id);

-- === ENABLE RLS (optional - for future use) ===
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- etc.

-- =============================================
-- SEED DATA
-- Ejecutar después de crear las tablas
-- =============================================

-- Plans
INSERT INTO plans (name, slug, price_monthly, dev_hours_monthly, features, sort_order) VALUES
('Starter', 'starter', 4500.00, 10, '["10 horas de desarrollo al mes","Backups semanales","Monitoreo básico","SLA de respuesta en 24 horas","Soporte por correo electrónico"]', 1),
('Growth', 'growth', 9500.00, 25, '["25 horas de desarrollo al mes","Backups diarios","Monitoreo 24/7","SLA de respuesta en 8 horas","Soporte prioritario","Reporte mensual de actividades"]', 2),
('Enterprise', 'enterprise', 19500.00, 60, '["60 horas de desarrollo al mes","Backups diarios con retención de 30 días","Monitoreo 24/7 proactivo con alertas","SLA de respuesta en 4 horas","Soporte prioritario dedicado","Reporte mensual detallado","Reuniones de seguimiento mensuales"]', 3);

-- Clients
INSERT INTO clients (client_number, company_name, contact_name, status) VALUES
('BYD-0001', 'TechCorp Solutions', 'Juan Pérez García', 'activo'),
('BYD-0002', 'Innovación Digital SA', 'María López Hernández', 'activo');

-- NOTE: Users must be created through Supabase Auth first, then inserted here
-- The supabase_uid must match the user's ID in auth.users
-- Run the seed script after creating users in Supabase Auth

-- Subscriptions (will be created after users)
-- Tickets (will be created after users)
-- Time Entries (will be created after users)
-- Hour Ledger (will be created after users)
