import React from 'react';
import { render } from '@testing-library/react';
import { createSharedStateHook } from './createSharedStateHook';

const [useTestState, setTestState] = createSharedStateHook(5);

function TestComponentA() {
  const state = useTestState();

  return <div>value: {state}</div>;
}

function TestComponentB() {
  const state = useTestState();

  function onClick() {
    setTestState(prevState => prevState += 1);
  }

  return <button type="button" onClick={onClick}>value: {state}</button>;
}

function TestParentComponent() {
  const state = useTestState();

  return (
    <>
      {state < 7 && <TestComponentA />}
      <TestComponentB />
    </>
  );
}

test('should use the shared state and re-render other components on update', () => {
  const { container } = render(<TestParentComponent />);

  const div = container.querySelector('div')!;
  const button = container.querySelector('button')!;

  // initial state works
  expect(div.textContent).toBe('value: 5');
  expect(button.textContent).toBe('value: 5');

  // shared state update works
  button.click();
  expect(div.textContent).toBe('value: 6');
  expect(button.textContent).toBe('value: 6');

  // parent unmounts the first component correctly, unregisters the state update listener
  button.click();
  expect(container.querySelector('div')).toBeNull();
  expect(button.textContent).toBe('value: 7');

  // check once more that we don't call `setState` on an unregistered component
  // /!\ React will print a warning if we failed to unregistered the component properly,
  // instead of throwing an error.
  button.click();
  expect(container.querySelector('div')).toBeNull();
  expect(button.textContent).toBe('value: 8');
});


test('should immediately listen to state updates', () => {
  function ImmediateUpdate() {
    const state = useTestState();
    setTestState(123);

    return <span>{state}</span>;
  }

  const { container } = render(<ImmediateUpdate />);

  expect(container.querySelector('span')!.textContent).toBe('123');
});
