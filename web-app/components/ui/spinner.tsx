import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const SIZES = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-[3px]',
  lg: 'h-12 w-12 border-[3px]',
};

export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)} role="status">
      <div
        className={cn('rounded-full animate-spin', SIZES[size])}
        style={{ borderColor: '#E8E5DE', borderTopColor: '#2D6A4F' }}
      />
      {label && (
        <p className="text-sm" style={{ color: '#8A8A8A' }}>
          {label}
        </p>
      )}
      <span className="sr-only">{label || 'Loading...'}</span>
    </div>
  );
}
