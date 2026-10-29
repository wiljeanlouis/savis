import { useState } from "react";
import { cn } from "@/shared/lib/utils";
export function CatalogProductImage({
  src,
  name,
  className,
}: {
  src: string;
  name: string;
  className?: string;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const classes = cn(
    "shrink-0 rounded-md border bg-muted object-cover",
    className,
  );
  return src && failedSource !== src ? (
    <img
      src={src}
      alt={name}
      loading="lazy"
      className={classes}
      onError={() => setFailedSource(src)}
    />
  ) : (
    <span
      role="img"
      aria-label={`Aucune image pour ${name}`}
      className={cn(
        classes,
        "flex items-center justify-center text-xs text-muted-foreground",
      )}
    >
      —
    </span>
  );
}
