import { Router } from 'express';
import { createAdminClient } from '../config/supabase.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

// All routes require admin role
router.use(requireRole('admin'));

// GET /api/admin/content - Get all landing content
router.get('/', async (req, res) => {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from('landing_content')
      .select('*')
      .order('section', { ascending: true })
      .order('key', { ascending: true });

    if (error) throw error;

    const grouped = {};
    for (const row of data) {
      if (!grouped[row.section]) grouped[row.section] = {};
      grouped[row.section][row.key] = row.value;
    }

    res.json({ content: data, grouped });
  } catch (err) {
    console.error('Error fetching content:', err);
    res.status(500).json({ error: 'Error al obtener contenido' });
  }
});

// PUT /api/admin/content - Update content items
router.put('/', async (req, res) => {
  try {
    const db = createAdminClient();
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Se requiere un array de items' });
    }

    const results = [];
    for (const item of items) {
      const { section, key, value } = item;
      if (!section || !key || value === undefined) continue;

      const { data, error } = await db
        .from('landing_content')
        .upsert(
          { section, key, value: String(value), updated_at: new Date().toISOString() },
          { onConflict: 'section,key' }
        )
        .select()
        .single();

      if (error) throw error;
      results.push(data);
    }

    res.json({ updated: results.length, items: results });
  } catch (err) {
    console.error('Error updating content:', err);
    res.status(500).json({ error: 'Error al actualizar contenido' });
  }
});

// GET /api/admin/services - Get all services
router.get('/services', async (req, res) => {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from('services')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
});

// PUT /api/admin/services/:slug - Update a service
router.put('/services/:slug', async (req, res) => {
  try {
    const db = createAdminClient();
    const { slug } = req.params;
    const { title, subtitle, description, features, icon, active, sort_order } = req.body;

    const updateData = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (description !== undefined) updateData.description = description;
    if (features !== undefined) updateData.features = JSON.stringify(features);
    if (icon !== undefined) updateData.icon = icon;
    if (active !== undefined) updateData.active = active;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    const { data, error } = await db
      .from('services')
      .update(updateData)
      .eq('slug', slug)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error updating service:', err);
    res.status(500).json({ error: 'Error al actualizar servicio' });
  }
});

// POST /api/admin/services - Create a service
router.post('/services', async (req, res) => {
  try {
    const db = createAdminClient();
    const { slug, title, subtitle, description, features, icon, active, sort_order } = req.body;

    if (!slug || !title || !icon) {
      return res.status(400).json({ error: 'slug, title e icon son requeridos' });
    }

    const { data, error } = await db
      .from('services')
      .insert({
        slug,
        title,
        subtitle: subtitle || '',
        description: description || '',
        features: JSON.stringify(features || []),
        icon,
        active: active !== undefined ? active : true,
        sort_order: sort_order || 0,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Error creating service:', err);
    res.status(500).json({ error: 'Error al crear servicio' });
  }
});

// DELETE /api/admin/services/:slug - Delete a service
router.delete('/services/:slug', async (req, res) => {
  try {
    const db = createAdminClient();
    const { error } = await db
      .from('services')
      .delete()
      .eq('slug', req.params.slug);

    if (error) throw error;
    res.json({ message: 'Servicio eliminado' });
  } catch (err) {
    console.error('Error deleting service:', err);
    res.status(500).json({ error: 'Error al eliminar servicio' });
  }
});

export default router;
