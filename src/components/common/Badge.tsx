import React from 'react';
import { usePreferences } from '../../context/PreferencesContext';

export type StatusVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'wave'
  | 'orange';

interface BadgeProps {
  children: React.ReactNode;
  variant?: StatusVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  icon,
}) => {
  const { t } = usePreferences();

  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border-rose-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    wave: 'bg-sky-50 text-sky-800 border-sky-200 font-semibold',
    orange: 'bg-orange-50 text-orange-800 border-orange-200 font-semibold',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-md border ${variantStyles[variant]} ${sizeStyles[size]} whitespace-nowrap`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {typeof children === 'string' ? t(children) : children}
    </span>
  );
};
