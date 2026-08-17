import { Router } from 'express';
import { createAdminClient } from '../config/supabase.js';
import rateLimit from 'express-rate-limit';
import { services as staticServices } from '../config/services.js';

const router = Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Demasiadas solicitudes. Intenta de nuevo mas tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/public/plans
router.get('/plans', async (req, res) => {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from('plans')
      .select('id, name, slug, base_price, billing_type, plan_family, dev_hours_monthly, features, stripe_product_id, stripe_price_id')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Error fetching public plans:', err);
    res.status(500).json({ error: err.message || 'Error al obtener planes', details: err.stack });
  }
});

// GET /api/public/products
router.get('/products', async (req, res) => {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from('products')
      .select('id, slug, name, tagline, description, icon, image_url, monthly_price, features, demo_url, stripe_product_id, stripe_price_id')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    const products = (data || []).map(p => ({
      ...p,
      features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features || [],
    }));

    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: err.message || 'Error al obtener productos' });
  }
});

// GET /api/public/stats
router.get('/stats', async (req, res) => {
  try {
    const db = createAdminClient();
    const { count: activeClients } = await db
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'activo');

    const { count: resolvedTickets } = await db
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .in('status', ['resuelto', 'cerrado']);

    const { data: allocations } = await db
      .from('hour_ledger')
      .select('hours')
      .eq('type', 'allocation');

    const totalHours = allocations?.reduce((sum, row) => sum + parseFloat(row.hours), 0) || 0;

    // Get yearsExperience from landing_content
    const { data: yearsContent } = await db
      .from('landing_content')
      .select('value')
      .eq('section', 'stats')
      .eq('key', 'years_experience')
      .limit(1);

    const yearsExperience = yearsContent?.length > 0 ? parseInt(yearsContent[0].value) : 8;

    res.json({
      activeClients: activeClients || 0,
      resolvedTickets: resolvedTickets || 0,
      totalHoursManaged: totalHours,
      yearsExperience,
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Error al obtener estadisticas' });
  }
});

// GET /api/public/services
router.get('/services', async (req, res) => {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from('services')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    // Parse features JSON for each service
    const services = (data || []).map(s => ({
      ...s,
      features: typeof s.features === 'string' ? JSON.parse(s.features) : s.features || [],
    }));

    res.json(services);
  } catch (err) {
    console.error('Error fetching services from DB, using static fallback:', err);
    res.json(staticServices);
  }
});

// GET /api/public/content - Get landing page content
router.get('/content', async (req, res) => {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from('landing_content')
      .select('section, key, value');

    if (error) throw error;

    const grouped = {};
    for (const row of data) {
      if (!grouped[row.section]) grouped[row.section] = {};
      grouped[row.section][row.key] = row.value;
    }

    res.json(grouped);
  } catch (err) {
    console.error('Error fetching content:', err);
    res.status(500).json({ error: 'Error al obtener contenido' });
  }
});

// POST /api/public/contact
router.post('/contact', contactLimiter, async (req, res) => {
  try {
    const db = createAdminClient();
    const { companyName, contactName, email, planSlug, phone, message, service } = req.body;

    if (!companyName || !contactName || !email) {
      return res.status(400).json({ error: 'Nombre, contacto y email son requeridos' });
    }

    const { data: lastClients } = await db
      .from('clients')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);

    const nextNum = lastClients && lastClients.length > 0 ? lastClients[0].id + 1 : 1;
    const clientNumber = `TRN-${String(nextNum).padStart(4, '0')}`;

    const { data: newClient, error: clientError } = await db
      .from('clients')
      .insert({
        client_number: clientNumber,
        company_name: companyName,
        contact_name: contactName,
        status: 'prospecto',
      })
      .select()
      .single();

    if (clientError) throw clientError;

    if (planSlug && planSlug !== 'consulta-general') {
      const { data: plans } = await db
        .from('plans')
        .select('id')
        .eq('slug', planSlug)
        .limit(1);

      if (plans && plans.length > 0) {
        await db
          .from('subscriptions')
          .insert({
            client_id: newClient.id,
            plan_id: plans[0].id,
            status: 'solicitada',
          });
      }
    }

    // The phone number and free-form message have nowhere to live on `clients`
    // (no such columns there) — persist them on contact_messages so the admin
    // panel can actually read what the visitor wrote instead of silently
    // dropping it, as the previous version of this route did.
    if (phone || message) {
      const { error: messageError } = await db
        .from('contact_messages')
        .insert({
          company_name: companyName,
          contact_name: contactName,
          email,
          phone: phone || null,
          service: service || planSlug || null,
          message: message || null,
          client_id: newClient.id,
        });
      if (messageError) console.error('Error saving contact message:', messageError);
    }

    res.status(201).json({
      message: 'Solicitud recibida. Nuestro equipo se pondra en contacto contigo pronto.',
      clientNumber: newClient.client_number,
    });
  } catch (err) {
    console.error('Error processing contact:', err);
    res.status(500).json({ error: 'Error al procesar solicitud' });
  }
});

export default router;
