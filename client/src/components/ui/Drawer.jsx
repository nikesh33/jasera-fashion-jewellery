import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './Drawer.css';

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = 'right', // 'right' | 'left'
  width = '420px',
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div
        className={`drawer-panel drawer-${position}`}
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-header">
          {title && <h3 className="drawer-title">{title}</h3>}
          <button className="drawer-close-btn" onClick={onClose} aria-label="Close drawer">
            <X size={20} />
          </button>
        </div>
        <div className="drawer-content">{children}</div>
      </div>
    </div>
  );
}
