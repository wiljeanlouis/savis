import { useState } from "react";
import { useQuotationEditor } from "@/features/sales/quotations/hooks/useQuotationEditor";
import { PreparationNeeds } from "./PreparationNeeds";
import { QualificationProducts } from "./QualificationProducts";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Spinner } from "@/shared/ui/spinner";
import { parseOriginalRequest, needLabel } from "../model/originalRequest";
import { Textarea } from "@/shared/ui/textarea";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import { useSaveQualification } from "../hooks/useQuoteRequests";
import {
  effectiveQualification,
  type QuoteRequest,
  type Qualification,
} from "../model/types";
import { emptyQuotationDraft } from "@/features/sales/quotations/model/quotationDraft";

export function QualificationForm({
  request,
  onCancel,
  onSaved,
}: {
  request: QuoteRequest;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const editor = useQuotationEditor({ editable: request.status !== "CLOSED" });
  const [initialized, setInitialized] = useState(false);
  const [expectedVersion] = useState(request.version);
  const [notes, setNotes] = useState(
    () => effectiveQualification(request)?.internalNotes ?? "",
  );
  const [coverage, setCoverage] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(
      (effectiveQualification(request)?.lines ?? []).map((l) => [
        l.id,
        l.needKeys,
      ]),
    ),
  );
  const [exclusions, setExclusions] = useState(
    () => effectiveQualification(request)?.exclusions ?? {},
  );
  const save = useSaveQualification();
  const original = parseOriginalRequest(request.originalPayload);
  if (!initialized) {
    setInitialized(true);
    const draft = emptyQuotationDraft();
    const q = effectiveQualification(request);
    draft.commercial.customerName = q?.customerName ?? request.customerName;
    draft.commercial.customerPhone = q?.customerPhone ?? request.customerPhone;
    draft.commercial.customerEmail =
      q?.customerEmail ?? request.customerEmail ?? "";
    draft.commercial.items = (q?.lines ?? []).map((l) => ({
      key: l.id,
      productId: l.productId,
      quantity: l.quantity,
      purchaseModeCode: l.purchaseModeCode ?? "",
      choiceCode: l.choiceCode ?? "",
      allocations: Object.fromEntries(
        l.allocations.map((v) => [v.choiceCode, v.quantity]),
      ),
      ingredients: Object.fromEntries(
        l.ingredients.map((v) => [v.ingredientCode, v.quantity]),
      ),
    }));
    editor.setDraft(draft);
  }
  if (request.status === "CLOSED")
    return <p>Demande clôturée : {request.closedReason}</p>;
  function submit() {
    const c = editor.draft.commercial;
    const qualification: Qualification = {
      customerName: c.customerName,
      customerPhone: c.customerPhone,
      customerEmail: c.customerEmail || null,
      internalNotes: notes,
      lines: c.items.map((l) => ({
        id: l.key,
        productId: l.productId,
        quantity: l.quantity,
        purchaseModeCode: l.purchaseModeCode ?? "",
        choiceCode: l.choiceCode ?? "",
        allocations: Object.entries(l.allocations).map(
          ([choiceCode, quantity]) => ({ choiceCode, quantity }),
        ),
        ingredients: Object.entries(l.ingredients).map(
          ([ingredientCode, quantity]) => ({ ingredientCode, quantity }),
        ),
        needKeys: coverage[l.key] ?? [],
      })),
      exclusions: Object.fromEntries(
        Object.entries(exclusions).filter(([, v]) => v.trim()),
      ),
    };
    save.mutate(
      {
        id: request.publicId,
        expectedVersion,
        qualification,
      },
      { onSuccess: onSaved },
    );
  }
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            Préparation de la soumission
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Complétez les coordonnées et les produits à retenir pour vos
            propositions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={save.isPending}
            onClick={onCancel}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending && <Spinner />}Enregistrer les modifications
          </Button>
        </div>
      </div>
      <PreparationNeeds
        request={request}
        onUseSelection={(line) => {
          if (
            editor.draft.commercial.items.some((item) => item.key === line.id)
          )
            return;
          editor.setCommercial({
            ...editor.draft.commercial,
            items: [
              ...editor.draft.commercial.items,
              {
                key: line.id,
                productId: line.productId,
                quantity: line.quantity,
                purchaseModeCode: line.purchaseModeCode ?? "",
                choiceCode: line.choiceCode ?? "",
                allocations: Object.fromEntries(
                  line.allocations.map((value) => [
                    value.choiceCode,
                    value.quantity,
                  ]),
                ),
                ingredients: Object.fromEntries(
                  line.ingredients.map((value) => [
                    value.ingredientCode,
                    value.quantity,
                  ]),
                ),
              },
            ],
          });
          setCoverage((old) => ({ ...old, [line.id]: line.needKeys }));
        }}
      />
      <QualificationProducts editor={editor} />
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Traitement des besoins</CardTitle>
          <p className="text-muted-foreground">
            Les articles reconnus sont déjà associés. Les autres besoins peuvent
            rester non inclus, ou être explicitement exclus avec un motif.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {request.needKeys.map((need) => (
            <fieldset className="space-y-3 rounded-lg border p-4" key={need}>
              <legend className="px-1 text-sm font-medium">
                {needLabel(need, original)}
              </legend>
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {editor.draft.commercial.items.map((line, index) => (
                  <Label className="flex items-center gap-2" key={line.key}>
                    <Checkbox
                      checked={(coverage[line.key] ?? []).includes(need)}
                      onCheckedChange={(checked) => {
                        setCoverage((old) => ({
                          ...old,
                          [line.key]:
                            checked === true
                              ? [...(old[line.key] ?? []), need]
                              : (old[line.key] ?? []).filter((n) => n !== need),
                        }));
                        if (checked === true)
                          setExclusions((old) => ({ ...old, [need]: "" }));
                      }}
                    />
                    {editor.products.find((p) => p.id === line.productId)
                      ?.name ?? `Produit ${index + 1}`}
                  </Label>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`exclude-${need}`}>Motif d’exclusion</Label>
                <Input
                  id={`exclude-${need}`}
                  placeholder="Exclusion explicite uniquement"
                  value={exclusions[need] ?? ""}
                  onChange={(e) =>
                    setExclusions((old) => ({ ...old, [need]: e.target.value }))
                  }
                />
              </div>
            </fieldset>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Notes internes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="qualification-notes">
            Informations utiles au traitement
          </Label>
          <Textarea
            id="qualification-notes"
            placeholder="Précisions et décisions internes, non transmises au client"
            value={notes}
            maxLength={10000}
            onChange={(e) => setNotes(e.target.value)}
          />
        </CardContent>
      </Card>
      {save.isError && (
        <ApiErrorAlert title="Qualification non enregistrée" error={save.error}>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Recharger la demande
          </Button>
        </ApiErrorAlert>
      )}
    </form>
  );
}
