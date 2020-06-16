// Additional Feature 6. Add unit tests
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { api } from './utils/api';

jest.mock("./utils/api");

const state = {
  onSearchAsync: jest.fn(),
  setValue: jest.fn(),
}

describe('DisplaySearchForm tests', () => {
  async function setup(){
    await act(async () => {
      state.onSearchAsync.mockReset();
      state.setValue.mockReset();
    });
    return render(<App {...state}/>);
  }

  test('it renders textarea', async () => {
    const { getByLabelText, getByPlaceholderText, getByText } = await setup();
    let textAreaElement = getByLabelText(/Twitter/i);
    expect(textAreaElement).toHaveClass('typeahead');
    expect(textAreaElement).toHaveAttribute('placeholder');
    textAreaElement = getByPlaceholderText(/What\'s happening?/i);
    expect(textAreaElement).toHaveClass('typeahead');
    expect(textAreaElement).toHaveAttribute('placeholder');
    expect(state.onSearchAsync).not.toHaveBeenCalled();
    expect(state.setValue).not.toHaveBeenCalled();
    expect(screen.getByText("Twitter")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
  });

  test('it doesn\'t call api.get', async () => {
    const { getByLabelText, getByPlaceholderText, getByText } = await setup();
    expect(api.get).toHaveBeenCalledTimes(0);
  });
});
