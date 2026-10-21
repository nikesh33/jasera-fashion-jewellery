import React from 'react';
import './Badge.css';

export function Badge({
  children,
  variant = 'default', // 'default' | 'gold' | 'maroon' | 'success' | 'warning' | 'outline'
  size = 'md', // 'sm' | 'md'
  className = '',
}) {
  return (
    <span className={`badge badge-${variant} badge-${size} ${className}`}>
      {children}
    </span>
  );
}
