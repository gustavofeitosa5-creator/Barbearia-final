import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export function StarRating({ rating, max = 5, size = 14, interactive, onChange, className }: StarRatingProps) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={size}
          onClick={() => interactive && onChange?.(i + 1)}
          className={cn(
            'transition-colors',
            i < rating ? 'fill-[#D4A853] text-[#D4A853]' : 'fill-transparent text-[#374151]',
            interactive && 'cursor-pointer hover:text-[#D4A853]'
          )}
        />
      ))}
    </div>
  );
}
