import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Cancel, Search } from '@material-ui/icons';
import clsx from 'clsx';
import { FormLabel } from '../FormLabel';
import { InputList, Option } from '../InputList';
import { isOptionSelected } from './utils';
import { isStringEmpty, preventDefault, wrapEvent } from '../../utils';
import { useBooleanState } from '../../customHooks';
import { InputProps } from '../Input';
import { Omit } from '../../../types/General';

import '../Input/Input.less';

type SharedInputProps = Omit<InputProps, 'value' | 'defaultValue' | 'type' | 'icon' | 'onChange'>;

interface Props<O extends Option> extends SharedInputProps {
    /** Array of selected options. */
    value: readonly O[];
    /** The onChange listener gets called when the selection list gets updated. */
    onChange: (value: O[]) => void;
    /** Custom item renderer */
    itemRenderer?: (options: O) => React.ReactChild;
    /** Custom text to replace "No matching results". */
    noResultsText?: string;
}
  
interface DynamicProps<O extends Option> extends Props<O> {
    options?: never;
    filter?: never;
    /**
     * Function returning a dynamic options list.
     *
     * Cannot be used together with `options` or `filter`.
     */
    onSearch: (text: string) => readonly O[] | Promise<readonly O[]>;
}

export type TypeAheadProps<O extends Option = Option> = DynamicProps<O>;

/**
 * ## TypeAhead
 * Use this component to display a list of matching options alongside a text input.
 *
 * ### Usage and examples:
 *
 * @example
 * // TypeAhead with dynamic options:
 * <TypeAhead value={[]} onSearch={onSearch} onChange={onChange} />
 */
function TypeAhead<O extends Option>({
    className,
    value,
    options: staticOptions,
    onChange,
    onSearch,
    onKeyDown,
    onFocus,
    onBlur,
    filter,
    placeholder,
    noResultsText,
    label,
    error,
    labelContainerClass,
    itemRenderer,
    ...props
  }: TypeAheadProps<O>) {
    const promiseRef = useRef<null | readonly O[] | Promise<readonly O[]>>(null);
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setOpen, setClose] = useBooleanState(false);
    // Keep the previous value in state while the list is open to prevent reordering the items while toggling options:
    const [previousValue, setPreviousValue] = useState<undefined | readonly O[]>(undefined);
    const [isLoading, setIsLoading, setIsNotLoading] = useBooleanState(false);
    const [hasError, showError, hideError] = useBooleanState(false);
    const [options, setOptions] = useState<readonly O[]>([]);
    const [highlightedOptionID, setHighlightedOptionID] = useState<O['id'] | null>(null);

    useEffect(() => {
        setInputValue((value.length > 0 && value[0].screen_name) ? `@${value[0].screen_name}` : '');
    }, [value])
  
    const filteredOptions = useMemo(() => {
      return options;
    }, [options]);
  
    const [pinnedOptions, unpinnedOptions, sortedOptions] = useMemo(() => {
        if (previousValue === undefined) return [[], [], []];      
        const pinnedOptions = [];
        const unpinnedOptions = [];
        let sortedOptions = [];

        for (const option of filteredOptions) {
            if (isOptionSelected(option.id, previousValue)) {
                pinnedOptions.push(option);
            } else {
                unpinnedOptions.push(option);
            }
        }
        sortedOptions = [...pinnedOptions, ...unpinnedOptions];
        return [pinnedOptions, unpinnedOptions, sortedOptions];
    }, [filteredOptions, previousValue]);
  
    async function onInputChange(event: React.ChangeEvent<HTMLInputElement>) {
      const text = event.target.value;
      openList();
      setInputValue(text);
      hideError();
      setOptions([]);
  
      if (onSearch === undefined || isStringEmpty(text)) return;
  
      setIsLoading();
  
      // Keep track of the last request.
      // This is so we make sure we only accept the list of options from the _last_ request:
      // It is possible for the user to input `a`, then `ab`, then `a` again,
      // in which case we will ignore the first request for `a`, as it might resolve
      // to an outdated list of options depending on contextual values.
      const promise = onSearch(text);
      promiseRef.current = promise;
  
      try {
        const options = await promise;
        // It is possible for users to type faster than promises can get resolved,
        // so we need to make sure we set the correct matching suggestions.
        // e.g. don't show suggestions for `Pari` when the input has `Paris`.
        if (promiseRef.current !== promise) return;
        setOptions(options);
      } catch {
        if (promiseRef.current !== promise) return;
        showError();
      }
  
      promiseRef.current = null;
      setIsNotLoading();
    }
  
    function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
      switch (event.key) {
        case 'Enter':
          if (!isOpen) {
            openList();
          } else if (highlightedOptionID !== null) {
            const option = sortedOptions.find(o => o.id === highlightedOptionID);
            if (option !== undefined) {
              toggleOption(option);
            }
          }
          break;
        case 'Escape':
          closeList();
          break;
        case 'ArrowUp':
          highlightNextOption(-1);
          break;
        case 'ArrowDown':
          highlightNextOption(+1);
          break;
        default:
          return;
      }
  
      event.preventDefault();
    }
  
    function highlightNextOption(delta: 1 | -1) {
      if (!isOpen) return;
  
      if (highlightedOptionID === null) {
        setHighlightedOptionID(sortedOptions[0].id);
        return;
      }
  
      const selectedOptionIndex = sortedOptions.findIndex(option => option.id === highlightedOptionID);
      if (delta === +1 && selectedOptionIndex === sortedOptions.length - 1) return;
      if (delta === -1 && selectedOptionIndex === 0) return;
      setHighlightedOptionID(sortedOptions[selectedOptionIndex + delta].id);
    }
  
    function openList() {
      setOpen();
      setPreviousValue(prevValue => prevValue ?? value);
    }
  
    function closeList() {
      setClose();
      setPreviousValue(undefined);
    }
  
    function clear() {
      promiseRef.current = null;
      setInputValue('');
      setIsNotLoading();
      hideError();
      setOptions([]);
    }
  
    function toggleOption(option: O) {
      if (isOptionSelected(option.id, value)) {
        onChange(value.filter(v => v.id !== option.id));
      } else {
        onChange([option]);
      }
    }
  
    const valueIsEmpty = isStringEmpty(inputValue);

    className = clsx(
      'typeahead',
      'input',
      'input-icon',
      {
        'input-error': error !== undefined && error !== false
      },
      className
    );
  
    let noOptionsText;
    if (!valueIsEmpty && sortedOptions.length === 0) {
      if (isLoading) {
        noOptionsText = 'Loading...';
      } else if (hasError) {
        noOptionsText = 'Error...';
      } else {
        noOptionsText = noResultsText || 'No matching results';
      }
    }
  
    return (
      <FormLabel label={label} disabled={props.disabled} required={props.required} error={error} className={labelContainerClass}>
        <InputList
          isOpen={isOpen}
          highlightedOptionID={highlightedOptionID}
          options={unpinnedOptions}
          pinnedOptions={pinnedOptions}
          noOptionsText={noOptionsText}
          itemRenderer={itemRenderer}
          onItemClick={toggleOption}
          onItemOver={option => setHighlightedOptionID(option.id)}
        >
          <input
            className={className}
            value={inputValue}
            onChange={onInputChange}
            onKeyDown={wrapEvent(onInputKeyDown, onKeyDown)}
            onFocus={wrapEvent(openList, onFocus)}
            onBlur={wrapEvent(closeList, onBlur)}
            placeholder={placeholder}
            {...props}
          />
  
          {valueIsEmpty
            ? <Search onMouseDown={preventDefault} />
            : <Cancel onMouseDown={preventDefault} onClick={clear} />}
        </InputList>
      </FormLabel>
    );
  }
  
  export default TypeAhead as <O extends Option>(props: TypeAheadProps<O> & { ref?: React.Ref<HTMLInputElement> }) => JSX.Element;
  