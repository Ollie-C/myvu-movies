// NOT AUDITED

import { cn } from '@/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ className, hover = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface rounded-xl p-6 shadow-neo',
        hover && 'transition-all hover:shadow-neo-lg hover:-translate-y-1',
        className
      )}
      {...props}
    />
  );
}
