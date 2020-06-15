import React, { useRef, useState, useEffect } from 'react';
import clsx from 'clsx';
import { FormLabel } from '../FormLabel';
import { InputList, Option } from '../InputList';
import { isOptionSelected } from './utils';
import { isStringEmpty, wrapEvent } from '../../utils';
import { useBooleanState } from '../../customHooks';
import { TextAreaProps } from '../TextArea';
import { Omit } from '../../../types/General';

import '../TextArea/TextArea.less';

type SharedTextAreaProps = Omit<TextAreaProps, 'value' | 'defaultValue' | 'onChange'>;

interface Props<O extends Option> extends SharedTextAreaProps {
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
    onSearch: (text: string) => readonly O[] | Promise<readonly O[]>;
}

export type TypeAheadProps<O extends Option = Option> = DynamicProps<O>;

/**
 * ## TypeAhead: Display a list of matching options alongside a textarea input.
 * @example
 * <TypeAhead value={[]} onSearch={onSearch} onChange={onChange} />
 */
function TypeAhead<O extends Option>({
    className,
    value,
    onChange,
    onSearch,
    onKeyDown,
    onFocus,
    onBlur,
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
    const [isLoading, setIsLoading, setIsNotLoading] = useBooleanState(false);
    const [hasError, showError, hideError] = useBooleanState(false);
    const [options, setOptions] = useState<readonly O[]>([]);
    const [highlightedOptionID, setHighlightedOptionID] = useState<O['id'] | null>(null);
    const [textAreaTextBeforeMention, setTextAreaTextBeforeMention] = useState('');
    const [textAreaTextAfterMention, setTextAreaTextAfterMention] = useState('');

    const maxOfChars = 50;

    useEffect(() => {
        const newInputValue = (value.length > 0 && value[0].screen_name) 
            ? `${textAreaTextBeforeMention} @${value[0].screen_name} ${textAreaTextAfterMention}`
            : inputValue;
        if (newInputValue.length > maxOfChars) return;
        setInputValue(newInputValue);
        closeList();
    }, [value])
  
    async function onInputChange(event: React.ChangeEvent<HTMLTextAreaElement>) {    
      const textAreaText = event.target.value;
      setInputValue(textAreaText);
      const strArrBeforeMention = textAreaText.substring(0, event.target.selectionStart).split(' ');
      const strArrAfterMention = textAreaText.substring(event.target.selectionStart + 1).split(' ');
      setTextAreaTextBeforeMention(strArrBeforeMention.slice(0, strArrBeforeMention.length - 1).join(' '));
      setTextAreaTextAfterMention(strArrAfterMention.join(' '));
      const textWithMention = strArrBeforeMention[strArrBeforeMention.length - 1];
      if (!(textWithMention.charAt(0) === '@' && textWithMention.length > 2)) { closeList(); return; }
      const text = textWithMention.slice(1);
      openList();
      hideError();
      setOptions([]);
  
      if (onSearch === undefined || isStringEmpty(text)) return;
  
      setIsLoading();
  
      // Keep track of the last request.
      // This is so we make sure we only accept the list of options from the _last_ request:
      // It is possible for a user to input `a`, then `ab`, then `a` again,
      // in which case we will ignore the first request for `a`, as it might resolve
      // to an outdated list of options depending on contextual values.
      const promise = onSearch(text);
      promiseRef.current = promise;
  
      try {
        const options = await promise;
        // It is possible for a user to type faster than promises can get resolved,
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
  
    function onInputKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
      switch (event.key) {
        case 'Enter':
          if (!isOpen) {
            openList();
          } else if (highlightedOptionID !== null) {
            const option = options.find(o => o.id === highlightedOptionID);
            if (option !== undefined) {
              selectOption(option);
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
        setHighlightedOptionID(options[0].id);
        return;
      }
  
      const selectedOptionIndex = options.findIndex(option => option.id === highlightedOptionID);
      if (delta === +1 && selectedOptionIndex === options.length - 1) return;
      if (delta === -1 && selectedOptionIndex === 0) return;
      setHighlightedOptionID(options[selectedOptionIndex + delta].id);
    }
  
    function openList() {
      setOpen();
    }
  
    function closeList() {
      setClose();
    }
  
    function selectOption(option: O) {
      if (isOptionSelected(option.id, value)) {
        onChange(value.filter(v => v.id !== option.id));
      } else {
        onChange([option]);
      }
    }
  
    const valueIsEmpty = isStringEmpty(inputValue);

    className = clsx(
      'chars-left',
      { 'chars-no-left': inputValue.length > maxOfChars },
      className
    );
  
    let noOptionsText;
    if (!valueIsEmpty && options.length === 0) {
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
            options={options}
            noOptionsText={noOptionsText}
            itemRenderer={itemRenderer}
            onItemClick={selectOption}
            onItemOver={option => setHighlightedOptionID(option.id)}
        >
            <div className="twitter-container">
                <textarea
                    className="typeahead"
                    value={inputValue}
                    onChange={onInputChange}
                    onKeyDown={wrapEvent(onInputKeyDown, onKeyDown)}
                    onFocus={wrapEvent(closeList, onFocus)}
                    onBlur={wrapEvent(closeList, onBlur)}
                    placeholder={placeholder}
                    {...props}
                />
                <hr className="textarea-divider" />
                <footer className={className}>{maxOfChars - inputValue.length} characters left...</footer>            
            </div>
        </InputList>
      </FormLabel>
    );
  }
  
  export default TypeAhead as <O extends Option>(props: TypeAheadProps<O> & { ref?: React.Ref<HTMLInputElement> }) => JSX.Element;
  