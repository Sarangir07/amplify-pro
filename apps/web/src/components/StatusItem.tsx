export type StatusTone = 'good' | 'warning' | 'bad' | 'neutral';

interface StatusItemProps {
  label: string;
  value: string;
  tone: StatusTone;
}

/** One row of the status list. The wording carries the meaning, not just the color. */
export function StatusItem({ label, value, tone }: StatusItemProps) {
  return (
    <li className="status-item">
      <span className="status-label">{label}</span>
      <span className={`status-value status-value--${tone}`}>{value}</span>
    </li>
  );
}
