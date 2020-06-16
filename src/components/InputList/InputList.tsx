import React, { useRef, useLayoutEffect } from 'react';
import clsx from 'clsx';
import { Option } from './types';
import { preventDefault } from '../../utils';
import './InputList.less';

function defaultItemRenderer(option: Option) {
  return (
    <div className="option-row">
      <div className="option-attr"><img data-testid="option-img" src={option.profile_image_url} alt={option.screen_name} /><span className="screen-name">@{option.screen_name}</span></div>
      <div className="option-attr name">{option.name}</div>
      <div className="option-attr verified" data-testid="option-verified">{option.verified && 'VERIFIED'}</div>
    </div>
  );
}

export interface InputListProps<O extends Option> {
  children: React.ReactNode;
  isOpen: boolean;
  highlightedOptionID: O['id'] | null;
  options: readonly O[];
  noOptionsText?: React.ReactChild;
  itemRenderer?: (option: O) => React.ReactChild;
  onItemClick: (option: O) => void;
  onItemOver: (option: O) => void;
}

export function InputList<O extends Option>({
  children,
  highlightedOptionID,
  isOpen,
  noOptionsText,
  options,
  itemRenderer = defaultItemRenderer,
  onItemClick,
  onItemOver
}: InputListProps<O>) {
  const listRef = useRef<HTMLDivElement>(null);
  const showList = isOpen && (options.length > 0 || noOptionsText !== undefined);
  const className = clsx('input-list-container', { 'input-list-container-open': showList });

  useLayoutEffect(() => {
    if (highlightedOptionID === null) return;
    const list = listRef.current;
    if (list === null) return;
    const div = list.querySelector('input-list-item-highlight');
    if (div === null) return;
    const { top, bottom } = list.getBoundingClientRect();
    const { top: divTop, bottom: divBottom } = div.getBoundingClientRect();
    if (top > divTop) {
      list.scrollTop += divTop - top;
    } else if (bottom < divBottom) {
      list.scrollTop += divBottom - bottom;
    }
  }, [highlightedOptionID]);

  function mapOption(option: O, index: number) {
    return (
      <div
        key={option.id}
        role="option"
        aria-selected={index === 0}
        className={clsx('input-list-item', { 'input-list-item-highlight': highlightedOptionID === option.id })}
        onMouseOver={() => onItemOver(option)}
        onClick={() => onItemClick(option)}
      >
        {itemRenderer(option)}
        <hr className="input-list-divider" />
      </div>
    );
  }

  return (
    <div className={className}>
      {children}
      {showList &&
        <>
          <div id="input_list" />
          <div
            role="listbox"
            aria-labelledby="input_list"
            ref={listRef}
            className="input-list"
            // This prevents the list from stealing focus from the input
            onMouseDown={preventDefault}
            // This prevents checkbox labels from stealing focus from the input
            onClick={preventDefault}
          >
            {noOptionsText !== undefined && <div className="input-list-no-item">{noOptionsText}</div>}
            {options.map(mapOption)}
          </div>
        </>
      }
    </div>
  );
}
