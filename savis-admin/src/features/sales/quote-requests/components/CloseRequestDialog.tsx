import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
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
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import { useSaveRequestStatus } from "../hooks/useQuoteRequests";
import type { QuoteRequest } from "../model/types";
export function CloseRequestDialog({ request }: { request: QuoteRequest }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const mutation = useSaveRequestStatus();
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!mutation.isPending) setOpen(value);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Clôturer la demande</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clôturer la demande</DialogTitle>
          <DialogDescription>
            Indiquez pourquoi cette demande ne sera plus traitée. Les devis déjà
            créés conservent leur statut.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate(
              {
                id: request.publicId,
                expectedVersion: request.version,
                status: "CLOSED",
                reason,
              },
              { onSuccess: () => setOpen(false) },
            );
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="request-close-reason">Motif de clôture</Label>
            <Textarea
              id="request-close-reason"
              required
              maxLength={2000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          {mutation.isError && (
            <ApiErrorAlert title="Clôture impossible" error={mutation.error} />
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              type="submit"
              disabled={!reason.trim() || mutation.isPending}
            >
              {mutation.isPending && <Spinner />}Confirmer la clôture
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
