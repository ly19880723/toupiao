'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

// ===== Notification System =====
export const Notification = {
  _listeners: new Set<(toast: any, action: string) => void>(),
  _notify(config: string | { message: string; description?: string; type?: string; duration?: number }) {
    const cfg = typeof config === 'string' ? { message: config } : config;
    const id = Date.now() + Math.random();
    const type = (cfg as any).type || 'info';
    const duration = (cfg as any).duration !== undefined ? (cfg as any).duration : 4.5;
    const toast = { id, ...cfg, type };
    this._listeners.forEach(fn => fn(toast, 'add'));
    if (duration > 0) {
      setTimeout(() => {
        this._listeners.forEach(fn => fn(toast, 'remove'));
      }, duration * 1000);
    }
    return id;
  },
  success(c: any) { return this._notify({ ...(typeof c === 'string' ? { message: c } : c), type: 'success' }); },
  info(c: any) { return this._notify({ ...(typeof c === 'string' ? { message: c } : c), type: 'info' }); },
  warning(c: any) { return this._notify({ ...(typeof c === 'string' ? { message: c } : c), type: 'warning' }); },
  error(c: any) { return this._notify({ ...(typeof c === 'string' ? { message: c } : c), type: 'error' }); },
  destroy() { this._listeners.forEach(fn => fn(null as any, 'clear')); },
  _subscribe(fn: (toast: any, action: string) => void): () => void {
    this._listeners.add(fn);
    return () => { this._listeners.delete(fn); };
  },
};

export function NotificationContainer() {
  const [toasts, setToasts] = useState<any[]>([]);
  useEffect(() => {
    const handler = (toast: any, action: string) => {
      if (action === 'clear') { setToasts([]); return; }
      if (action === 'add') {
        setToasts(prev => [...prev, toast]);
      } else {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }
    };
    return Notification._subscribe(handler);
  }, []);
  const closeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  const iconMap: Record<string, string> = { success: '\u2713', info: 'i', warning: '!', error: '\u00d7' };
  return (
    <div className="notif-container">
      {toasts.map(t => (
        <div key={t.id} className="notif-toast">
          <div className={`notif-icon ${t.type}`}>{iconMap[t.type] || 'i'}</div>
          <div className="notif-content">
            <div className="notif-message">{t.message}</div>
            {t.description && <div className="notif-desc">{t.description}</div>}
          </div>
          <button className="notif-close" onClick={() => closeToast(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

// ===== Icon =====
export function Icon({ name, size = 24, color = 'currentColor', strokeWidth = 2 }: { name: string; size?: number; color?: string; strokeWidth?: number }) {
  const paths: Record<string, string> = {
    gift: 'M20 12v10H4V12M22 7H2v5h20V7M12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z',
    star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
    plane: 'M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3-4-1-1 1 4 3 3 4 1-1-1-4 3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.2.6-.6.5-1.1z',
    home: 'M3 9.5 12 2l9 7.5V20a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2V9.5z',
    coffee: 'M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z M6 1v3M10 1v3M14 1v3',
    cart: 'M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM17 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM3 4h2l2.5 12.5a2 2 0 0 0 2 1.5h7a2 2 0 0 0 2-1.5L21 7H6',
    music: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
    camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2v11zM12 17a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z',
    trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 4H4v3a3 3 0 0 0 3 3M17 4h3v3a3 3 0 0 1-3 3',
    close: 'M18 6 6 18M6 6l12 12',
    check: 'M20 6 9 17l-5-5',
    chevronDown: 'M6 9l6 6 6-6',
  };
  const d = paths[name] || paths.star;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d={d} />
    </svg>
  );
}

// ===== Footer =====
export function Footer() {
  const icons = ['gift', 'star', 'heart', 'plane', 'home', 'coffee', 'cart', 'music', 'camera', 'trophy'];
  return (
    <div className="footer-chain">
      {Array.from({ length: 24 }, (_, i) => {
        const name = icons[i % icons.length];
        return <div key={i} className="footer-icon">
          <Icon name={name} size={24} color="var(--animal-text-secondary)" strokeWidth={1.5} />
        </div>;
      })}
    </div>
  );
}

// ===== Button =====
export function Button({ type = 'default', size = 'middle', danger, block, loading, disabled, onClick, children, htmlType }: any) {
  const cls = ['btn', `btn-${type}`];
  if (block) cls.push('btn-block');
  if (loading) cls.push('btn-loading');
  if (danger && type === 'primary') cls.push('btn-danger');
  const handleClick = (e: any) => {
    if (loading || disabled) return;
    if (onClick) onClick(e);
  };
  return (
    <button className={cls.join(' ')} disabled={disabled || loading}
      onClick={handleClick} type={htmlType || 'button'}>
      {children}
    </button>
  );
}

// ===== Input =====
export function Input({ value = '', onChange, placeholder, allowClear, status, disabled, style }: any) {
  const [showClear, setShowClear] = useState(false);
  useEffect(() => { setShowClear(allowClear && value.length > 0); }, [value, allowClear]);
  const cls = ['input-wrap'];
  if (status === 'error') cls.push('error');
  return (
    <div className={cls.join(' ')} style={style}>
      <input className="input-elem" type="text" value={value}
        placeholder={placeholder} disabled={disabled}
        onChange={e => onChange && onChange(e)} />
      {showClear && !disabled && (
        <button className="input-clear" onClick={() => { if (onChange) onChange({ target: { value: '' } }); }}>
          <Icon name="close" size={14} color="currentColor" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

// ===== Select =====
export function Select({ value, onChange, options, disabled }: any) {
  return (
    <div className="select-wrap">
      <select className="select-elem" value={value} disabled={disabled}
        onChange={e => onChange && onChange(e.target.value)}>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <span className="select-arrow"><Icon name="chevronDown" size={14} color="var(--animal-text-secondary)" /></span>
    </div>
  );
}

// ===== Modal =====
export function Modal({ open, title, onClose, onOk, children, footer, typewriter = false, typeSpeed = 80, okText }: any) {
  const [displayed, setDisplayed] = useState('');
  const [show, setShow] = useState(false);
  const bodyText = typeof children === 'string' ? children : '';

  useEffect(() => {
    if (open) {
      setShow(true);
      if (typewriter && bodyText) {
        setDisplayed('');
        let i = 0;
        const timer = setInterval(() => {
          if (i < bodyText.length) {
            setDisplayed(bodyText.slice(0, i + 1));
            i++;
          } else {
            clearInterval(timer);
          }
        }, typeSpeed);
        return () => clearInterval(timer);
      } else {
        setDisplayed(bodyText);
      }
    } else {
      setShow(false);
    }
  }, [open, typewriter, typeSpeed, bodyText]);

  if (!show) return null;

  const handleMask = (e: any) => { if (e.target === e.currentTarget) { if (onClose) onClose(); } };
  const defaultFooter = (
    <>
      <Button type="default" onClick={onClose}>再看看</Button>
      <Button type="primary" onClick={() => { if (onOk) onOk(); }}>{okText || '确定'}</Button>
    </>
  );

  return (
    <div className="modal-mask" onClick={handleMask}>
      <div className="modal-container">
        <div className="modal-content">
          <button className="modal-close" onClick={onClose}><Icon name="close" size={18} /></button>
          {title && <div className="modal-title">{title}</div>}
          <div className="modal-body">
            {typewriter ? displayed : children}
          </div>
          <div className="modal-footer">
            {footer !== null ? (footer || defaultFooter) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Progress =====
export function Progress({ percent, size = 'middle', showInfo = true, infoPosition = 'inside' }: any) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent || 0)));
  const sizes: Record<string, number> = { small: 12, middle: 20, large: 28 };
  const h = sizes[size] || 20;
  const label = clamped + '%';
  const showOutside = infoPosition === 'inside' && clamped < 18;
  return (
    <div className="progress-track" style={{ height: h }}>
      <div className="progress-fill" style={{ width: clamped + '%' }}>
        {showInfo && infoPosition === 'inside' && !showOutside && (
          <span className="progress-label">{label}</span>
        )}
      </div>
      {showInfo && showOutside && (
        <span className="progress-label outside">{label}</span>
      )}
      {showInfo && infoPosition === 'right' && (
        <span className="progress-label outside">{label}</span>
      )}
    </div>
  );
}

// ===== Tag =====
export function Tag({ color = 'teal', children }: any) {
  return <span className={`tag tag-${color}`}>{children}</span>;
}

// ===== Title =====
export function Title({ size = 'middle', color = 'default', children }: any) {
  const sizes: Record<string, string> = { small: '1.2em', middle: '1.6em', large: '2.2em' };
  const colorClass = 'ribbon-' + color;
  return (
    <div className="ribbon" style={{ fontSize: sizes[size] }}>
      <div className="ribbon-back-left"></div>
      <div className={`ribbon-front ${colorClass}`}>
        <span className="ribbon-text">{children}</span>
      </div>
      <div className="ribbon-back-right"></div>
      <div className="ribbon-fold-left"></div>
      <div className="ribbon-fold-right"></div>
    </div>
  );
}

// ===== Divider =====
export function Divider({ type = 'default' }: any) {
  return <hr className={`divider${type === 'dashed-teal' ? ' divider-teal' : ''}`} />;
}
