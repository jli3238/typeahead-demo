// Additional Feature 6. Add unit tests
import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { useBooleanState } from './useBooleanState';

function TestingComponent() {
  const [bool, setTrue, setFalse, toggleBool] = useBooleanState(true);

  return (
    <>
      <div className="value">{String(bool)}</div>
      <div className="setTrue" onClick={setTrue} />
      <div className="setFalse" onClick={setFalse} />
      <div className="toggleBool" onClick={toggleBool} />
      <div className="toggleBool-true" onClick={() => toggleBool(true)} />
      <div className="toggleBool-false" onClick={() => toggleBool(false)} />
    </>
  );
}

test('should call the methods, and set the correct state', () => {
  const { container } = render(<TestingComponent />);

  // initial state
  const valueDiv = container.querySelector('.value')!;
  expect(valueDiv.textContent).toBe('true');

  // setFalse
  fireEvent.click(container.querySelector('.setFalse')!);
  expect(valueDiv.textContent).toBe('false');

  // setTrue
  fireEvent.click(container.querySelector('.setTrue')!);
  expect(valueDiv.textContent).toBe('true');

  // toggleBool -> false
  fireEvent.click(container.querySelector('.toggleBool')!);
  expect(valueDiv.textContent).toBe('false');

  // toggleBool(true)
  fireEvent.click(container.querySelector('.toggleBool-true')!);
  expect(valueDiv.textContent).toBe('true');

  // toggleBool(false)
  fireEvent.click(container.querySelector('.toggleBool-false')!);
  expect(valueDiv.textContent).toBe('false');

  // toggleBool -> true
  fireEvent.click(container.querySelector('.toggleBool')!);
  expect(valueDiv.textContent).toBe('true');
});
