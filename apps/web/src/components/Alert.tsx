interface AlertProps {
  tone: 'error' | 'success';
  children: string;
}

/** A message announced by screen readers as soon as it appears. */
export function Alert({ tone, children }: AlertProps) {
  return (
    <p
      className={`alert alert--${tone}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {children}
    </p>
  );
}
