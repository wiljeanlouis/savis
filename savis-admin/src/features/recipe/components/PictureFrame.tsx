import { HugeiconsIcon } from "@hugeicons/react";

import { Image } from "@hugeicons/core-free-icons";

export default function PictureFrame({ imageUrl }: { imageUrl: string }) {
    const imageBorder = "bg-muted rounded-lg p-2 h-2/5 border-dashed border-1 border-primary/40";
    const placeHolder = <div className={"flex items-center justify-center " + imageBorder}><HugeiconsIcon icon={Image} strokeWidth={0.5} /></div>;
    const image = <img className={"aspect-video object-cover " + imageBorder} src={imageUrl} alt="recipe image" />;

    return (
        <div>{imageUrl ? image : placeHolder} </div>
    );
}