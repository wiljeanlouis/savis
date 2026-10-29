import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Button } from "@/shared/ui/button";
import { DeleteAlert } from "@/shared/components/DeleteAlert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  catalogListReturnTo,
  catalogProductWorkspaceLink,
} from "../model/catalogProductNavigation";
import type { CatalogProduct } from "../types";
export function CatalogProductDetailActions({
  product,
  publishing,
  onPublish,
  onUnpublish,
  onDelete,
}: {
  product: CatalogProduct;
  publishing: boolean;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
}) {
  const location = useLocation();
  const returnTo = catalogListReturnTo(location.search, product.id!);
  const [deleting, setDeleting] = useState(false);
  return (
    <footer
      aria-label="Actions du produit"
      className="flex shrink-0 flex-wrap items-center gap-2 border-t bg-card px-4 py-3"
    >
      <Button variant="outline" asChild>
        <Link to={catalogProductWorkspaceLink(product.id!, "edit", returnTo)}>
          Modifier
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link
          to={catalogProductWorkspaceLink(product.id!, "analysis", returnTo)}
        >
          Analyser
        </Link>
      </Button>
      <Button disabled={publishing} onClick={onPublish}>
        {product.published ? "Republier" : "Publier"}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {product.published && (
            <DropdownMenuItem
              disabled={publishing}
              variant="destructive"
              onSelect={onUnpublish}
            >
              Retirer de SavouretPlus
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDeleting(true)}
          >
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteAlert
        item={product.name}
        open={deleting}
        onOpenChange={setDeleting}
        hideTrigger
        onDelete={onDelete}
      />
    </footer>
  );
}
