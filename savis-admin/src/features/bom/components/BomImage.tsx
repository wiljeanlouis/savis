import { useState } from "react";

export function BomImage({
  src,
  name,
  large = false,
}: {
  src: string;
  name: string;
  large?: boolean;
}) {
  const [failed, setFailed] = useState<string>();
  const classes = `${large ? "size-20" : "size-10"} shrink-0 rounded-md border bg-muted object-contain`;
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
