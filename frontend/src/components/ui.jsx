/**
 * TORREN internal UI kit.
 * Small, styleless-by-default primitives that map onto styles/internal.css.
 * Used by the admin console and the client portal so both read as one product.
 */
import { IconAlert, IconCheckCircle, IconInbox, IconInfo, IconX } from './Icons';

const cx = (...parts) => parts.filter(Boolean).join(' ');

/* -------------------------------------------------------------- Structure */

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="trn-page-head">
      <div>
        {eyebrow && <p className="trn-eyebrow">{eyebrow}</p>}
        <h1 className="trn-page-head__title">{title}</h1>
        {description && <p className="trn-page-head__desc">{description}</p>}
      </div>
      {actions && <div className="trn-page-head__actions">{actions}</div>}
    </header>
  );
}

export function Card({ title, subtitle, actions, children, flush, footer, className, style }) {
  return (
    <section className={cx('trn-card', className)} style={style}>
      {(title || actions) && (
        <div className="trn-card__head">
          <div>
            {title && <h2 className="trn-card__title">{title}</h2>}
            {subtitle && <p className="trn-card__sub">{subtitle}</p>}
          </div>
          {actions && <div className="trn-row">{actions}</div>}
        </div>
      )}
      <div className={cx('trn-card__body', flush && 'trn-card__body--flush')}>{children}</div>
      {footer && <div className="trn-card__foot">{footer}</div>}
    </section>
  );
}

export function Stat({ label, value, hint, icon, tone }) {
  return (
    <div className={cx('trn-stat', tone && `trn-stat--${tone}`)}>
      <span className="trn-stat__label">
        {icon}
        {label}
      </span>
      <span className="trn-stat__value">{value}</span>
      {hint && <span className="trn-stat__hint">{hint}</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ Atoms */

export function Button({ variant = 'secondary', size, block, as: As = 'button', className, children, ...rest }) {
  return (
    <As
      className={cx('trn-btn', `trn-btn--${variant}`, size === 'sm' && 'trn-btn--sm', block && 'trn-btn--block', className)}
      {...rest}
    >
      {children}
    </As>
  );
}

export function Badge({ tone = 'neutral', dot, children }) {
  return (
    <span className={`trn-badge trn-badge--${tone}`}>
      {dot && <span className="trn-badge__dot" />}
      {children}
    </span>
  );
}

export function Field({ label, optional, hint, error, htmlFor, children, className }) {
  return (
    <div className={cx('trn-field', className)}>
      {label && (
        <label className="trn-label" htmlFor={htmlFor}>
          {label} {optional && <span className="trn-label__opt">(opcional)</span>}
        </label>
      )}
      {children}
      {hint && !error && <span className="trn-hint">{hint}</span>}
      {error && <span className="trn-err">{error}</span>}
    </div>
  );
}

export const Input = (props) => <input className="trn-input" {...props} />;
export const Textarea = (props) => <textarea className="trn-textarea" {...props} />;

export function Select({ options = [], placeholder, children, ...rest }) {
  return (
    <select className="trn-select" {...rest}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
      {children}
    </select>
  );
}

export function Checkbox({ label, ...rest }) {
  return (
    <label className="trn-checkbox">
      <input type="checkbox" {...rest} />
      {label}
    </label>
  );
}

/* ----------------------------------------------------------------- States */

export function Loading({ label = 'Cargando…' }) {
  return (
    <div className="trn-loading" role="status">
      <span className="trn-spinner" aria-hidden="true" />
      {label}
    </div>
  );
}

export function EmptyState({ title, description, action, icon }) {
  return (
    <div className="trn-empty">
      <span className="trn-empty__icon" aria-hidden="true">{icon || <IconInbox size={20} />}</span>
      <p className="trn-empty__title">{title}</p>
      {description && <p className="trn-empty__desc">{description}</p>}
      {action && <div style={{ marginTop: 10 }}>{action}</div>}
    </div>
  );
}

const ALERT_ICON = {
  info: IconInfo,
  success: IconCheckCircle,
  warn: IconAlert,
  danger: IconAlert,
};

export function Alert({ tone = 'info', title, children, onClose }) {
  const Icon = ALERT_ICON[tone] || IconInfo;
  return (
    <div className={`trn-alert trn-alert--${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon size={17} color="currentColor" />
      <div className="trn-alert__body">
        {title && <div className="trn-alert__title">{title}</div>}
        {children}
      </div>
      {onClose && (
        <button type="button" className="trn-alert__close" onClick={onClose} aria-label="Cerrar aviso">
          <IconX size={15} color="currentColor" />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Table */

export function Table({ columns, children }) {
  return (
    <div className="trn-tablewrap">
      <table className="trn-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.align === 'right' ? 'num' : undefined} style={c.width ? { width: c.width } : undefined}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function TableEmpty({ colSpan, children = 'Sin resultados' }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: 0 }}>
        <div className="trn-empty">
          <span className="trn-empty__icon" aria-hidden="true"><IconInbox size={20} /></span>
          <p className="trn-empty__title">{children}</p>
        </div>
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------------ Modal */

export function Modal({ title, subtitle, onClose, children, footer, wide }) {
  return (
    <div className="trn-modal-scrim" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={cx('trn-modal', wide && 'trn-modal--wide')}>
        <div className="trn-modal__head">
          <div>
            <h2 className="trn-modal__title">{title}</h2>
            {subtitle && <p className="trn-modal__sub">{subtitle}</p>}
          </div>
          {onClose && (
            <button type="button" className="trn-btn trn-btn--ghost trn-btn--sm" onClick={onClose} aria-label="Cerrar">
              <IconX size={16} color="currentColor" />
            </button>
          )}
        </div>
        <div className="trn-modal__body">{children}</div>
        {footer && <div className="trn-modal__foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Definitions */

export function DefinitionList({ items }) {
  return (
    <dl className="trn-dl">
      {items.map((it) => (
        <div key={it.label} className="trn-dl__row">
          <dt className="trn-dl__k">{it.label}</dt>
          <dd className="trn-dl__v">{it.value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Meter({ value, max }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  const tone = pct >= 100 ? 'danger' : pct >= 80 ? 'warn' : null;
  return (
    <div className="trn-meter" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx('trn-meter__fill', tone && `trn-meter__fill--${tone}`)} style={{ width: `${pct}%` }} />
    </div>
  );
}
