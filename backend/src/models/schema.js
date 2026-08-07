import {
  pgTable, serial, varchar, text, integer, decimal, boolean,
  timestamp, json, uuid, pgEnum, uniqueIndex
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// === ENUMS ===
export const clientStatusEnum = pgEnum('client_status', ['prospecto', 'activo', 'suspendido', 'baja']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'agent', 'client_user']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['solicitada', 'activa', 'pausada', 'cancelada']);
export const ledgerTypeEnum = pgEnum('ledger_type', ['allocation', 'consumption', 'adjustment', 'rollover']);
export const ticketTypeEnum = pgEnum('ticket_type', ['soporte', 'bug', 'nuevo_desarrollo', 'actualizacion']);
export const ticketPriorityEnum = pgEnum('ticket_priority', ['baja', 'media', 'alta', 'critica']);
export const ticketStatusEnum = pgEnum('ticket_status', ['nuevo', 'en_analisis', 'en_progreso', 'esperando_cliente', 'resuelto', 'cerrado']);

// === TABLES ===

export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  clientNumber: varchar('client_number', { length: 20 }).unique().notNull(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  contactName: varchar('contact_name', { length: 255 }).notNull(),
  status: clientStatusEnum('status').notNull().default('prospecto'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  supabaseUid: uuid('supabase_uid').unique().notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull().default('client_user'),
  clientId: integer('client_id').references(() => clients.id),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const plans = pgTable('plans', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  priceMonthly: decimal('price_monthly', { precision: 10, scale: 2 }).notNull(),
  devHoursMonthly: integer('dev_hours_monthly').notNull(),
  features: json('features').notNull().default([]),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').notNull().references(() => clients.id),
  planId: integer('plan_id').notNull().references(() => plans.id),
  status: subscriptionStatusEnum('status').notNull().default('solicitada'),
  startDate: timestamp('start_date'),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const hourLedger = pgTable('hour_ledger', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').notNull().references(() => clients.id),
  type: ledgerTypeEnum('type').notNull(),
  hours: decimal('hours', { precision: 10, scale: 2 }).notNull(),
  ticketId: integer('ticket_id').references(() => tickets.id),
  timeEntryId: integer('time_entry_id').references(() => timeEntries.id),
  description: text('description'),
  period: varchar('period', { length: 7 }).notNull(), // YYYY-MM
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
  folio: varchar('folio', { length: 30 }).unique().notNull(),
  clientId: integer('client_id').notNull().references(() => clients.id),
  createdBy: integer('created_by').notNull().references(() => users.id),
  type: ticketTypeEnum('type').notNull(),
  priority: ticketPriorityEnum('priority').notNull().default('media'),
  status: ticketStatusEnum('status').notNull().default('nuevo'),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  assignedTo: integer('assigned_to').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at'),
});

export const ticketComments = pgTable('ticket_comments', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').notNull().references(() => tickets.id),
  userId: integer('user_id').notNull().references(() => users.id),
  body: text('body').notNull(),
  isInternal: boolean('is_internal').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const timeEntries = pgTable('time_entries', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').notNull().references(() => tickets.id),
  agentId: integer('agent_id').notNull().references(() => users.id),
  hours: decimal('hours', { precision: 10, scale: 2 }).notNull(),
  workDate: timestamp('work_date').notNull(),
  notes: text('notes'),
  billable: boolean('billable').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// === RELATIONS ===

export const clientsRelations = relations(clients, ({ many }) => ({
  users: many(users),
  subscriptions: many(subscriptions),
  tickets: many(tickets),
  hourLedger: many(hourLedger),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  client: one(clients, { fields: [users.clientId], references: [clients.id] }),
  createdTickets: many(tickets, { relationName: 'createdBy' }),
  assignedTickets: many(tickets, { relationName: 'assignedTo' }),
  comments: many(ticketComments),
  timeEntries: many(timeEntries),
}));

export const plansRelations = relations(plans, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  client: one(clients, { fields: [subscriptions.clientId], references: [clients.id] }),
  plan: one(plans, { fields: [subscriptions.planId], references: [plans.id] }),
}));

export const hourLedgerRelations = relations(hourLedger, ({ one }) => ({
  client: one(clients, { fields: [hourLedger.clientId], references: [clients.id] }),
  ticket: one(tickets, { fields: [hourLedger.ticketId], references: [tickets.id] }),
  timeEntry: one(timeEntries, { fields: [hourLedger.timeEntryId], references: [timeEntries.id] }),
  createdByUser: one(users, { fields: [hourLedger.createdBy], references: [users.id] }),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  client: one(clients, { fields: [tickets.clientId], references: [clients.id] }),
  creator: one(users, { fields: [tickets.createdBy], references: [users.id], relationName: 'createdBy' }),
  assignee: one(users, { fields: [tickets.assignedTo], references: [users.id], relationName: 'assignedTo' }),
  comments: many(ticketComments),
  timeEntries: many(timeEntries),
  hourLedger: many(hourLedger),
}));

export const ticketCommentsRelations = relations(ticketComments, ({ one }) => ({
  ticket: one(tickets, { fields: [ticketComments.ticketId], references: [tickets.id] }),
  user: one(users, { fields: [ticketComments.userId], references: [users.id] }),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  ticket: one(tickets, { fields: [timeEntries.ticketId], references: [tickets.id] }),
  agent: one(users, { fields: [timeEntries.agentId], references: [users.id] }),
}));
