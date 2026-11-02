import React, { forwardRef } from 'react';
import { usePreferences } from '../../context/PreferencesContext';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className = '', id, ...props }, ref) => {
    const { t } = usePreferences();
    const selectId = id || props.name || Math.random().toString(36).substring(2, 7);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700 mb-1.5">
            {t(label)}
            {props.required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors disabled:bg-slate-50 disabled:text-slate-500 cursor-pointer ${
              error ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300'
            } ${className}`}
            {...props}
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {t(opt.label)}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
        {error && <p className="mt-1 text-xs text-rose-600">{t(error)}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-slate-500">{t(helperText)}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
