import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useState } from "react";
import type { BomComponentType } from "../types";

interface BomComponentRetrieveDialogProps {
  isRetrieving: boolean;
  onRetrieve: (
    componentName: string,
    componentType: BomComponentType,
  ) => Promise<boolean>;
}

export const BomComponentRetrieveDialog = ({
  isRetrieving,
  onRetrieve,
}: BomComponentRetrieveDialogProps) => {
  const [open, setOpen] = useState(false);
  const [componentName, setComponentName] = useState("");
  const [componentType, setComponentType] = useState<BomComponentType>("FOOD");

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen && !isRetrieving) {
      setComponentName("");
      setComponentType("FOOD");
    }
  };

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (await onRetrieve(componentName, componentType)) {
      setComponentName("");
      setComponentType("FOOD");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Récupérer un composant BOM</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Récupérer un composant BOM</DialogTitle>
            <DialogDescription>
              Indiquez le composant recherché. Une tâche sera créée pour
              récupérer les offres disponibles auprès des fournisseurs.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="bom-component-retrieve-name">
                Nom du composant BOM
              </Label>
              <Input
                id="bom-component-retrieve-name"
                value={componentName}
                onChange={(event) => setComponentName(event.target.value)}
                placeholder="Ex. farine, boîte à pâtisserie"
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bom-component-retrieve-type">Type</Label>
              <Select
                value={componentType}
                onValueChange={(value) =>
                  setComponentType(value as BomComponentType)
                }
              >
                <SelectTrigger
                  id="bom-component-retrieve-type"
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="FOOD">Aliment</SelectItem>
                    <SelectItem value="DECORATION">Décoration</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isRetrieving}
              onClick={() => handleOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isRetrieving || !componentName.trim()}
            >
              {isRetrieving ? "Récupération..." : "Récupérer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
