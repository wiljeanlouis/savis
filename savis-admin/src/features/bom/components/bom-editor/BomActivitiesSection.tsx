import { EditorSection } from "@/shared/components/EditorSection";
import { FieldGroup } from "@/shared/ui/field";
import { Button } from "@/shared/ui/button";
import { ActivityInput } from "../ActivityInput";
import type { BomActivity } from "../../types";

interface Props {
  activities: BomActivity[];
  keys: string[];
  addActivity: () => void;
  updateActivity: (index: number, value: BomActivity) => void;
  removeActivity: (index: number) => void;
}

export function BomActivitiesSection({
  activities,
  keys,
  addActivity,
  updateActivity,
  removeActivity,
}: Props) {
  return (
    <EditorSection
      id="bom-activities"
      title="Activités"
      description="Les étapes et le temps nécessaires à la production."
    >
      <FieldGroup>
        {activities.map((activity: BomActivity, index: number) => (
          <ActivityInput
            key={activity.id ?? keys[index]}
            value={activity}
            onChange={(val) => {
              updateActivity(index, val);
            }}
            onRemove={() => {
              removeActivity(index);
            }}
          />
        ))}
        <Button
          type="button"
          variant="outline"
          className="w-48"
          onClick={addActivity}
        >
          Ajouter autre activité
        </Button>
      </FieldGroup>
    </EditorSection>
  );
}
