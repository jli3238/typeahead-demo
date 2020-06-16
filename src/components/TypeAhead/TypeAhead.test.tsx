import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import TypeAhead from './TypeAhead';

const props = {
  value: [{id: 1, name: 'name1'}],
  onChange: jest.fn(),
  onSearch: jest.fn()
};

describe('TypeAhead tests', () => {
  async function setup(){
    await act(async () => {
      props.onSearch.mockReset();
      props.onChange.mockReset();
    });
    return render(<TypeAhead {...props}/>);
  }

  test('renders label and span', async () => {
    const { getByRole, getByText } = await setup();
    const labelElement = getByRole(/search/i);
    expect(labelElement).toHaveClass('form-label-container');
    expect(labelElement).toHaveAttribute('aria-label');
    const spanElement = getByText('500');
    expect(spanElement).toHaveClass('chars-left-icon');
  });

  test('it doesn\'t call onSearch when change with "" is triggered on textarea', async () => {
    const { getByTestId } = await setup();
    const textAreaElement = getByTestId('textarea');
    fireEvent.change(textAreaElement, { target: { value: '' } });
    expect(props.onSearch).not.toHaveBeenCalled();
  });
  
  test('it doesn\'t call onChange when change with "" is triggered on textarea ', async () => {
    const { getByTestId } = await setup();
    const textAreaElement = getByTestId('textarea');
    fireEvent.change(textAreaElement, { target: { value: '' } });
    expect(props.onChange).not.toHaveBeenCalled();
  });
  
  test('it doesn\'t call onSearch when change with "aaa" is triggered on textarea', async () => {
    const { getByTestId } = await setup();
    const textAreaElement = getByTestId('textarea');
    fireEvent.change(textAreaElement, { target: { value: 'aaa' } });
    expect(props.onSearch).not.toHaveBeenCalled();
  });
      
  test('it doesn\'t call onChange when change with "aaa" is triggered on textarea ', async () => {
    const { getByTestId } = await setup();
    const textAreaElement = getByTestId('textarea');
    fireEvent.change(textAreaElement, { target: { value: 'aaa' } });
    expect(props.onChange).not.toHaveBeenCalled();
  });    

  test('it doesn\'t call onSearch when change with "aaa" is triggered on textarea', async () => {
    const { getByTestId } = await setup();
    const textAreaElement = getByTestId('textarea');
    fireEvent.change(textAreaElement, { target: { value: '@' } });
    expect(props.onSearch).not.toHaveBeenCalled();
  });
    
  test('it doesn\'t call onChange when change with "aaa" is triggered on textarea ', async () => {
    const { getByTestId } = await setup();
    const textAreaElement = getByTestId('textarea');
    fireEvent.change(textAreaElement, { target: { value: '@' } });
    expect(props.onChange).not.toHaveBeenCalled();
  });

  test('it doesn\'t call onSearch when change with "aaa" is triggered on textarea', async () => {
    const { getByTestId } = await setup();
    const textAreaElement = getByTestId('textarea');
    fireEvent.change(textAreaElement, { target: { value: '@w' } });
    expect(props.onSearch).not.toHaveBeenCalled();
  });
    
  test('it doesn\'t call onChange when change with "aaa" is triggered on textarea ', async () => {
    const { getByTestId } = await setup();
    const textAreaElement = getByTestId('textarea');
    fireEvent.change(textAreaElement, { target: { value: '@w' } });
    expect(props.onChange).not.toHaveBeenCalled();
  });

  test('it doesn\'t call onSearch when change with "aaa" is triggered on textarea', async () => {
    const { getByTestId } = await setup();
    const textAreaElement = getByTestId('textarea');
    fireEvent.change(textAreaElement, { target: { value: '@er' } });
    expect(props.onSearch).not.toHaveBeenCalled();
  });
    
  test('it doesn\'t call onChange when change with "aaa" is triggered on textarea ', async () => {
    const { getByTestId } = await setup();
    const textAreaElement = getByTestId('textarea');
    fireEvent.change(textAreaElement, { target: { value: '@er' } });
    expect(props.onChange).not.toHaveBeenCalled();
  });
});