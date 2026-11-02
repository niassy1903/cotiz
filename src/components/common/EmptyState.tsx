import React from 'react';
import { Button } from './Button';
import { usePreferences } from '../../context/PreferencesContext';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  const { t } = usePreferences();

  return (
    <div className="py-12 px-4 text-center max-w-md mx-auto">
      {icon && (
        <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400">
          {icon}
        </div>
      )}
      <h4 className="text-sm font-semibold text-slate-800">{t(title)}</h4>
      <p className="mt-1 text-xs text-slate-500 leading-relaxed">{t(description)}</p>
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button size="sm" onClick={onAction}>
            {t(actionLabel)}
          </Button>
        </div>
      )}
    </div>
  );
};
