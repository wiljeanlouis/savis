import { Image as ImageIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { cn } from "@/shared/lib/utils";

interface OrderProductImageProps {
  imageUrl?: string | null;
  productName: string;
  className?: string;
}

/**
 * Displays a product snapshot image with a neutral fallback.
 */
export function OrderProductImage({
  imageUrl,
  productName,
  className,
}: OrderProductImageProps) {
  const [failed, setFailed] = useState(false);
  const source = imageUrl?.trim();
  const classes = cn(
    "shrink-0 overflow-hidden rounded-md border bg-muted",
    className,
  );

  if (!source || failed) {
    return (
      <div
        role="img"
        aria-label={`Aucune image pour ${productName}`}
        className={cn(
          "flex items-center justify-center text-muted-foreground",
          classes,
        )}
      >
        <HugeiconsIcon icon={ImageIcon} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <img
      src={source}
      alt={productName}
      loading="lazy"
      className={cn("object-cover", classes)}
      onError={() => setFailed(true)}
    />
  );
}
