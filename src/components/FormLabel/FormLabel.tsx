import React from 'react';
import clsx from 'clsx';
import './FormLabel.less';

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  label?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean | string | string[];
}

export function FormLabel({ className, label, disabled, required, error, children, ...props }: FormLabelProps) {
  className = clsx(
    'form-label-container',
    { 'form-label-disabled': disabled },
    { 'form-label-required': required },
    className
  );

  return (
    <label className={className} {...props}>
      {label && <span className="form-label">{label}</span>}
      {children}
      {typeof error === 'string' && (
        <span className="form-label-error">{error}</span>
      )}
      {Array.isArray(error) && (
        <span className="form-label-error">{error.map(err => <div key={err}>{err}</div>)}</span>
      )}
    </label>
  );
}
