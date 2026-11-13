import { PERIOD_OPTIONS, type PeriodKey } from '@/lib/period';
import { SegmentedControl } from './SegmentedControl';

export function PeriodSelect({ value, onChange, className }: {
  value: PeriodKey;
  onChange: (value: PeriodKey) => void;
  className?: string;
}) {
  return (
    <SegmentedControl
      ariaLabel="Período"
      value={value}
      onChange={onChange}
      options={PERIOD_OPTIONS}
      className={className}
    />
  );
}
