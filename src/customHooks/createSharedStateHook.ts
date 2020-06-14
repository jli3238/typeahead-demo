import { useState, useEffect, SetStateAction } from 'react';

export function createSharedStateHook<T>(initialState: T) {
  let sharedState = initialState;
  const listeners = new Set<(state: T) => void>();

  function useSharedState() {
    const [state, setState] = useState<T>(sharedState);
    useEffect(() => {
      listeners.add(setState);

      // Immediately update state, as it may have been updated after mount time and before adding the listener.
      // It won't trigger a re-render if the state hasn't changed.
      setState(sharedState);

      return () => {
        listeners.delete(setState);
      };
    }, []);

    return state;
  }

  function setSharedState(newState: SetStateAction<T>): void {
    if (typeof newState === 'function') {
      newState = (newState as (prevState: T) => T)(sharedState);
    }
    if (!Object.is(sharedState, newState)) {
      sharedState = newState;
      for (const listener of listeners) {
        listener(sharedState);
      }
    }
  }

  return [useSharedState, setSharedState] as const;
}
