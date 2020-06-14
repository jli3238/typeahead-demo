export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type LogLevel = 'info' | 'success' | 'warning' | 'error';

export type LinkType<As, Tag extends keyof JSX.IntrinsicElements> = {
  [K in keyof JSX.IntrinsicElements]: K extends As
    ? K
    : As extends JSX.IntrinsicElements[K]
      ? React.ComponentType<As>
      : never;
}[Tag];

export type EmptyReactNode = boolean | null | undefined;

export type DivProps = React.HTMLAttributes<HTMLDivElement>;
