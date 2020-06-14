import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Input } from './';

describe('Input', () => {
  it('should trigger onChange on change', () => {
    const onChange = jest.fn();
    const { container } = render(<Input onChange={onChange} />);

    expect(onChange).not.toHaveBeenCalled();
    fireEvent.change(container.querySelector('input')!, { target: { value: 'test' } });
    expect(onChange).toHaveBeenCalled();
  });
});
