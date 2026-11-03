import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/alert";
import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Checkbox } from "@/shared/ui/checkbox";
import { Spinner } from "@/shared/ui/spinner";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import { dollarsToSafeCents } from "@/shared/lib/money";
import { useCreateProposal } from "../hooks/useQuoteRequests";
import { parseOriginalRequest, needLabel } from "../model/originalRequest";
import { effectiveQualification, type QuoteRequest } from "../model/types";
import type { ProposalCommand } from "../api/quoteRequestApi";
export function ProposalForm({ request }: { request: QuoteRequest }) {
  const mutation = useCreateProposal();
  const [open, setOpen] = useState(false);
  const [expectedVersion, setExpectedVersion] = useState(request.version);
  const [selected, setSelected] = useState(
    () => effectiveQualification(request)?.lines.map((l) => l.id) ?? [],
  );
  const [exclusions, setExclusions] = useState(
    () => effectiveQualification(request)?.exclusions ?? {},
  );
  const [validUntil, setValidUntil] = useState("");
  const [note, setNote] = useState("");
  const [discount, setDiscount] = useState(0),
    [delivery, setDelivery] = useState(0);
  const [intention, setIntention] = useState<ProposalCommand | null>(null);
  const lines = effectiveQualification(request)?.lines ?? [];
  const original = parseOriginalRequest(request.originalPayload);
  const covered = new Set(
    lines.filter((l) => selected.includes(l.id)).flatMap((l) => l.needKeys),
  );
  const missing = request.needKeys.filter((n) => !covered.has(n));
  if (!effectiveQualification(request))
    return (
      <p className="text-muted-foreground">
        Préparez au moins une ligne pour créer une soumission.
      </p>
    );
  function submit() {
    const command = intention ?? {
      proposalRequestId: crypto.randomUUID(),
      expectedVersion,
      lineIds: selected,
      exclusions: Object.fromEntries(
        missing
          .filter((n) => exclusions[n]?.trim())
          .map((n) => [n, exclusions[n]]),
      ),
      validUntil,
      note: note || null,
      discountCents: dollarsToSafeCents(discount),
      deliveryFeeCents: dollarsToSafeCents(delivery),
    };
    setIntention(command);
    mutation.mutate({ id: request.publicId, command });
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!mutation.isPending) {
          if (value && !intention) {
            setExpectedVersion(request.version);
            setSelected(
              effectiveQualification(request)?.lines.map((line) => line.id) ??
                [],
            );
            setExclusions(effectiveQualification(request)?.exclusions ?? {});
          }
          setOpen(value);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          Créer une soumission
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Créer une soumission</DialogTitle>
          <DialogDescription>
            Choisissez les produits retenus et les conditions de cette
            proposition. Les prix seront calculés depuis le catalogue.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <fieldset
            disabled={!!intention || mutation.isPending}
            className="space-y-4"
          >
            <legend className="mb-3 font-medium">Produits retenus</legend>
            <div className="space-y-2">
              {lines.map((line, index) => (
                <Label
                  className="flex items-start gap-3 rounded-lg border p-3"
                  key={line.id}
                >
                  <Checkbox
                    checked={selected.includes(line.id)}
                    onCheckedChange={(checked) =>
                      setSelected((old) =>
                        checked === true
                          ? [...old, line.id]
                          : old.filter((id) => id !== line.id),
                      )
                    }
                  />
                  <span>
                    <span className="block font-medium">
                      Ligne {index + 1} · quantité {line.quantity}
                    </span>
                    <span className="mt-1 block text-muted-foreground">
                      {line.needKeys
                        .map((key) => needLabel(key, original))
                        .join(", ")}
                    </span>
                  </span>
                </Label>
              ))}
            </div>
            {missing.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Les besoins non inclus restent ouverts pour une autre
                proposition. Un motif est requis uniquement pour une exclusion
                explicite.
              </p>
            )}
            {missing.map((key) => (
              <div className="space-y-2" key={key}>
                <Label htmlFor={`proposal-exclude-${key}`}>
                  Exclusion explicite (facultative) : {needLabel(key, original)}
                </Label>
                <Input
                  id={`proposal-exclude-${key}`}
                  value={exclusions[key] ?? ""}
                  onChange={(e) =>
                    setExclusions((old) => ({ ...old, [key]: e.target.value }))
                  }
                />
              </div>
            ))}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="proposal-valid-until">Date de validité</Label>
                <Input
                  id="proposal-valid-until"
                  type="date"
                  required
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proposal-discount">Rabais ($)</Label>
                <Input
                  id="proposal-discount"
                  type="number"
                  min={0}
                  max={21474836.47}
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proposal-delivery">
                  Frais de livraison ($)
                </Label>
                <Input
                  id="proposal-delivery"
                  type="number"
                  min={0}
                  max={21474836.47}
                  step="0.01"
                  value={delivery}
                  onChange={(e) => setDelivery(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="proposal-note">Note destinée au client</Label>
              <Textarea
                id="proposal-note"
                value={note}
                maxLength={10000}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </fieldset>
          {mutation.isError && (
            <ApiErrorAlert
              title="Création non confirmée"
              error={mutation.error}
            >
              <p>
                Réessayez la même proposition pour éviter un doublon après une
                interruption réseau.
              </p>
            </ApiErrorAlert>
          )}
          {mutation.data && (
            <Alert>
              <AlertTitle>Soumission créée</AlertTitle>
              <AlertDescription>
                <Link
                  className="font-medium text-primary hover:underline"
                  to={`/quotations/${mutation.data.id}`}
                >
                  {mutation.data.quotationNumber}
                </Link>
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => setOpen(false)}
            >
              Fermer
            </Button>
            {intention && (
              <Button
                type="button"
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => {
                  setIntention(null);
                  setExpectedVersion(request.version);
                  setSelected(
                    effectiveQualification(request)?.lines.map((l) => l.id) ??
                      [],
                  );
                  setExclusions(
                    effectiveQualification(request)?.exclusions ?? {},
                  );
                  mutation.reset();
                }}
              >
                Créer une autre soumission
              </Button>
            )}
            {!mutation.data && (
              <Button
                type="submit"
                disabled={
                  mutation.isPending || !validUntil || selected.length === 0
                }
              >
                {mutation.isPending && <Spinner />}
                {intention
                  ? "Réessayer la même proposition"
                  : "Confirmer la création"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
