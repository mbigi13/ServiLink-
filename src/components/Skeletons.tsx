interface Props {
  count?: number;
  className?: string;
}

export function CardSkeleton({ count = 2, className = "" }: Props) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl shimmer" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 rounded shimmer" />
              <div className="h-3 w-2/3 rounded shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
