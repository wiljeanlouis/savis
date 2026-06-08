import { Input } from "@/shared/ui/input";
import { useRecipeForm } from "../hooks/useRecipeForm";
import { IngredientInput } from "./IngredientInput";
import { ActivityInput } from "./ActivityInput";
import { Button } from "@/shared/ui/button";
import type { RecipeActivity, RecipeComponent } from "../types";
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

export const RecipeForm = () => {
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
  } = useRecipeForm();

  const formTitle = form.id
    ? "Modifier la recette"
    : "Ajouter une nouvelle recette";

  if (isSuccess) {
    toast.success("Recette sauvegardée avec succès !");
  }

  if (isError) {
    const errorResponse = error as unknown as {
      response: { data?: { detail?: string } };
    };
    toast.error(
      "Une erreur est survenue lors de la sauvegarde de la recette.",
      {
        description: errorResponse.response?.data?.detail,
      },
    );
  }

  const submitForm = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    await submit();
  };

  return (
    <>
      <h1 className="text-2xl font-semibold">{formTitle}</h1>

      <form onSubmit={submitForm}>
        <FieldGroup>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-10 col-span-2">
              <FieldSet>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="recipe-form-name">Nom</FieldLabel>
                    <Input
                      id="recipe-form-name"
                      placeholder="Boeuf bourgignon"
                      value={form.name}
                      onChange={(e) => {
                        updateField("name", e.target.value);
                      }}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="recipe-form-description">
                      Description
                    </FieldLabel>
                    <Input
                      id="recipe-form-description"
                      placeholder="Une recette faite de viande de boeuf"
                      value={form.description}
                      onChange={(e) => {
                        updateField("description", e.target.value);
                      }}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="recipe-form-image-url">
                      Image
                    </FieldLabel>
                    <Input
                      id="recipe-form-image-url"
                      placeholder="https://..."
                      value={form.imageUrl}
                      onChange={(e) => {
                        updateField("imageUrl", e.target.value);
                      }}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="recipe-form-instructions">
                      Instructions
                    </FieldLabel>
                    <Textarea
                      id="recipe-form-instructions"
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
                      <FieldLabel htmlFor="recipe-form-yield-quantity">
                        Rendement
                      </FieldLabel>
                      <Input
                        id="recipe-form-yield-quantity"
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
                      <FieldLabel htmlFor="recipe-form-yield-unit">
                        Unité de rendement
                      </FieldLabel>
                      <Select
                        value={form.yield.unit}
                        onValueChange={(value) => {
                          updateYield("unit", value);
                        }}
                      >
                        <SelectTrigger id="recipe-form-yield-unit">
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
                <FieldLegend>Ingrédients</FieldLegend>
                <FieldDescription>
                  La liste des ingrédients de la recette.
                </FieldDescription>
                <FieldGroup>
                  {form.components.map(
                    (component: RecipeComponent, index: number) => (
                      <IngredientInput
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
                    className="w-32"
                    onClick={addComponent}
                  >
                    Ajouter Ingrédient
                  </Button>
                </FieldGroup>
              </FieldSet>

              <FieldSet>
                <FieldLegend>Activités</FieldLegend>
                <FieldDescription>
                  Les étapes et le temps nécessaires à la production de la
                  recette.
                </FieldDescription>
                <FieldGroup>
                  {form.activities.map(
                    (activity: RecipeActivity, index: number) => (
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
