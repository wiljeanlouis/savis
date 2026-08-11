import { useState } from "react";
import type { CatalogProduct } from "@/features/catalog/types";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { OrderProductImage } from "./OrderProductImage";

interface CatalogProductDropdownProps {
  products: CatalogProduct[];
  search: string;
  isLoading: boolean;
  isError: boolean;
  onSearchChange: (value: string) => void;
  onSelect: (product: CatalogProduct) => void;
}

/**
 * Displays a server-filtered catalog product dropdown for order entry.
 */
export function CatalogProductDropdown({
  products,
  search,
  isLoading,
  isError,
  onSearchChange,
  onSelect,
}: CatalogProductDropdownProps) {
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
    onSearchChange("");
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) onSearchChange("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-64 justify-between font-normal"
        >
          <span className="truncate text-muted-foreground">
            Ajouter un produit…
          </span>
          <span aria-hidden="true">⌄</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-(--radix-popover-trigger-width) gap-2 p-2"
      >
        <Input
          autoFocus
          value={search}
          placeholder="Rechercher un produit…"
          aria-label="Rechercher un produit"
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {products.map((product) => (
            <Button
              key={product.id}
              type="button"
              variant="ghost"
              className="h-auto w-full justify-start gap-3 py-2 text-left"
              onClick={() => {
                onSelect(product);
                close();
              }}
            >
              <OrderProductImage
                imageUrl={product.imageUrl}
                productName={product.name}
                className="size-10"
              />
              <span className="min-w-0">
                <span className="block truncate">{product.name}</span>
                <span className="block truncate text-muted-foreground">
                  {product.code}
                </span>
              </span>
            </Button>
          ))}
          {isLoading && (
            <p className="px-2 py-3 text-center text-muted-foreground">
              Recherche…
            </p>
          )}
          {!isLoading && isError && (
            <p className="px-2 py-3 text-center text-destructive">
              Impossible de rechercher les produits.
            </p>
          )}
          {!isLoading && !isError && products.length === 0 && (
            <p className="px-2 py-3 text-center text-muted-foreground">
              Aucun produit trouvé.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
