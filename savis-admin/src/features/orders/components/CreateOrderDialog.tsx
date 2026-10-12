import { useState, type FormEvent, type ReactNode } from "react";
import type { CatalogProduct } from "@/features/catalog/types";
import { useCatalogProductSearch } from "@/features/catalog/hooks/useCatalogApi";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import type { CreateOrderRequest } from "../types";
import { formatOrderCurrency } from "../types";
import {
  activeChoices,
  activeModes,
  buildCreateOrderRequest,
  changePurchaseMode,
  createAdminOrderItem,
  emptyAdminOrderDraft,
  estimateOrderTotalCents,
  estimateOrderSubtotalCents,
  selectedMode,
  type AdminOrderDraft,
  type AdminOrderItemDraft,
} from "../model/adminOrderDraft";
import { CatalogProductDropdown } from "./CatalogProductDropdown";
import { OrderProductImage } from "./OrderProductImage";

interface CreateOrderDialogProps {
  isCreating: boolean;
  onCreate: (request: CreateOrderRequest) => Promise<boolean>;
}

export function CreateOrderDialog({
  isCreating,
  onCreate,
}: CreateOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<AdminOrderDraft>(emptyAdminOrderDraft);
  const [error, setError] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<CatalogProduct[]>(
    [],
  );
  const productsQuery = useCatalogProductSearch(productSearch, open);
  const searchResults = (productsQuery.data ?? []).filter(
    (product) =>
      product.available &&
      product.id &&
      activeModes(product).length > 0 &&
      matchesProductSearch(product, productSearch),
  );
  const products = mergeProducts(selectedProducts, searchResults);

  function changeOpen(next: boolean) {
    setOpen(next);
    if (!next) {
      setDraft(emptyAdminOrderDraft());
      setError(null);
      setProductSearch("");
      setSelectedProducts([]);
    }
  }

  function addProduct(product: CatalogProduct) {
    try {
      setDraft((current) => ({
        ...current,
        items: [...current.items, createAdminOrderItem(product)],
      }));
      setSelectedProducts((current) => mergeProducts(current, [product]));
      setError(null);
    } catch (cause) {
      setError(message(cause));
    }
  }

  function patchItem(key: string, patch: Partial<AdminOrderItemDraft>) {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.key === key ? { ...item, ...patch } : item,
      ),
    }));
  }

  function removeItem(key: string) {
    setDraft((current) => ({
      ...current,
      items: current.items.filter((item) => item.key !== key),
    }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const request = buildCreateOrderRequest(draft, products);
      setError(null);
      if (await onCreate(request)) changeOpen(false);
    } catch (cause) {
      setError(message(cause));
    }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          Nouvelle commande
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Nouvelle commande</DialogTitle>
          <DialogDescription>
            Saisissez le client et sélectionnez les produits du catalogue. Les
            prix seront validés à nouveau par le serveur.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={(event) => void submit(event)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom du client">
              <Input
                required
                value={draft.customerName}
                onChange={(event) =>
                  setDraft({ ...draft, customerName: event.target.value })
                }
              />
            </Field>
            <Field label="Téléphone">
              <Input
                required
                value={draft.customerPhone}
                onChange={(event) =>
                  setDraft({ ...draft, customerPhone: event.target.value })
                }
              />
            </Field>
            <Field label="Courriel">
              <Input
                type="email"
                value={draft.customerEmail}
                onChange={(event) =>
                  setDraft({ ...draft, customerEmail: event.target.value })
                }
              />
            </Field>
            <Field label="Note">
              <Textarea
                value={draft.note}
                onChange={(event) =>
                  setDraft({ ...draft, note: event.target.value })
                }
              />
            </Field>
          </div>

          <section className="space-y-3 rounded-lg border p-4">
            <div>
              <h3 className="font-medium">Adresse du client</h3>
              <p className="text-muted-foreground">
                Facultative; elle apparaîtra sur la facture et la soumission.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Adresse">
                <Input
                  value={draft.customerAddress.line1}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      customerAddress: {
                        ...draft.customerAddress,
                        line1: event.target.value,
                      },
                    })
                  }
                />
              </Field>
              <Field label="Appartement, bureau, etc.">
                <Input
                  value={draft.customerAddress.line2}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      customerAddress: {
                        ...draft.customerAddress,
                        line2: event.target.value,
                      },
                    })
                  }
                />
              </Field>
              <Field label="Ville">
                <Input
                  value={draft.customerAddress.city}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      customerAddress: {
                        ...draft.customerAddress,
                        city: event.target.value,
                      },
                    })
                  }
                />
              </Field>
              <Field label="Province">
                <Input
                  value={draft.customerAddress.province}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      customerAddress: {
                        ...draft.customerAddress,
                        province: event.target.value,
                      },
                    })
                  }
                />
              </Field>
              <Field label="Code postal">
                <Input
                  value={draft.customerAddress.postalCode}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      customerAddress: {
                        ...draft.customerAddress,
                        postalCode: event.target.value,
                      },
                    })
                  }
                />
              </Field>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-medium">Produits</h3>
                <p className="text-muted-foreground">
                  Une ligne représente une configuration de produit.
                </p>
              </div>
              <CatalogProductDropdown
                products={searchResults}
                search={productSearch}
                isLoading={productsQuery.isPending || productsQuery.isFetching}
                isError={productsQuery.isError}
                onSearchChange={setProductSearch}
                onSelect={addProduct}
              />
            </div>

            {draft.items.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                Aucun produit ajouté.
              </div>
            ) : (
              draft.items.map((item) => {
                const product = products.find(
                  (value) => value.id === item.productId,
                );
                return product ? (
                  <OrderItemEditor
                    key={item.key}
                    item={item}
                    product={product}
                    onChange={(patch) => patchItem(item.key, patch)}
                    onRemove={() => removeItem(item.key)}
                  />
                ) : null;
              })
            )}
          </section>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive">
              {error}
            </p>
          )}

          <div className="grid gap-4 rounded-lg bg-muted/50 p-4 sm:grid-cols-2">
            <Field label="Rabais">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={draft.discountCents / 100}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    discountCents: cents(Number(event.target.value)),
                  })
                }
              />
            </Field>
            <Field label="Frais de livraison">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={draft.deliveryFeeCents / 100}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    deliveryFeeCents: cents(Number(event.target.value)),
                  })
                }
              />
            </Field>
            <dl className="space-y-1 sm:col-span-2 sm:ml-auto sm:min-w-72">
              <MoneyRow
                label="Sous-total"
                cents={estimateOrderSubtotalCents(draft, products)}
              />
              {draft.discountCents > 0 ? (
                <MoneyRow label="Rabais" cents={-draft.discountCents} />
              ) : null}
              {draft.deliveryFeeCents > 0 ? (
                <MoneyRow label="Livraison" cents={draft.deliveryFeeCents} />
              ) : null}
              <MoneyRow
                label="Total estimé"
                cents={estimateOrderTotalCents(draft, products)}
                emphasized
              />
            </dl>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isCreating}
              onClick={() => changeOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Création…" : "Créer la commande"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function OrderItemEditor({
  item,
  product,
  onChange,
  onRemove,
}: {
  item: AdminOrderItemDraft;
  product: CatalogProduct;
  onChange: (patch: Partial<AdminOrderItemDraft>) => void;
  onRemove: () => void;
}) {
  const modes = activeModes(product);
  const choices = activeChoices(product);
  const mode = selectedMode(product, item);

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <OrderProductImage
            imageUrl={product.imageUrl}
            productName={product.name}
            className="size-14"
          />
          <div className="min-w-0">
            <h4 className="truncate font-medium">{product.name}</h4>
            <p className="truncate text-muted-foreground">{product.code}</p>
          </div>
        </div>
        <Button type="button" size="icon-sm" variant="ghost" onClick={onRemove}>
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
          <span className="sr-only">Retirer {product.name}</span>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Mode d’achat">
          <Select
            value={item.purchaseModeCode}
            onValueChange={(code) =>
              onChange(changePurchaseMode(item, product, code))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {modes.map((value) => (
                <SelectItem key={value.code} value={value.code}>
                  {value.label} —{" "}
                  {formatOrderCurrency(cents(value.price.amount))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Quantité commandée">
          <Input
            type="number"
            min={1}
            value={item.quantity}
            onChange={(event) =>
              onChange({ quantity: Number(event.target.value) })
            }
          />
        </Field>
      </div>

      {mode?.allocationType === "SINGLE_CHOICE" && choices.length > 0 && (
        <Field label={product.choiceGroup?.label ?? "Choix"}>
          <Select
            value={item.choiceCode}
            onValueChange={(choiceCode) => onChange({ choiceCode })}
          >
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder="Sélectionner…" />
            </SelectTrigger>
            <SelectContent>
              {choices.map((choice) => (
                <SelectItem key={choice.code} value={choice.code}>
                  {choice.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}

      {mode?.allocationType === "CHOICE_ALLOCATION" && (
        <div className="space-y-2">
          <Label>Répartition ({mode.quantity} au total)</Label>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {choices.map((choice) => (
              <Field key={choice.code} label={choice.name}>
                <Input
                  type="number"
                  min={0}
                  max={mode.quantity}
                  value={item.allocations[choice.code] ?? 0}
                  onChange={(event) =>
                    onChange({
                      allocations: {
                        ...item.allocations,
                        [choice.code]: Number(event.target.value),
                      },
                    })
                  }
                />
              </Field>
            ))}
          </div>
        </div>
      )}

      {product.ingredientOptions.some((option) => option.active) && (
        <div className="space-y-2">
          <Label>Ingrédients et extras</Label>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {product.ingredientOptions
              .filter((option) => option.active)
              .map((option) => (
                <Field
                  key={option.code}
                  label={`${option.name} (${option.minQuantity}–${option.maxQuantity})`}
                >
                  <Input
                    type="number"
                    min={option.minQuantity}
                    max={option.maxQuantity}
                    value={
                      item.ingredients[option.code] ?? option.defaultQuantity
                    }
                    onChange={(event) =>
                      onChange({
                        ingredients: {
                          ...item.ingredients,
                          [option.code]: Number(event.target.value),
                        },
                      })
                    }
                  />
                </Field>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function MoneyRow({
  label,
  cents,
  emphasized = false,
}: {
  label: string;
  cents: number;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <dt className={emphasized ? "font-semibold" : "text-muted-foreground"}>
        {label}
      </dt>
      <dd className={emphasized ? "text-base font-semibold" : "font-medium"}>
        {formatOrderCurrency(cents)}
      </dd>
    </div>
  );
}

function cents(amount: number) {
  return Math.round(amount * 100);
}

function message(cause: unknown) {
  return cause instanceof Error ? cause.message : "La commande est invalide.";
}

function mergeProducts(
  existing: CatalogProduct[],
  additions: CatalogProduct[],
) {
  return Array.from(
    new Map(
      [...existing, ...additions]
        .filter((product) => product.id)
        .map((product) => [product.id!, product]),
    ).values(),
  );
}

function matchesProductSearch(product: CatalogProduct, search: string) {
  const normalizedSearch = normalize(search);
  return (
    !normalizedSearch ||
    normalize(
      [product.name, product.code, product.description].join(" "),
    ).includes(normalizedSearch)
  );
}

function normalize(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
