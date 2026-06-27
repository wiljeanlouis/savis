import { Image } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface PictureFrameProps {
  imageUrl: string;
  alt?: string;
}

export const PictureFrame = ({
  imageUrl,
  alt = "image",
}: PictureFrameProps) => {
  const imageBorder =
    "bg-muted rounded-lg p-2 h-50 border-dashed border-1 border-primary/40";
  const placeHolder = (
    <div className={"flex items-center justify-center " + imageBorder}>
      <HugeiconsIcon icon={Image} strokeWidth={0.5} />
    </div>
  );
  const image = (
    <img
      className={"aspect-video object-cover " + imageBorder}
      src={imageUrl}
      alt={alt}
    />
  );

  return <div>{imageUrl ? image : placeHolder}</div>;
};
