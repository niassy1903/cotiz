import React, { forwardRef } from 'react';
import { usePreferences } from '../../context/PreferencesContext';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightElement, placeholder, className = '', id, ...props }, ref) => {
    const { t } = usePreferences();
    const inputId = id || props.name || Math.random().toString(36).substring(2, 7);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 mb-1.5">
            {t(label)}
            {props.required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative rounded-lg shadow-xs">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            placeholder={placeholder ? t(placeholder) : placeholder}
            className={`w-full rounded-lg border bg-white py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 ${
              leftIcon ? 'pl-9' : 'pl-3'
            } ${rightElement ? 'pr-10' : 'pr-3'} ${
              error ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-300'
            } ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">{rightElement}</div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-rose-600">{t(error)}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-slate-500">{t(helperText)}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
