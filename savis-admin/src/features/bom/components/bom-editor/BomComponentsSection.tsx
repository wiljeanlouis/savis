import { EditorSection } from "@/shared/components/EditorSection";
import { FieldGroup } from "@/shared/ui/field";
import { Button } from "@/shared/ui/button";
import { BomComponentInput } from "../BomComponentInput";
import type { BomComponent } from "../../types";

interface Props {
  components: BomComponent[];
  keys: string[];
  addComponent: () => void;
  updateComponent: (index: number, value: BomComponent) => void;
  removeComponent: (index: number) => void;
}

export function BomComponentsSection({
  components,
  keys,
  addComponent,
  updateComponent,
  removeComponent,
}: Props) {
  return (
    <EditorSection
      id="bom-components"
      title="Ressources"
      description="La liste des ressources nécessaires à cette composition."
    >
      <FieldGroup>
        {components.map((component: BomComponent, index: number) => (
          <BomComponentInput
            key={keys[index]}
            value={component}
            onChange={(val) => {
              updateComponent(index, val);
            }}
            onRemove={() => {
              removeComponent(index);
            }}
          />
        ))}
        <Button
          type="button"
          variant="outline"
          className="w-48"
          onClick={addComponent}
        >
          Ajouter une ressource
        </Button>
      </FieldGroup>
    </EditorSection>
  );
}
