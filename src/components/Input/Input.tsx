import React, { forwardRef } from 'react';
import clsx from 'clsx';
import { FormLabel, FormLabelProps } from '../FormLabel';
import './Input.less';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, Pick<FormLabelProps, 'label' | 'error'> {
  icon?: JSX.Element;
  labelContainerClass?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, label, icon, error, labelContainerClass, ...props }, ref) {
  className = clsx(
    'osu-input',
    {
      'osu-input-icon': icon,
      'osu-input-error': error !== undefined && error !== false
    },
    className
  );

  return (
    <FormLabel label={label} disabled={props.disabled} required={props.required} error={error} className={labelContainerClass}>
      <input className={className} {...props} ref={ref} />
      {icon}
    </FormLabel>
  );
});
