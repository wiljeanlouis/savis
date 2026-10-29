import { useState } from "react";
import { useBomForm } from "../hooks/useBomForm";
import type { BomCosting } from "../types";
import { Button } from "@/shared/ui/button";
import { DraftAlert } from "@/shared/components/DraftAlert";
import { Spinner } from "@/shared/ui/spinner";
import { createUuid } from "@/shared/lib/utils";
import { BomCostAnalysis } from "./BomCostAnalysis";
import { BomEditorNavigation } from "./bom-editor/BomEditorNavigation";
import { BomInformationSection } from "./bom-editor/BomInformationSection";
import { BomProductionSection } from "./bom-editor/BomProductionSection";
import { BomComponentsSection } from "./bom-editor/BomComponentsSection";
import { BomActivitiesSection } from "./bom-editor/BomActivitiesSection";

export const BomForm = ({
  costing,
  yieldUnit,
}: {
  costing?: BomCosting | null;
  yieldUnit: string;
}) => {
  const {
    form,
    updateField,
    updateYield,
    addComponent,
    updateComponent,
    removeComponent,
    addActivity,
    updateActivity,
    removeActivity,
    submit,
    cancel,
    onDeleteDraftAlert,
    onKeepDraftAlert,
    isDraftAlertOpen,
    setIsDraftAlertOpen,
    isLoading,
  } = useBomForm();
  const [componentKeys, setComponentKeys] = useState(() =>
    form.components.map(() => createUuid()),
  );
  const [activityKeys, setActivityKeys] = useState(() =>
    form.activities.map(() => createUuid()),
  );

  const handleAddComponent = () => {
    setComponentKeys((current) => [...current, createUuid()]);
    addComponent();
  };

  const handleAddActivity = () => {
    setActivityKeys((current) => [...current, createUuid()]);
    addActivity();
  };

  const formTitle = form.id
    ? "Modifier la composition"
    : "Ajouter une composition";

  const submitForm = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    await submit();
  };

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold">{formTitle}</h1>
        <p className="text-sm text-muted-foreground">
          Définissez les informations générales, les intrants et les activités
          nécessaires à cette composition.
        </p>
      </header>
      <div className="grid items-start gap-6 xl:grid-cols-[11rem_minmax(0,1fr)]">
        <BomEditorNavigation showCost={Boolean(form.id)} />
        <form className="grid min-w-0 gap-6" onSubmit={submitForm}>
          <BomInformationSection form={form} updateField={updateField} />
          <BomProductionSection
            form={form}
            updateField={updateField}
            updateYield={updateYield}
          />
          <BomComponentsSection
            components={form.components}
            keys={componentKeys}
            addComponent={handleAddComponent}
            updateComponent={updateComponent}
            removeComponent={(index) => {
              setComponentKeys((current) =>
                current.filter((_, item) => item !== index),
              );
              removeComponent(index);
            }}
          />
          <BomActivitiesSection
            activities={form.activities}
            keys={activityKeys}
            addActivity={handleAddActivity}
            updateActivity={updateActivity}
            removeActivity={(index) => {
              setActivityKeys((current) =>
                current.filter((_, item) => item !== index),
              );
              removeActivity(index);
            }}
          />
          {form.id && (
            <BomCostAnalysis costing={costing} yieldUnit={yieldUnit} />
          )}
          <div className="sticky bottom-3 z-20 flex flex-wrap justify-end gap-2 rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                void cancel();
              }}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner /> Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
        </form>
      </div>

      <DraftAlert
        isOpen={isDraftAlertOpen}
        setIsOpen={setIsDraftAlertOpen}
        onDelete={() => {
          void onDeleteDraftAlert();
        }}
        onKeep={() => {
          void onKeepDraftAlert();
        }}
      />
    </>
  );
};
