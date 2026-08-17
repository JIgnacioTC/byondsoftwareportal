-- =============================================
-- TORREN PORTAL - Products Migration
-- Execute in Supabase Dashboard -> SQL Editor
-- AFTER running the original supabase-schema.sql
-- and torren-schema-migration.sql
-- =============================================

-- === NEW TABLE ===

-- Products (individual software products for rental)
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  tagline VARCHAR(300),
  description TEXT,
  icon VARCHAR(50) NOT NULL DEFAULT 'box',
  monthly_price NUMERIC(10,2) NOT NULL,
  features JSONB NOT NULL DEFAULT '[]',
  demo_url VARCHAR(500),
  stripe_product_id VARCHAR(100),
  stripe_price_id VARCHAR(100),
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- === ALTER SUBSCRIPTIONS ===

-- Allow product rentals: make plan_id nullable
ALTER TABLE subscriptions ALTER COLUMN plan_id DROP NOT NULL;

-- Add product_id column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'product_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN product_id INTEGER REFERENCES products(id);
  END IF;
END $$;

-- === INDEXES ===

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_product_id ON subscriptions(product_id);

-- === SEED DATA ===

INSERT INTO products (slug, name, tagline, description, icon, monthly_price, features, sort_order) VALUES
 ('punto-de-venta', 'Punto de Venta', 'Ventas rápidas y control total de inventario',
 'Sistema de punto de venta completo para negocios de todos los tamaños. Gestiona ventas, inventario, clientes y reportes desde una sola plataforma.',
 'cart', 1200.00,
 '["Registro de ventas rápido con escáner de código de barras","Control de inventario en tiempo real","Gestión de clientes y programas de lealtad","Reportes de ventas diarios, semanales y mensuales","Soporte para múltiples formas de pago","Emisión de tickets y facturas","Dashboard con métricas clave","Capacitación inicial incluida"]',
 1),

('crm', 'CRM', 'Relaciones que impulsan tu negocio',
 'Plataforma de gestión de relaciones con clientes diseñada para empresas mexicanas. Centraliza contactos, oportunidades y seguimiento comercial.',
 'users', 950.00,
 '["Gestión centralizada de contactos y empresas","Pipeline de ventas visual y personalizable","Seguimiento automatizado de oportunidades","Integración con correo electrónico","Reportes de rendimiento comercial","Alertas y recordatorios inteligentes","Importación masiva de contactos","Soporte y actualizaciones incluidos"]',
 2),
('erp', 'ERP', 'Gestión empresarial integral',
 'Sistema ERP modular que integra finanzas, inventario, compras, ventas y recursos humanos en una sola plataforma accesible desde cualquier dispositivo.',
 'layers', 2800.00,
 '["Módulo de contabilidad y finanzas","Gestión de inventario y almacén","Control de compras y proveedores","Nómina y recursos humanos","Reportes financieros automáticos","Facturación electrónica CFDI","Acceso multi-usuario con roles","Respaldo automático de datos"]',
 3)
ON CONFLICT (slug) DO NOTHING;