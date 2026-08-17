import { Router } from 'express';
import { createAdminClient } from '../config/supabase.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

// All routes require admin role
router.use(requireRole('admin'));

const ALLOWED_IMAGE_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB decoded

// GET /api/admin/products - Get all products (including inactive)
router.get('/', async (req, res) => {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Error fetching admin products:', err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// POST /api/admin/products/upload-image - Upload a product image, returns its public URL
// Body: { imageBase64: 'data:image/png;base64,...', filename?: string }
// Decoupled from create/update so the editor can preview the uploaded image
// before saving the product record.
router.post('/upload-image', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'Se requiere imageBase64' });
    }

    const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: 'Formato de imagen inválido (se espera un data URL en base64)' });
    }

    const [, mimeType, base64Data] = match;
    const ext = ALLOWED_IMAGE_TYPES[mimeType];
    if (!ext) {
      return res.status(400).json({ error: 'Tipo de imagen no soportado. Usa PNG, JPG o WEBP.' });
    }

    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length > MAX_IMAGE_BYTES) {
      return res.status(400).json({ error: 'La imagen es demasiado grande (máximo 5MB).' });
    }

    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const db = createAdminClient();
    const { error: uploadError } = await db.storage
      .from('product-images')
      .upload(path, buffer, { contentType: mimeType, upsert: false });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = db.storage.from('product-images').getPublicUrl(path);

    res.status(201).json({ url: publicUrlData.publicUrl, path });
  } catch (err) {
    console.error('Error uploading product image:', err);
    res.status(500).json({ error: 'Error al subir la imagen' });
  }
});

// POST /api/admin/products - Create a product
router.post('/', async (req, res) => {
  try {
    const db = createAdminClient();
    const {
      slug, name, tagline, description, icon, image_url,
      monthly_price, features, demo_url, active, sort_order,
    } = req.body;

    if (!slug || !name || monthly_price === undefined || monthly_price === null) {
      return res.status(400).json({ error: 'slug, name y monthly_price son requeridos' });
    }

    const { data, error } = await db
      .from('products')
      .insert({
        slug,
        name,
        tagline: tagline || '',
        description: description || '',
        icon: icon || 'box',
        image_url: image_url || null,
        monthly_price,
        features: JSON.stringify(features || []),
        demo_url: demo_url || null,
        active: active !== undefined ? active : true,
        sort_order: sort_order || 0,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// PUT /api/admin/products/:id - Update a product
router.put('/:id', async (req, res) => {
  try {
    const db = createAdminClient();
    const {
      name, tagline, description, icon, image_url,
      monthly_price, features, demo_url, active, sort_order,
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (tagline !== undefined) updateData.tagline = tagline;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (monthly_price !== undefined) updateData.monthly_price = monthly_price;
    if (features !== undefined) updateData.features = JSON.stringify(features);
    if (demo_url !== undefined) updateData.demo_url = demo_url;
    if (active !== undefined) updateData.active = active;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    const { data, error } = await db
      .from('products')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// DELETE /api/admin/products/:id - Delete a product
router.delete('/:id', async (req, res) => {
  try {
    const db = createAdminClient();
    const { error } = await db
      .from('products')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

export default router;
