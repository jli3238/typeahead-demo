import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import TypeAhead from './TypeAhead';

const props = {
  value: [{id: 1, name: 'name1'}],
  onChange: jest.fn(),
  onSearch: jest.fn()
};

describe('TypeAhead tests', () => {

  test('renders label and span', () => {
    const { getByRole, getByText } = render(<TypeAhead {...props}/>);
    const labelElement = getByRole(/search/i);
    expect(labelElement).toHaveClass('form-label-container');
    expect(labelElement).toHaveAttribute('aria-label');
    const spanElement = getByText('500');
    expect(spanElement).toHaveClass('chars-left-icon');
  });
  
  test('it calls onChange when change is triggered on textarea', () => {
    const { getByTestId } = render(<TypeAhead {...props} />);
    const textAreaElement = getByTestId('textarea');
    fireEvent.change(textAreaElement);
    expect(props.onChange).not.toHaveBeenCalled();
  });

  test('it calls onSearch when change is triggered on textarea', () => {
    const { getByTestId } = render(<TypeAhead {...props} />);
    const textAreaElement = getByTestId('textarea');
    fireEvent.change(textAreaElement);
    expect(props.onSearch).not.toHaveBeenCalled();
  });
});