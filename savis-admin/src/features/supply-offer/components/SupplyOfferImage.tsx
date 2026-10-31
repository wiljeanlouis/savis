import { cn } from "@/shared/lib/utils";
import { ImageNotFound01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

interface SupplyOfferImageProps {
  imageUrl: string | null;
  alt: string;
  className?: string;
}

/** Displays a remote product image and falls back safely when it cannot load. */
export function SupplyOfferImage({
  imageUrl,
  alt,
  className,
}: SupplyOfferImageProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const safeUrl = safeExternalUrl(imageUrl);

  if (!safeUrl || safeUrl === failedUrl) {
    return (
      <span
        role="img"
        aria-label={`Image indisponible pour ${alt}`}
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground",
          className,
        )}
      >
        <HugeiconsIcon icon={ImageNotFound01Icon} strokeWidth={1.5} />
      </span>
    );
  }

  return (
    <img
      src={safeUrl}
      alt={alt}
      className={cn(
        "size-12 shrink-0 rounded-md border bg-muted object-cover",
        className,
      )}
      onError={() => setFailedUrl(safeUrl)}
    />
  );
}

export function safeExternalUrl(value: string | null): string | null {
  if (!value?.trim()) return null;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
