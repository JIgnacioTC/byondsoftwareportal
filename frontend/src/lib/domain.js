/**
 * Single source of truth for enum labels/tones and value formatting.
 * Every enum here mirrors backend/src/models/schema.js — do not invent values.
 */

/* ------------------------------------------------------------------ Enums */

export const TICKET_STATUS = {
  nuevo: { label: 'Nuevo', tone: 'info' },
  en_analisis: { label: 'En análisis', tone: 'warn' },
  en_progreso: { label: 'En progreso', tone: 'orange' },
  esperando_cliente: { label: 'Esperando cliente', tone: 'purple' },
  resuelto: { label: 'Resuelto', tone: 'success' },
  cerrado: { label: 'Cerrado', tone: 'neutral' },
};

export const TICKET_PRIORITY = {
  baja: { label: 'Baja', tone: 'neutral' },
  media: { label: 'Media', tone: 'info' },
  alta: { label: 'Alta', tone: 'orange' },
  critica: { label: 'Crítica', tone: 'danger' },
};

export const TICKET_TYPE = {
  soporte: { label: 'Soporte', tone: 'info' },
  bug: { label: 'Bug', tone: 'danger' },
  nuevo_desarrollo: { label: 'Nuevo desarrollo', tone: 'success' },
  actualizacion: { label: 'Actualización', tone: 'purple' },
};

export const CLIENT_STATUS = {
  prospecto: { label: 'Prospecto', tone: 'info' },
  activo: { label: 'Activo', tone: 'success' },
  suspendido: { label: 'Suspendido', tone: 'warn' },
  baja: { label: 'Baja', tone: 'neutral' },
};

export const SUBSCRIPTION_STATUS = {
  solicitada: { label: 'Solicitada', tone: 'warn' },
  activa: { label: 'Activa', tone: 'success' },
  pausada: { label: 'Pausada', tone: 'neutral' },
  cancelada: { label: 'Cancelada', tone: 'danger' },
};

export const LEDGER_TYPE = {
  allocation: { label: 'Asignación', tone: 'success' },
  consumption: { label: 'Consumo', tone: 'danger' },
  adjustment: { label: 'Ajuste', tone: 'purple' },
  rollover: { label: 'Acumulado', tone: 'info' },
};

export const USER_ROLE = {
  admin: { label: 'Administrador', tone: 'purple' },
  agent: { label: 'Agente', tone: 'info' },
  client_user: { label: 'Cliente', tone: 'success' },
};

export const BILLING_TYPE = {
  monthly: { label: 'Mensual', tone: 'info' },
  'one-time': { label: 'Pago único', tone: 'purple' },
  quote: { label: 'Cotización', tone: 'neutral' },
};

/** Build <Select> options from one of the maps above. */
export const optionsOf = (map) => Object.entries(map).map(([value, { label }]) => ({ value, label }));

/** Safe lookup: unknown values render as themselves rather than blank. */
export const describe = (map, value) => map[value] || { label: value || '—', tone: 'neutral' };

/* ------------------------------------------------------------- Formatting */

const dateFmt = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
const dateFmtUTC = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
const dateTimeFmt = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Calendar dates (start_date, work_date, period bounds) are stored as midnight
 * UTC. Rendering those in a negative-offset zone shows the previous day, so
 * treat an exact UTC midnight as a date and format it in UTC.
 */
export function formatDate(value, fallback = '—') {
  const d = toDate(value);
  if (!d) return fallback;
  const isCalendarDate = d.getUTCHours() === 0 && d.getUTCMinutes() === 0
    && d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0;
  return (isCalendarDate ? dateFmtUTC : dateFmt).format(d);
}

export function formatDateTime(value, fallback = '—') {
  const d = toDate(value);
  return d ? dateTimeFmt.format(d) : fallback;
}

export function formatMoney(value, { currency = 'MXN', fallback = '—' } = {}) {
  const n = Number(value);
  if (value === null || value === undefined || Number.isNaN(n)) return fallback;
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
}

export function formatHours(value, { signed = false, fallback = '—' } = {}) {
  const n = Number(value);
  if (value === null || value === undefined || Number.isNaN(n)) return fallback;
  const sign = signed && n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)} h`;
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

/** "2026-08" -> "Agosto 2026" */
export function formatPeriod(period, fallback = '—') {
  if (!period || !/^\d{4}-\d{2}$/.test(period)) return period || fallback;
  const [year, month] = period.split('-');
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

export function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function initials(name, fallback = 'U') {
  if (!name) return fallback;
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || fallback;
}

/** Plan `features` arrives as a JSON array, a JSON string, or nothing. */
export function parseFeatures(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}
