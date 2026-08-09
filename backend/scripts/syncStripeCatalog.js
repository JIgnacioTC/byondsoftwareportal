import 'dotenv/config';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('Missing STRIPE_SECRET_KEY in environment variables.');
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define the full catalog as specified
const catalog = [
  // TORREN Care - Sin desarrollo
  {
    name: 'TORREN Care — Host',
    lookup_key: 'torren_care_host_monthly',
    billingType: 'monthly',
    planFamily: 'care',
    price: 490,
    devHoursMonthly: 0,
    features: ['Hosting administrado', 'Despliegue automático en Vercel', 'SSL y CDN', 'Soporte de deployment'],
    description: 'Hosting administrado para sitios web, landing pages y aplicaciones.',
  },
  {
    name: 'TORREN Care — Care',
    lookup_key: 'torren_care_standard_monthly',
    billingType: 'monthly',
    planFamily: 'care',
    price: 990,
    devHoursMonthly: 0,
    features: ['Todo lo incluido en Host', 'Supervisión mensual', 'Hasta 2 intervenciones al mes', 'Gestión de dominios'],
    description: 'Operación y soporte administrado con mayor seguimiento técnico.',
  },
  {
    name: 'TORREN Care — Business',
    lookup_key: 'torren_care_business_monthly',
    billingType: 'monthly',
    planFamily: 'care',
    price: 1990,
    devHoursMonthly: 0,
    features: ['Monitoreo prioritario', 'Revisión de seguridad', 'Gestión de respaldos', 'Respuesta < 4h hábiles'],
    description: 'Operación prioritaria para aplicaciones críticas del negocio.',
  },

  // TORREN Build - Desarrollo Standard
  {
    name: 'TORREN Build — Start',
    lookup_key: 'torren_build_start_monthly',
    billingType: 'monthly',
    planFamily: 'build',
    price: 4900,
    devHoursMonthly: 8,
    features: ['8 horas de ingeniería/mes', 'Desarrollo de software y QA', 'TORREN Host incluido', 'Reunión mensual'],
    description: 'Desarrollo profesional convencional con 8 horas mensuales.',
  },
  {
    name: 'TORREN Build — Growth',
    lookup_key: 'torren_build_growth_monthly',
    billingType: 'monthly',
    planFamily: 'build',
    price: 8900,
    devHoursMonthly: 16,
    features: ['16 horas de ingeniería/mes', 'Desarrollo y mantenimiento', 'Soporte prioritario', 'Todos los beneficios de Start'],
    description: 'Desarrollo profesional convencional con 16 horas mensuales.',
  },
  {
    name: 'TORREN Build — Scale',
    lookup_key: 'torren_build_scale_monthly',
    billingType: 'monthly',
    planFamily: 'build',
    price: 16500,
    devHoursMonthly: 32,
    features: ['32 horas de ingeniería/mes', 'Capacidad extendida', 'Atención preferencial', 'Todos los beneficios de Start'],
    description: 'Desarrollo profesional convencional con 32 horas mensuales.',
  },

  // TORREN Accelerated - Desarrollo acelerado con IA
  {
    name: 'TORREN Accelerated — Start',
    lookup_key: 'torren_accelerated_start_monthly',
    billingType: 'monthly',
    planFamily: 'accelerated',
    price: 6500,
    devHoursMonthly: 8,
    features: ['8 horas de ingeniería/mes', 'AI-assisted coding', 'Desarrollo acelerado', 'Menor time-to-market'],
    description: 'Ingeniería asistida por IA para mayor velocidad (8 horas).',
  },
  {
    name: 'TORREN Accelerated — Growth',
    lookup_key: 'torren_accelerated_growth_monthly',
    billingType: 'monthly',
    planFamily: 'accelerated',
    price: 11900,
    devHoursMonthly: 16,
    features: ['16 horas de ingeniería/mes', 'Desarrollo iterativo rápido', 'Generación asistida', 'Prioridad sobre Build'],
    description: 'Ingeniería asistida por IA para mayor velocidad (16 horas).',
  },
  {
    name: 'TORREN Accelerated — Scale',
    lookup_key: 'torren_accelerated_scale_monthly',
    billingType: 'monthly',
    planFamily: 'accelerated',
    price: 22000,
    devHoursMonthly: 32,
    features: ['32 horas de ingeniería/mes', 'Prioridad máxima', 'Desarrollo en paralelo', 'Testing automatizado'],
    description: 'Prioridad máxima e ingeniería acelerada por IA (32 horas).',
  },

  // Proyectos de desarrollo (One-time)
  {
    name: 'TORREN Launch — Standard',
    lookup_key: 'torren_launch_standard',
    billingType: 'one-time',
    planFamily: 'project',
    price: 7900,
    devHoursMonthly: 0,
    features: ['Landing page', 'Hasta 5 secciones', 'SEO básico', '1 mes de TORREN Host'],
    description: 'Landing page o sitio sencillo (Entrega 2-3 semanas). Precio base.',
  },
  {
    name: 'TORREN Launch — Accelerated',
    lookup_key: 'torren_launch_accelerated',
    billingType: 'one-time',
    planFamily: 'project',
    price: 10900,
    devHoursMonthly: 0,
    features: ['Landing page acelerada', 'Entrega 5-8 días', 'Desarrollo con IA', 'Todos los beneficios Standard'],
    description: 'Sitio sencillo entregado en tiempo récord con metodología Accelerated.',
  },
  {
    name: 'TORREN Business Web — Standard',
    lookup_key: 'torren_business_web_standard',
    billingType: 'one-time',
    planFamily: 'project',
    price: 17900,
    devHoursMonthly: 0,
    features: ['Sitio corporativo completo', 'CMS (cuando aplique)', 'Arquitectura escalable', 'Entrega 4-6 semanas'],
    description: 'Desarrollo web corporativo completo. Precio base.',
  },
  {
    name: 'TORREN Business Web — Accelerated',
    lookup_key: 'torren_business_web_accelerated',
    billingType: 'one-time',
    planFamily: 'project',
    price: 23900,
    devHoursMonthly: 0,
    features: ['Entrega en 2-3 semanas', 'Desarrollo con IA', 'Alta prioridad', 'Mismos beneficios Standard'],
    description: 'Desarrollo web corporativo en tiempo récord.',
  },
  {
    name: 'TORREN MVP — Standard',
    lookup_key: 'torren_mvp_standard',
    billingType: 'one-time',
    planFamily: 'project',
    price: 39900,
    devHoursMonthly: 0,
    features: ['Autenticación y usuarios', 'Base de datos', 'CRUD y Dashboard', 'Entrega 8-12 semanas'],
    description: 'Desarrollo de Producto Mínimo Viable (SaaS, CRM, Portales). Precio base.',
  },
  {
    name: 'TORREN MVP — Accelerated',
    lookup_key: 'torren_mvp_accelerated',
    billingType: 'one-time',
    planFamily: 'project',
    price: 49900,
    devHoursMonthly: 0,
    features: ['Entrega en 4-6 semanas', 'Generación acelerada', 'Arquitectura robusta', 'Mismos beneficios Standard'],
    description: 'Desarrollo de MVP acelerado con metodología asistida.',
  },

  // Proyectos Custom (Quote / Cotización - no public price)
  {
    name: 'TORREN Custom — Standard',
    lookup_key: 'torren_custom_standard',
    billingType: 'quote',
    planFamily: 'custom',
    price: 65000,
    devHoursMonthly: 0,
    features: ['Sistemas empresariales', 'Integraciones complejas', 'Arquitecturas especiales', 'Cotización a la medida'],
    description: 'Desarrollo personalizado de alta complejidad.',
  },
  {
    name: 'TORREN Custom — Accelerated',
    lookup_key: 'torren_custom_accelerated',
    billingType: 'quote',
    planFamily: 'custom',
    price: 85000,
    devHoursMonthly: 0,
    features: ['Máxima velocidad', 'Desarrollo paralelo AI', 'Alta complejidad', 'Cotización a la medida'],
    description: 'Sistemas empresariales complejos entregados en menor tiempo.',
  },

  // Add-ons
  {
    name: 'TORREN — Project Onboarding',
    lookup_key: 'torren_project_onboarding',
    billingType: 'one-time',
    planFamily: 'addon',
    price: 1490,
    devHoursMonthly: 0,
    features: ['Revisión inicial', 'Migración de proyecto', 'Configuración de entorno'],
    description: 'Onboarding y migración de proyectos externos a TORREN.',
  },
  {
    name: 'TORREN — Domain Management',
    lookup_key: 'torren_domain_management',
    billingType: 'one-time',
    planFamily: 'addon',
    price: 350,
    devHoursMonthly: 0,
    features: ['Configuración DNS', 'Vinculación de dominio', 'SSL inicial'],
    description: 'Gestión técnica y vinculación de dominios (no incluye costo del registro).',
  },
  {
    name: 'TORREN Build — Extra Hour',
    lookup_key: 'torren_build_extra_hour',
    billingType: 'one-time',
    planFamily: 'addon',
    price: 700,
    devHoursMonthly: 1,
    features: ['1 hora de desarrollo', 'Bajo demanda'],
    description: 'Hora adicional de desarrollo convencional.',
  },
  {
    name: 'TORREN Accelerated — Extra Hour',
    lookup_key: 'torren_accelerated_extra_hour',
    billingType: 'one-time',
    planFamily: 'addon',
    price: 900,
    devHoursMonthly: 1,
    features: ['1 hora de desarrollo IA', 'Prioridad acelerada'],
    description: 'Hora adicional de desarrollo acelerado con IA.',
  },
];

async function run() {
  console.log('🚀 Iniciando sincronización del catálogo Stripe de TORREN...');

  try {
    // Optional: Wipe existing plans from database to avoid conflicts (uncomment if desired)
    console.log('Borrando planes actuales en la base de datos (Supabase)...');
    await supabase.from('subscriptions').delete().neq('id', 0); // Need to clear dependencies first
    await supabase.from('plans').delete().neq('id', 0);
    
    for (let i = 0; i < catalog.length; i++) {
      const item = catalog[i];
      console.log(`\nProcesando: ${item.name}`);

      // 1. Search or create Product in Stripe
      let stripeProduct;
      const existingProducts = await stripe.products.search({
        query: `name:"${item.name}" AND active:"true"`,
        limit: 1,
      });

      if (existingProducts.data.length > 0) {
        stripeProduct = existingProducts.data[0];
        console.log(`  - Producto encontrado: ${stripeProduct.id}`);
        // Update product description and metadata
        await stripe.products.update(stripeProduct.id, {
          description: item.description,
          metadata: {
            brand: 'TORREN.dev',
            currency: 'MXN',
            catalog_version: '1.0',
            service_type: item.planFamily,
            billing_type: item.billingType,
          },
        });
      } else {
        stripeProduct = await stripe.products.create({
          name: item.name,
          description: item.description,
          metadata: {
            brand: 'TORREN.dev',
            currency: 'MXN',
            catalog_version: '1.0',
            service_type: item.planFamily,
            billing_type: item.billingType,
          },
        });
        console.log(`  - Producto creado: ${stripeProduct.id}`);
      }

      // 2. Search or create Price in Stripe
      let stripePriceId = null;
      
      // We don't create active public prices for "quote" types.
      if (item.billingType !== 'quote') {
        const existingPrices = await stripe.prices.list({
          product: stripeProduct.id,
          active: true,
          limit: 10,
        });

        // Find a matching price (same amount, currency, and recurring/one-time type)
        const expectedUnitAmount = Math.round(item.price * 100); // Stripe uses cents
        const expectedType = item.billingType === 'monthly' ? 'recurring' : 'one_time';
        
        let foundPrice = existingPrices.data.find(p => 
          p.unit_amount === expectedUnitAmount && 
          p.currency.toLowerCase() === 'mxn' && 
          p.type === expectedType &&
          (!p.recurring || p.recurring.interval === 'month')
        );

        if (foundPrice) {
          stripePriceId = foundPrice.id;
          console.log(`  - Precio existente: ${stripePriceId}`);
        } else {
          const priceParams = {
            product: stripeProduct.id,
            unit_amount: expectedUnitAmount,
            currency: 'mxn',
            lookup_key: item.lookup_key, // Only works if lookup_key isn't assigned to another active price
          };

          if (item.billingType === 'monthly') {
            priceParams.recurring = { interval: 'month' };
          }

          try {
            const newPrice = await stripe.prices.create(priceParams);
            stripePriceId = newPrice.id;
            console.log(`  - Precio creado: ${stripePriceId}`);
          } catch (priceErr) {
            if (priceErr.code === 'resource_already_exists') {
              console.warn(`  - Aviso: lookup_key "${item.lookup_key}" ya está en uso. Creando sin lookup_key...`);
              delete priceParams.lookup_key;
              const newPriceFallback = await stripe.prices.create(priceParams);
              stripePriceId = newPriceFallback.id;
              console.log(`  - Precio creado (sin lookup_key): ${stripePriceId}`);
            } else {
              throw priceErr;
            }
          }
        }
      } else {
        console.log(`  - No se crea Price fijo porque es tipo Quote/Cotización.`);
      }

      // 3. Save into Supabase Database
      const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      
      const planData = {
        name: item.name,
        slug: slug,
        base_price: item.price,
        billing_type: item.billingType,
        plan_family: item.planFamily,
        dev_hours_monthly: item.devHoursMonthly,
        features: item.features,
        stripe_product_id: stripeProduct.id,
        stripe_price_id: stripePriceId,
        active: true,
        sort_order: i + 1,
      };

      const { data: dbPlan, error: dbError } = await supabase
        .from('plans')
        .upsert(planData, { onConflict: 'slug' })
        .select()
        .single();

      if (dbError) {
        console.error(`  - Error guardando en BD:`, dbError.message);
      } else {
        console.log(`  - Guardado en BD con ID: ${dbPlan.id}`);
      }
    }

    console.log('\n✅ Sincronización finalizada exitosamente.');
  } catch (error) {
    console.error('❌ Error en el script de sincronización:', error);
  }
}

run();
