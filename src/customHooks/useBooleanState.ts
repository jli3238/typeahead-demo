import { useState, useCallback } from 'react';

/**
 * ## useBooleanState
 * `useBooleanState()` is a custom React hook to work with boolean states.
 *
 * ### Usage and examples:
 *
 * @example
 * const [isOpen, setOpen, setClose, toggleOpen] = useBooleanState(true);
 * const [isValid, setValid, setInvalid, toggleValid] = useBooleanState(true);
 *
 * // The first value is the boolean state:
 * if (isOpen) { }
 * // The second and third value are functions to set the state to true or false:
 * setOpen(); // -> set state to true
 * setClose(); // -> set state to false
 * // The fourth value is a function to either toggle the state to its opposite...
 * toggleOpen();
 * // ...or to force the state to be true or false:
 * toggleOpen(true);
 * toggleOpen(false);
 * // Non-boolean parameters are ignored, so it can safely be used as an event handler for example:
 * <div onClick={toggleOpen} />
 *
 * // You can skip the functions you have no use for by leaving some values empty:
 * const [checked, , , toggleChecked] = useBooleanState(true);
 */
export function useBooleanState(initialState: boolean | (() => boolean)) {
  const [bool, setBool] = useState(initialState);

  function setTrue() {
    setBool(true);
  }

  function setFalse() {
    setBool(false);
  }

  function toggleBool(bool?: unknown) {
    if (typeof bool === 'boolean') {
      setBool(bool);
    } else {
      setBool(bool => !bool);
    }
  }

  return [
    bool,
    useCallback(setTrue, []),
    useCallback(setFalse, []),
    useCallback(toggleBool, [])
  ] as const;
}
