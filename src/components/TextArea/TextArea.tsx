import React from 'react';
import { FormLabelProps } from '../FormLabel';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, Pick<FormLabelProps, 'label' | 'error'> {
  labelContainerClass?: string;
}