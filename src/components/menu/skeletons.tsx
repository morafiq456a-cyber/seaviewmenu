export function MenuSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div className="skeleton-shimmer aspect-[16/10] w-full rounded-3xl sm:aspect-[2/1]" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-10 w-24 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-border">
            <div className="skeleton-shimmer aspect-[4/3] w-full" />
            <div className="space-y-2 p-3.5">
              <div className="skeleton-shimmer h-4 w-3/4 rounded" />
              <div className="skeleton-shimmer h-3 w-full rounded" />
              <div className="skeleton-shimmer h-5 w-1/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
