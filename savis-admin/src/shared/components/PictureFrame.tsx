import { Image } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/shared/lib/utils";

interface PictureFrameProps {
  imageUrl: string;
  alt?: string;
}

export const PictureFrame = ({
  imageUrl,
  alt = "image",
}: PictureFrameProps) => {
  const safeImageUrl = getSafeImageUrl(imageUrl);
  const frameClassName =
    "bg-muted rounded-lg p-2 h-50 border-dashed border-1 border-primary/40 overflow-hidden";
  const placeHolder = (
    <div className={cn("flex items-center justify-center", frameClassName)}>
      <HugeiconsIcon icon={Image} strokeWidth={0.5} />
    </div>
  );
  const image = (
    <div className={frameClassName}>
      <img
        className="aspect-video h-full w-full rounded-md object-cover"
        src={safeImageUrl}
        alt={alt}
      />
    </div>
  );

  return <div>{safeImageUrl ? image : placeHolder}</div>;
};

const getSafeImageUrl = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  try {
    const url = new URL(trimmedValue);

    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    return "";
  }

  return "";
};
