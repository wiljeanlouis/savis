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
import type {
  BomComponentProviderName,
  BomComponentRetrievalValues,
  BomComponentType,
} from "../types";

interface BomComponentRetrieveDialogProps {
  isRetrieving: boolean;
  onRetrieve: (values: BomComponentRetrievalValues) => Promise<boolean>;
}

const initialValues: BomComponentRetrievalValues = {
  searchTerm: "",
  type: "FOOD",
  provider: "Maxi",
  url: "",
};

export const BomComponentRetrieveDialog = ({
  isRetrieving,
  onRetrieve,
}: BomComponentRetrieveDialogProps) => {
  const [open, setOpen] = useState(false);
  const [values, setValues] =
    useState<BomComponentRetrievalValues>(initialValues);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen && !isRetrieving) {
      setValues(initialValues);
    }
  };

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (await onRetrieve(values)) {
      setValues(initialValues);
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
              Indiquez une offre précise à récupérer depuis le site du
              fournisseur.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="bom-component-retrieve-type">Type</Label>
              <Select
                value={values.type}
                onValueChange={(value) =>
                  setValues((current) => ({
                    ...current,
                    type: value as BomComponentType,
                  }))
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
                    <SelectItem value="MATERIAL">Matériel</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bom-component-retrieve-provider">
                Fournisseur
              </Label>
              <Select
                value={values.provider}
                onValueChange={(value) =>
                  setValues((current) => ({
                    ...current,
                    provider: value as BomComponentProviderName,
                  }))
                }
              >
                <SelectTrigger
                  id="bom-component-retrieve-provider"
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="Maxi">Maxi</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bom-component-retrieve-name">
                Nom du composant BOM
              </Label>
              <Input
                id="bom-component-retrieve-name"
                value={values.searchTerm}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    searchTerm: event.target.value.toLowerCase(),
                  }))
                }
                placeholder="Ex. farine, boîte à pâtisserie"
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bom-component-retrieve-url">URL de l'offre</Label>
              <Input
                id="bom-component-retrieve-url"
                type="url"
                value={values.url}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    url: event.target.value,
                  }))
                }
                placeholder="https://www.maxi.ca/.../p/12345"
              />
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
              disabled={
                isRetrieving || !values.searchTerm.trim() || !values.url.trim()
              }
            >
              {isRetrieving ? "Récupération..." : "Récupérer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
