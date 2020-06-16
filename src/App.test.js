import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import App from './App';

describe('DisplaySearchForm tests', () => {

  test('it renders textarea', () => {
    const { getByLabelText, getByPlaceholderText } = render(<App />);
    let textAreaElement = getByLabelText(/Twitter/i);
    expect(textAreaElement).toHaveClass('typeahead');
    expect(textAreaElement).toHaveAttribute('placeholder');
    textAreaElement = getByPlaceholderText(/What\'s happening?/i);
    expect(textAreaElement).toHaveClass('typeahead');
    expect(textAreaElement).toHaveAttribute('placeholder');
  });
});
