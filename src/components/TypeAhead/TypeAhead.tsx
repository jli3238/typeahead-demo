import React, { useRef, useState, useEffect } from 'react';
import clsx from 'clsx';
import { FormLabel } from '../Common/FormLabel';
import { InputList, Option } from '../Common/InputList';
import { isOptionSelected } from './utils';
import { isStringEmpty, wrapEvent } from '../../utils';
import { useBooleanState } from '../../customHooks';
import { TextAreaProps } from '../Common/TextArea';
import { Omit } from '../../../types/General';

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
  error,
  label,
  labelContainerClass,
  noResultsText,
  placeholder,
  value,
  itemRenderer,
  onBlur,
  onChange,
  onFocus,
  onKeyDown,
  onSearch,
  ...props
}: TypeAheadProps<O>) {
  const [hasError, showError, hideError] = useBooleanState(false);
  const [highlightedOptionID, setHighlightedOptionID] = useState<O['id'] | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading, setIsNotLoading] = useBooleanState(false);
  const [isOpen, setOpen, setClose] = useBooleanState(false);
  const [mentionReplaceStartIndex, setMentionReplaceStartIndex] = useState(0);
  const [options, setOptions] = useState<readonly O[]>([]);
  const [text, setText] = useState('');
  const promiseRef = useRef<null | readonly O[] | Promise<readonly O[]>>(null);
  const maxOfChars = 500;

  useEffect(() => {
    const newInputValue = (value.length > 0 && value[0].screen_name)
      ? `${inputValue.slice(0,mentionReplaceStartIndex)}${value[0].screen_name} ${inputValue.slice(mentionReplaceStartIndex + text.length)}`
      : inputValue;
    if (newInputValue.length > maxOfChars) return;
    setInputValue(newInputValue);
    closeList();
    // eslint-disable-next-line
  }, [value])

  async function onInputChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const textAreaText = event.target.value;
    setInputValue(textAreaText);
    const strArrBeforeMention = textAreaText.substring(0, event.target.selectionStart).split(' ');
    const textWithMention = strArrBeforeMention[strArrBeforeMention.length - 1];
    // The suggestion panel shows up when the following criteria are all met:
    // 1. The string between the cursor and the last whitespace before the cursor starts with "@";
    // 2. Length of the string between the cursor and the last whitespace before the cursor is 3 or more;
    // 3. The string between the cusor and the last whitespace before the cursor doesn't contain more than 1 "@"; for instance:
    //    inserting '@ch' by typing '@ch' in between the existing mention "@chicagobulls" as "@chicagobu'@ch'lls" won't display 
    //    suggestions to avoid messing up with the existing mention
    if (textWithMention.charAt(0) !== '@' || textWithMention.length < 3 || (textWithMention.match(/@/g) || []).length > 1 ) { closeList(); return; }
    setText(textWithMention.slice(1));
    setMentionReplaceStartIndex(event.target.selectionStart - text.length);
    openList();
    hideError();
    setOptions([]);
    if (onSearch === undefined || isStringEmpty(text)) return;
    setIsLoading();

    // Additional Feature 1. Prevent duplicate requests by caching responses from the twitter screen name lookup API
    // Keep track of the last request.
    // This is so we make sure we only accept the list of options from the _last_ request:
    // It is possible for a user to input `a`, then `ab`, then `a` again,
    // in which case we will ignore the first request for `a`, as it might resolve
    // to an outdated list of options depending on contextual values.
    const promise = onSearch(text);
    promiseRef.current = promise;
    try {
      const options = await promise;
      // Additional Feature 2. Debounce the input so that unnecessary requests aren’t being made as the user types a mention
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

  // Additional Feature 3. Keyboard navigation
  function onInputKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    switch (event.key) {
      case 'Enter':
        if (!isOpen) { 
          openList();
        } else if (highlightedOptionID !== null) {
          const option = options.find(o => o.id === highlightedOptionID);
          if (option !== undefined) { selectOption(option); }
        }
        break;
      case 'Tab':
        if (highlightedOptionID !== null) {
          const option = options.find(o => o.id === highlightedOptionID);
          if (option !== undefined) { selectOption(option); }
        }
        break;
      case 'Escape': closeList(); break;
      case 'ArrowUp': highlightNextOption(-1); break;
      case 'ArrowDown': highlightNextOption(+1); break;
      default: return;
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

  function openList() { setOpen(); }

  function closeList() { setClose(); }

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
    // Additional Feature 5. Improve accessibility of the app with WAI-ARIA attributes
    <FormLabel role="search" aria-label="search screen name" label={label} disabled={props.disabled} required={props.required} error={error} className={labelContainerClass}>
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
            data-testid="textarea"
            {...props}
          />
          <hr className="textarea-divider" />
          {/* Additional Feature 4. Add a characters remaining counter */}
          <footer className={className}><span className="chars-left-icon">{maxOfChars-inputValue.length}</span></footer>
        </div>
      </InputList>
    </FormLabel>
  );
}

export default TypeAhead as <O extends Option>(props: TypeAheadProps<O> & { ref?: React.Ref<HTMLInputElement> }) => JSX.Element;
