import type { ReactNode } from "react";
import { EditorSection } from "@/shared/components/EditorSection";
export { EditorSection } from "@/shared/components/EditorSection";
import { Button } from "@/shared/ui/button";
import { FieldGroup } from "@/shared/ui/field";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function CollectionSection({
  id,
  title,
  description,
  onAdd,
  children,
}: {
  id: string;
  title: string;
  description: string;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <EditorSection
      id={id}
      title={title}
      description={description}
      action={
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={`Ajouter ${title}`}
          onClick={onAdd}
        >
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
        </Button>
      }
    >
      <FieldGroup>{children}</FieldGroup>
    </EditorSection>
  );
}
