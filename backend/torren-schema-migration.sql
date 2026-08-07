-- =============================================
-- TORREN PORTAL - Schema Migration
-- Execute in Supabase Dashboard -> SQL Editor
-- AFTER running the original supabase-schema.sql
-- =============================================

-- === NEW TABLES ===

-- Landing Content (key-value store for editable landing sections)
CREATE TABLE IF NOT EXISTS landing_content (
  id SERIAL PRIMARY KEY,
  section VARCHAR(50) NOT NULL,
  key VARCHAR(200) NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(section, key)
);

-- Services (editable from admin)
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  subtitle VARCHAR(200),
  description TEXT,
  features JSONB NOT NULL DEFAULT '[]',
  icon VARCHAR(50) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- === STRIPE COLUMNS ===

ALTER TABLE clients ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(100);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(100);
ALTER TABLE plans ADD COLUMN IF NOT EXISTS stripe_price_id VARCHAR(100);
ALTER TABLE plans ADD COLUMN IF NOT EXISTS stripe_product_id VARCHAR(100);

-- === INDEXES ===

CREATE INDEX IF NOT EXISTS idx_landing_content_section ON landing_content(section);
CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);

-- === SEED: Services (from services.js) ===

INSERT INTO services (slug, title, subtitle, description, features, icon, sort_order) VALUES
('desarrollo-medida', 'Desarrollo a Medida', 'Software que se adapta a tu negocio',
 'Creamos soluciones de software personalizadas que se integran perfectamente con los procesos existentes de tu empresa. Desde aplicaciones web hasta sistemas empresariales complejos.',
 '["Analisis profundo de requerimientos","Arquitectura escalable y moderna","Pruebas automatizadas","Documentacion tecnica completa","Soporte post-lanzamiento"]',
 'code', 1),
('soporte-tecnico', 'Soporte Tecnico', 'Resolucion rapida de incidencias',
 'Nuestro equipo de expertos esta disponible para resolver cualquier incidencia tecnica. Tiempos de respuesta garantizados segun tu nivel de servicio.',
 '["Soporte por multiples canales","SLA de respuesta garantizado","Escalamiento automatico","Base de conocimiento dedicada","Reportes de incidencias"]',
 'support', 2),
('monitoreo', 'Monitoreo 24/7', 'Vigilancia continua de tus sistemas',
 'Supervisamos la salud y rendimiento de tu infraestructura las 24 horas del dia. Detectamos y resolvemos problemas antes de que impacten a tus usuarios.',
 '["Monitoreo en tiempo real","Alertas proactivas","Dashboards de rendimiento","Analisis de tendencias","Informes mensuales detallados"]',
 'monitor', 3),
('backups', 'Backups y Seguridad', 'Proteccion integral de datos',
 'Implementamos estrategias de respaldo automatizado y seguridad para garantizar la integridad y disponibilidad de tu informacion critica.',
 '["Respaldos automaticos programados","Retencion configurable","Encriptacion en reposo y transito","Pruebas de restauracion periodicas","Cumplimiento normativo"]',
 'shield', 4),
('consultoria', 'Consultoria IT', 'Estrategia tecnologica a tu medida',
 'Asesoramos a tu equipo en la toma de decisiones tecnologicas. Desde la seleccion de plataformas hasta la optimizacion de procesos existentes.',
 '["Auditoria tecnologica","Hoja de ruta estrategica","Optimizacion de costos","Modernizacion de sistemas","Capacitacion de equipos"]',
 'consulting', 5),
('migraciones', 'Migraciones', 'Transicion segura a nuevas plataformas',
 'Gestionamos migraciones complejas de infraestructura, bases de datos y aplicaciones con cero perdida de datos y minima interrupcion del servicio.',
 '["Planificacion detallada","Migracion gradual o big-bang","Validacion de integridad","Rollback garantizado","Soporte post-migracion"]',
 'migrate', 6)
ON CONFLICT (slug) DO NOTHING;

-- === SEED: Landing Content ===

-- Hero section
INSERT INTO landing_content (section, key, value) VALUES
('hero', 'label', 'Desarrollo de Software a Medida'),
('hero', 'heading', 'Software que impulsa tu negocio'),
('hero', 'subtitle', 'Creamos soluciones tecnologicas personalizadas, soporte tecnico especializado, monitoreo 24/7 y respaldos automaticos para empresas que exigen excelencia.'),
('hero', 'cta_primary', 'Ver planes'),
('hero', 'cta_secondary', 'Contactar')
ON CONFLICT (section, key) DO NOTHING;

-- Process section
INSERT INTO landing_content (section, key, value) VALUES
('process', 'heading', 'Como Trabajamos'),
('process', 'subtitle', 'Un proceso claro y probado que garantiza resultados desde el primer dia.'),
('process', 'step_01_num', '01'),
('process', 'step_01_title', 'Descubrimiento'),
('process', 'step_01_desc', 'Analizamos tu negocio, procesos y necesidades para definir la solucion ideal.'),
('process', 'step_02_num', '02'),
('process', 'step_02_title', 'Desarrollo'),
('process', 'step_02_desc', 'Construimos tu software con metodologia agil, entregas parciales y feedback constante.'),
('process', 'step_03_num', '03'),
('process', 'step_03_title', 'Implementacion'),
('process', 'step_03_desc', 'Desplegamos la solucion, capacitamos a tu equipo y garantizamos una transicion sin fricciones.'),
('process', 'step_04_num', '04'),
('process', 'step_04_title', 'Soporte'),
('process', 'step_04_desc', 'Monitoreo continuo, soporte tecnico y mejoras incrementales para evolucionar contigo.')
ON CONFLICT (section, key) DO NOTHING;

-- Why section
INSERT INTO landing_content (section, key, value) VALUES
('why', 'heading', '¿Por Que TORREN?'),
('why', 'subtitle', 'No somos proveedores. Somos tu equipo tecnologico de confianza.'),
('why', 'item_01_title', 'Metodologia Agil'),
('why', 'item_01_desc', 'Iteraciones cortas, entregas frecuentes y comunicacion constante. Siempre sabras el avance de tu proyecto.'),
('why', 'item_02_title', 'Equipo Especializado'),
('why', 'item_02_desc', 'Desarrolladores senior con experiencia en multiples industrias y tecnologias de vanguardia.'),
('why', 'item_03_title', 'Soporte Continuo'),
('why', 'item_03_desc', 'No te dejamos solo despues del lanzamiento. Monitoreo, mantenimiento y mejoras permanentes.'),
('why', 'item_04_title', 'Resultados Medibles'),
('why', 'item_04_desc', 'Cada hora registrada, cada ticket documentado. Transparencia total en el consumo de tus recursos.')
ON CONFLICT (section, key) DO NOTHING;

-- CTA section
INSERT INTO landing_content (section, key, value) VALUES
('cta', 'heading', '¿Listo para transformar tu software?'),
('cta', 'subtitle', 'Agenda una consulta gratuita y descubre como podemos ayudar a tu empresa a crecer con tecnologia.'),
('cta', 'cta_primary', 'Agendar consulta'),
('cta', 'cta_secondary', 'Ver planes')
ON CONFLICT (section, key) DO NOTHING;

-- Services section heading
INSERT INTO landing_content (section, key, value) VALUES
('services', 'heading', 'Nuestros Servicios'),
('services', 'subtitle', 'Soluciones tecnologicas integrales disenadas para empresas que buscan crecer con confianza.')
ON CONFLICT (section, key) DO NOTHING;

-- Pricing section heading
INSERT INTO landing_content (section, key, value) VALUES
('pricing', 'heading', 'Planes'),
('pricing', 'subtitle', 'Elige el plan que mejor se adapte a las necesidades de tu empresa.')
ON CONFLICT (section, key) DO NOTHING;

-- Stats section
INSERT INTO landing_content (section, key, value) VALUES
('stats', 'years_experience', '8')
ON CONFLICT (section, key) DO NOTHING;
