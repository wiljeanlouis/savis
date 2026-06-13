import { Input } from "@/shared/ui/input";
import { useBomForm } from "../hooks/useBomForm";
import { BomComponentInput } from "./BomComponentInput";
import { ActivityInput } from "./ActivityInput";
import { Button } from "@/shared/ui/button";
import type { BomActivity, BomComponent, BomType } from "../types";
import {
  FieldGroup,
  FieldSet,
  FieldLegend,
  FieldDescription,
  Field,
  FieldLabel,
} from "@/shared/ui/field";
import { Textarea } from "@/shared/ui/textarea";
import { PictureFrame } from "./PictureFrame";
import { toast } from "sonner";
import { DraftAlert } from "../../../shared/components/DraftAlert";
import { Spinner } from "@/shared/ui/spinner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

interface BomFormProps {
  showTitle?: boolean;
}

export const BomForm = ({ showTitle = true }: BomFormProps) => {
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
    isSuccess,
    isError,
    error,
  } = useBomForm();

  const formTitle = form.id ? "Modifier le BOM" : "Ajouter un nouveau BOM";

  if (isSuccess) {
    toast.success("BOM sauvegardé avec succès !");
  }

  if (isError) {
    const errorResponse = error as unknown as {
      response: { data?: { detail?: string } };
    };
    toast.error("Une erreur est survenue lors de la sauvegarde du BOM.", {
      description: errorResponse.response?.data?.detail,
    });
  }

  const submitForm = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    await submit();
  };

  return (
    <>
      {showTitle && <h1 className="text-2xl font-semibold">{formTitle}</h1>}

      <form onSubmit={submitForm}>
        <FieldGroup>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-10 lg:col-span-2">
              <FieldSet>
                <FieldGroup>
                  <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,2fr)_minmax(12rem,1fr)]">
                    <Field>
                      <FieldLabel htmlFor="bom-form-name">Nom</FieldLabel>
                      <Input
                        id="bom-form-name"
                        placeholder="Boeuf bourgignon, Arche de ballons, Sac d'emballage 10'', etc"
                        value={form.name}
                        onChange={(e) => {
                          updateField("name", e.target.value);
                        }}
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="bom-form-type">
                        Type de BOM
                      </FieldLabel>
                      <Select
                        value={form.type}
                        onValueChange={(value) => {
                          updateField("type", value as BomType);
                        }}
                      >
                        <SelectTrigger id="bom-form-type" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="FOOD">Aliment</SelectItem>
                            <SelectItem value="MATERIAL">Matériel</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="bom-form-description">
                      Description
                    </FieldLabel>
                    <Input
                      id="bom-form-description"
                      placeholder="Une recette à base de viande de boeuf, Un arche fait de ballon de taille 8'', Sac d'emballage 10'' "
                      value={form.description}
                      onChange={(e) => {
                        updateField("description", e.target.value);
                      }}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="bom-form-image-url">Image</FieldLabel>
                    <Input
                      id="bom-form-image-url"
                      placeholder="https://..."
                      value={form.imageUrl}
                      onChange={(e) => {
                        updateField("imageUrl", e.target.value);
                      }}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="bom-form-instructions">
                      Instructions
                    </FieldLabel>
                    <Textarea
                      id="bom-form-instructions"
                      placeholder="Add any instructions"
                      className="resize-none"
                      value={form.instructions}
                      onChange={(e) => {
                        updateField("instructions", e.target.value);
                      }}
                    />
                  </Field>

                  <FieldGroup className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="bom-form-yield-quantity">
                        Rendement
                      </FieldLabel>
                      <Input
                        id="bom-form-yield-quantity"
                        placeholder="12"
                        type="number"
                        min={0}
                        value={form.yield.quantity}
                        onChange={(e) => {
                          updateYield("quantity", Number(e.target.value));
                        }}
                        required
                      />
                      <FieldDescription>quantité produite</FieldDescription>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="bom-form-yield-unit">
                        Unité de rendement
                      </FieldLabel>
                      <Select
                        value={form.yield.unit}
                        onValueChange={(value) => {
                          updateYield("unit", value);
                        }}
                      >
                        <SelectTrigger id="bom-form-yield-unit">
                          <SelectValue placeholder="Unité" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="portion">portion</SelectItem>
                            <SelectItem value="piece">pièce</SelectItem>
                            <SelectItem value="g">g</SelectItem>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="l">L</SelectItem>
                            <SelectItem value="ml">mL</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FieldDescription>portion par défaut</FieldDescription>
                    </Field>
                  </FieldGroup>
                </FieldGroup>
              </FieldSet>

              <FieldSet>
                <FieldLegend>Composants BOM</FieldLegend>
                <FieldDescription>
                  La liste des composants BOM nécessaires à ce BOM.
                </FieldDescription>
                <FieldGroup>
                  {form.components.map(
                    (component: BomComponent, index: number) => (
                      <BomComponentInput
                        key={index}
                        value={component}
                        onChange={(val) => {
                          updateComponent(index, val);
                        }}
                        onRemove={() => {
                          removeComponent(index);
                        }}
                      />
                    ),
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-48"
                    onClick={addComponent}
                  >
                    Ajouter un composant BOM
                  </Button>
                </FieldGroup>
              </FieldSet>

              <FieldSet>
                <FieldLegend>Activités</FieldLegend>
                <FieldDescription>
                  Les étapes et le temps nécessaires à la production de la BOM.
                </FieldDescription>
                <FieldGroup>
                  {form.activities.map(
                    (activity: BomActivity, index: number) => (
                      <ActivityInput
                        key={index}
                        value={activity}
                        canRemove={index > 1}
                        onChange={(val) => {
                          updateActivity(index, val);
                        }}
                        onRemove={() => {
                          removeActivity(index);
                        }}
                      />
                    ),
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-48"
                    onClick={addActivity}
                  >
                    Ajouter autre activité
                  </Button>
                </FieldGroup>
              </FieldSet>

              <Field orientation="horizontal">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Spinner /> : "Sauvegarder"}
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    void cancel();
                  }}
                >
                  Annuler
                </Button>
              </Field>
            </div>

            <PictureFrame imageUrl={form.imageUrl} />
          </div>
        </FieldGroup>
      </form>

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
