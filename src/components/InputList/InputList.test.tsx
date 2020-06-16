import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { InputList } from './InputList';

const props = {
  children: <div />,
  isOpen: true,
  highlightedOptionID: 1,
  options:[{id: 1, name: 'name1'}],
  onItemClick: jest.fn(),
  onItemOver: jest.fn()
};

describe('InputList tests', () => {

  test('renders label', () => {
    const { getByRole, getByText } = render(<InputList {...props}/>);
    let divElement = getByRole(/listBox/i);
    expect(divElement).toHaveClass('input-list');
    expect(divElement).toHaveAttribute('aria-labelledby');
    divElement = getByRole(/option/i);
    expect(divElement).toHaveClass('input-list-item');
    expect(divElement).toHaveClass('input-list-item-highlight');
    expect(divElement).toHaveAttribute('aria-selected');
    const spanElement = getByText('@');
    expect(spanElement).toHaveClass('screen-name');
    divElement = getByText('name1');
    expect(divElement).toHaveClass('option-attr name');
  });
  
  test('it calls onItemOver when mouseOver is triggered on div', () => {
    const { getByRole } = render(<InputList {...props}/>);
    const divElement = getByRole(/option/i);
    expect(divElement).toHaveClass('input-list-item');
    expect(divElement).toHaveClass('input-list-item-highlight');
    expect(divElement).toHaveAttribute('aria-selected');
    fireEvent.mouseOver(divElement);
    expect(props.onItemOver).toHaveBeenCalled();
  });

  test('it calls onItemClick when mouseClick is triggered on div', () => {
    const { getByRole } = render(<InputList {...props}/>);
    const divElement = getByRole(/option/i);
    expect(divElement).toHaveClass('input-list-item');
    expect(divElement).toHaveClass('input-list-item-highlight');
    expect(divElement).toHaveAttribute('aria-selected');
    fireEvent.click(divElement);
    expect(props.onItemClick).toHaveBeenCalled();
  });
});