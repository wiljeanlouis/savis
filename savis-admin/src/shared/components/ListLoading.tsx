import { Skeleton } from "@/shared/ui/skeleton";

export function ListLoading({ message = "Chargement…" }: { message?: string }) {
  return (
    <div role="status" aria-label={message} className="min-w-0 space-y-3">
      <span className="sr-only">{message}</span>
      <div
        aria-hidden="true"
        className="overflow-hidden rounded-xl border bg-card"
      >
        <div className="grid grid-cols-3 gap-4 border-b bg-muted/40 p-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        {["first", "second", "third", "fourth", "fifth"].map((row) => (
          <div
            key={row}
            className="grid grid-cols-3 items-center gap-4 border-b p-4 last:border-0"
          >
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
