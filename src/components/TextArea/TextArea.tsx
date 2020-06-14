import React, { forwardRef } from 'react';
import clsx from 'clsx';
import { FormLabel, FormLabelProps } from '../FormLabel';
import './TextArea.less';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, Pick<FormLabelProps, 'label' | 'error'> {
  labelContainerClass?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea({ className, label, error, labelContainerClass, ...props }, ref) {
  className = clsx(
    'osu-textarea',
    { 'osu-textarea-error': error !== undefined && error !== false },
    className
  );

  return (
    <FormLabel label={label} disabled={props.disabled} required={props.required} error={error} className={labelContainerClass}>
      <textarea className={className} {...props} ref={ref} />
    </FormLabel>
  );
});
