import React from 'react';

export function wrapEvent<E extends React.SyntheticEvent>(ourHandler: React.EventHandler<E>, theirHandler: React.EventHandler<E> | undefined) {
  if (!theirHandler) return ourHandler;

  return function (event: E) {
    ourHandler(event);
    theirHandler(event);
  };
}

export function preventDefault(event: React.SyntheticEvent): void {
  event.preventDefault();
}