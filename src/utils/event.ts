import React from 'react';

export function wrapEvent<E extends React.SyntheticEvent>(ourHandler: React.EventHandler<E>, theirHandler: React.EventHandler<E> | undefined) {
  if (!theirHandler) return ourHandler;

  return function (event: E) {
    ourHandler(event);
    theirHandler(event);
  };
}

/**
* Hijack onClick to close the component controlled by the trigger when clicking on it,
* while still calling the original onClick if it was set.
*/
export function onTriggerClick(trigger: React.ReactElement, onClick: React.MouseEventHandler): React.ReactElement {
  return React.cloneElement<{ onClick: React.MouseEventHandler }>(trigger, {
    onClick: wrapEvent(onClick, trigger.props.onClick)
  });
}

export function preventDefault(event: React.SyntheticEvent): void {
  event.preventDefault();
}