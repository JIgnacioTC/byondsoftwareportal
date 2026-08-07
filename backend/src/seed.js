import 'dotenv/config';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';
import * as schema from './models/schema.js';

const { Pool } = pg;
const { clients, users, plans, subscriptions, tickets, ticketComments, timeEntries, hourLedger } = schema;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db = drizzle(pool, { schema });

async function createSupabaseUser(email, password, metadata = {}) {
  try {
    // Try to create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (error) {
      if (error.message.includes('already been registered')) {
        // User already exists, get their ID
        const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers();
        const existing = existingUsers.find(u => u.email === email);
        if (existing) {
          console.log(`  User ${email} already exists, using existing ID`);
          return existing;
        }
      }
      throw error;
    }

    console.log(`  Created Supabase user: ${email}`);
    return data.user;
  } catch (err) {
    console.error(`  Error creating user ${email}:`, err.message);
    throw err;
  }
}

async function seed() {
  console.log('🌱 Iniciando seed de la base de datos con Supabase Auth...');

  // === CLEAN EXISTING DATA ===
  console.log('🧹 Limpiando datos existentes...');
  await db.delete(hourLedger);
  await db.delete(ticketComments);
  await db.delete(timeEntries);
  await db.delete(tickets);
  await db.delete(subscriptions);
  await db.delete(users);
  await db.delete(plans);
  await db.delete(clients);

  // === PLANS ===
  console.log('📦 Creando planes...');
  const [starterPlan, growthPlan, enterprisePlan] = await db.insert(plans).values([
    {
      name: 'Starter',
      slug: 'starter',
      priceMonthly: '4500.00',
      devHoursMonthly: 10,
      features: JSON.stringify([
        '10 horas de desarrollo al mes',
        'Backups semanales',
        'Monitoreo básico',
        'SLA de respuesta en 24 horas',
        'Soporte por correo electrónico',
      ]),
      active: true,
      sortOrder: 1,
    },
    {
      name: 'Growth',
      slug: 'growth',
      priceMonthly: '9500.00',
      devHoursMonthly: 25,
      features: JSON.stringify([
        '25 horas de desarrollo al mes',
        'Backups diarios',
        'Monitoreo 24/7',
        'SLA de respuesta en 8 horas',
        'Soporte prioritario',
        'Reporte mensual de actividades',
      ]),
      active: true,
      sortOrder: 2,
    },
    {
      name: 'Enterprise',
      slug: 'enterprise',
      priceMonthly: '19500.00',
      devHoursMonthly: 60,
      features: JSON.stringify([
        '60 horas de desarrollo al mes',
        'Backups diarios con retención de 30 días',
        'Monitoreo 24/7 proactivo con alertas',
        'SLA de respuesta en 4 horas',
        'Soporte prioritario dedicado',
        'Reporte mensual detallado',
        'Reuniones de seguimiento mensuales',
      ]),
      active: true,
      sortOrder: 3,
    },
  ]).returning();

  // === USERS (admin + agent) ===
  console.log('👤 Creando usuarios del sistema...');
  
  const adminSupabaseUser = await createSupabaseUser('admin@torren.dev', 'admin123', { full_name: 'Administrador TORREN', role: 'admin' });
  const agentSupabaseUser = await createSupabaseUser('agente@torren.dev', 'agente123', { full_name: 'Carlos Mendoza', role: 'agent' });

  const [adminUser, agentUser] = await db.insert(users).values([
    {
      supabaseUid: adminSupabaseUser.id,
      email: 'admin@torren.dev',
      fullName: 'Administrador TORREN',
      role: 'admin',
      clientId: null,
      active: true,
    },
    {
      supabaseUid: agentSupabaseUser.id,
      email: 'agente@torren.dev',
      fullName: 'Carlos Mendoza',
      role: 'agent',
      clientId: null,
      active: true,
    },
  ]).returning();

  // === CLIENTS ===
  console.log('🏢 Creando clientes demo...');
  const [client1, client2] = await db.insert(clients).values([
    {
      clientNumber: 'TRN-0001',
      companyName: 'TechCorp Solutions',
      contactName: 'Juan Pérez García',
      status: 'activo',
    },
    {
      clientNumber: 'TRN-0002',
      companyName: 'Innovación Digital SA',
      contactName: 'María López Hernández',
      status: 'activo',
    },
  ]).returning();

  // === CLIENT USERS ===
  console.log('👥 Creando usuarios cliente...');
  
  const client1SupabaseUser = await createSupabaseUser('juan@techcorp.com', 'cliente123', { full_name: 'Juan Pérez García', role: 'client_user' });
  const client2SupabaseUser = await createSupabaseUser('maria@innovacion.com', 'cliente123', { full_name: 'María López Hernández', role: 'client_user' });

  const [clientUser1, clientUser2] = await db.insert(users).values([
    {
      supabaseUid: client1SupabaseUser.id,
      email: 'juan@techcorp.com',
      fullName: 'Juan Pérez García',
      role: 'client_user',
      clientId: client1.id,
      active: true,
    },
    {
      supabaseUid: client2SupabaseUser.id,
      email: 'maria@innovacion.com',
      fullName: 'María López Hernández',
      role: 'client_user',
      clientId: client2.id,
      active: true,
    },
  ]).returning();

  // === SUBSCRIPTIONS ===
  console.log('📋 Creando suscripciones...');
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  await db.insert(subscriptions).values([
    {
      clientId: client1.id,
      planId: growthPlan.id,
      status: 'activa',
      startDate: new Date(2024, 0, 15),
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    },
    {
      clientId: client2.id,
      planId: enterprisePlan.id,
      status: 'activa',
      startDate: new Date(2024, 2, 1),
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    },
  ]);

  // === TICKETS ===
  console.log('🎫 Creando tickets demo...');
  const [ticket1, ticket2, ticket3, ticket4, ticket5] = await db.insert(tickets).values([
    {
      folio: 'TRN-0001-TKT-0001',
      clientId: client1.id,
      createdBy: clientUser1.id,
      type: 'soporte',
      priority: 'alta',
      status: 'en_progreso',
      title: 'Error en módulo de facturación',
      description: 'Al generar facturas con IVA, el cálculo del impuesto no se aplica correctamente. El total muestra un valor inferior al esperado.',
      assignedTo: agentUser.id,
    },
    {
      folio: 'TRN-0001-TKT-0002',
      clientId: client1.id,
      createdBy: clientUser1.id,
      type: 'nuevo_desarrollo',
      priority: 'media',
      status: 'nuevo',
      title: 'Integración con pasarela de pagos',
      description: 'Necesitamos integrar la plataforma con Stripe para procesar pagos con tarjeta de crédito.\n\nObjetivo: Permitir pagos en línea desde el portal de clientes.\nAlcance deseado: Checkout embebido, webhooks para confirmación, registro de transacciones.',
    },
    {
      folio: 'TRN-0001-TKT-0003',
      clientId: client1.id,
      createdBy: clientUser1.id,
      type: 'bug',
      priority: 'critica',
      status: 'resuelto',
      title: 'App móvil se cierra al abrir notificaciones',
      description: 'La aplicación móvil se cierra inesperadamente cuando el usuario toca una notificación push. Afecta a iOS y Android.',
      assignedTo: agentUser.id,
      resolvedAt: new Date(2024, 10, 20),
    },
    {
      folio: 'TRN-0002-TKT-0001',
      clientId: client2.id,
      createdBy: clientUser2.id,
      type: 'actualizacion',
      priority: 'media',
      status: 'en_analisis',
      title: 'Actualizar diseño del dashboard',
      description: 'Queremos modernizar el diseño del dashboard principal con gráficas más claras y métricas en tiempo real.\n\nObjetivo: Mejorar la experiencia de usuario del panel principal.\nAlcance deseado: Nuevos gráficos, widgets personalizables, tema oscuro.',
      assignedTo: agentUser.id,
    },
    {
      folio: 'TRN-0002-TKT-0002',
      clientId: client2.id,
      createdBy: clientUser2.id,
      type: 'soporte',
      priority: 'baja',
      status: 'cerrado',
      title: 'Solicitud de acceso para nuevo usuario',
      description: 'Necesitamos crear una cuenta para nuestro nuevo colaborador Roberto Díaz con acceso de solo lectura.',
      assignedTo: agentUser.id,
      resolvedAt: new Date(2024, 10, 18),
    },
  ]).returning();

  // === TICKET COMMENTS ===
  console.log('💬 Creando comentarios...');
  await db.insert(ticketComments).values([
    {
      ticketId: ticket1.id,
      userId: agentUser.id,
      body: 'Estoy revisando el módulo de facturación. He identificado el problema en la función de cálculo de IVA.',
      isInternal: false,
    },
    {
      ticketId: ticket1.id,
      userId: agentUser.id,
      body: 'NOTA INTERNA: El bug está en el archivo billing.js línea 145. El porcentaje de IVA se aplica sobre el subtotal antes de descuentos.',
      isInternal: true,
    },
    {
      ticketId: ticket1.id,
      userId: agentUser.id,
      body: 'Ya tengo una corrección lista. Voy a desplegarla en el ambiente de staging para pruebas.',
      isInternal: false,
    },
    {
      ticketId: ticket3.id,
      userId: agentUser.id,
      body: 'Se corrigió el manejo de notificaciones push. La actualización ya está disponible en las tiendas.',
      isInternal: false,
    },
    {
      ticketId: ticket4.id,
      userId: agentUser.id,
      body: 'He revisado los requerimientos. Voy a preparar un mockup del nuevo diseño para su aprobación.',
      isInternal: false,
    },
  ]);

  // === TIME ENTRIES ===
  console.log('⏱️  Creando registros de tiempo...');
  const [te1, te2, te3] = await db.insert(timeEntries).values([
    {
      ticketId: ticket1.id,
      agentId: agentUser.id,
      hours: '3.50',
      workDate: new Date(2024, 10, 18),
      notes: 'Análisis del bug de facturación y corrección del cálculo de IVA.',
      billable: true,
    },
    {
      ticketId: ticket1.id,
      agentId: agentUser.id,
      hours: '2.00',
      workDate: new Date(2024, 10, 19),
      notes: 'Pruebas de la corrección en staging y despliegue a producción.',
      billable: true,
    },
    {
      ticketId: ticket3.id,
      agentId: agentUser.id,
      hours: '4.00',
      workDate: new Date(2024, 10, 20),
      notes: 'Corrección del crash en notificaciones push, pruebas en iOS y Android.',
      billable: true,
    },
    {
      ticketId: ticket4.id,
      agentId: agentUser.id,
      hours: '2.50',
      workDate: new Date(2024, 10, 21),
      notes: 'Análisis de requerimientos y diseño de mockups para el dashboard.',
      billable: true,
    },
  ]).returning();

  // === HOUR LEDGER ===
  console.log('📊 Creando registros de horas...');
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  await db.insert(hourLedger).values([
    // Allocations for current period
    {
      clientId: client1.id,
      type: 'allocation',
      hours: '25.00',
      description: 'Asignación mensual plan Growth - ' + currentPeriod,
      period: currentPeriod,
      createdBy: adminUser.id,
    },
    {
      clientId: client2.id,
      type: 'allocation',
      hours: '60.00',
      description: 'Asignación mensual plan Enterprise - ' + currentPeriod,
      period: currentPeriod,
      createdBy: adminUser.id,
    },
    // Consumptions linked to time entries
    {
      clientId: client1.id,
      type: 'consumption',
      hours: '-3.50',
      ticketId: ticket1.id,
      timeEntryId: te1.id,
      description: 'Análisis y corrección bug facturación',
      period: currentPeriod,
      createdBy: agentUser.id,
    },
    {
      clientId: client1.id,
      type: 'consumption',
      hours: '-2.00',
      ticketId: ticket1.id,
      timeEntryId: te2.id,
      description: 'Pruebas y despliegue corrección facturación',
      period: currentPeriod,
      createdBy: agentUser.id,
    },
    {
      clientId: client1.id,
      type: 'consumption',
      hours: '-4.00',
      ticketId: ticket3.id,
      timeEntryId: te3.id,
      description: 'Corrección crash notificaciones push',
      period: currentPeriod,
      createdBy: agentUser.id,
    },
    // Consumption for client 2
    {
      clientId: client2.id,
      type: 'consumption',
      hours: '-2.50',
      ticketId: ticket4.id,
      description: 'Análisis y mockups dashboard',
      period: currentPeriod,
      createdBy: agentUser.id,
    },
    // Manual adjustment example
    {
      clientId: client2.id,
      type: 'adjustment',
      hours: '5.00',
      description: 'Ajuste por horas no registradas en sprint anterior (reunión del 15/10)',
      period: currentPeriod,
      createdBy: adminUser.id,
    },
  ]);

  console.log('\n✅ Seed completado exitosamente!\n');
  console.log('📧 Credenciales de acceso (Supabase Auth):');
  console.log('─'.repeat(50));
  console.log('Admin:    admin@torren.dev / admin123');
  console.log('Agente:   agente@torren.dev / agente123');
  console.log('Cliente1: juan@techcorp.com / cliente123');
  console.log('Cliente2: maria@innovacion.com / cliente123');
  console.log('─'.repeat(50));
  console.log('\n⚠️  Los usuarios se crearon en Supabase Auth.');
  console.log('   Puedes verificar en el dashboard de Supabase → Authentication → Users');

  await pool.end();
}

seed().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
