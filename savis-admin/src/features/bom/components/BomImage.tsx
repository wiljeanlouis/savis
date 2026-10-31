import { useState } from "react";
import { cn } from "@/shared/lib/utils";

export function BomImage({
  src,
  name,
  large = false,
  className,
}: {
  src: string;
  name: string;
  large?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState<string>();
  const classes = cn(
    large ? "size-16" : "size-10",
    "shrink-0 rounded-md border bg-muted object-contain",
    className,
  );
  return src && failed !== src ? (
    <img
      src={src}
      alt={name}
      loading="lazy"
      className={classes}
      onError={() => setFailed(src)}
    />
  ) : (
    <span
      role="img"
      aria-label={`Aucune image pour ${name}`}
      className={`${classes} flex items-center justify-center text-muted-foreground`}
    >
      —
    </span>
  );
}
