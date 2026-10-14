import type { ReactNode } from "react";
import type { CatalogProduct } from "@/features/catalog/types";
import { dollarsToSafeCents } from "@/shared/lib/money";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
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
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  activeChoices,
  activeModes,
  changePurchaseMode,
  estimateOrderSubtotalCents,
  estimateOrderTotalCents,
  selectedMode,
  type AdminOrderDraft,
  type AdminOrderItemDraft,
} from "../model/adminOrderDraft";
import {
  CANADIAN_PROVINCES,
  formatCanadianPostalInput,
  formatPhoneInput,
} from "../model/contactFormat";
import { formatOrderCurrency } from "../types";
import { CatalogProductDropdown } from "./CatalogProductDropdown";
import { OrderProductImage } from "./OrderProductImage";

interface OrderEditorFormProps {
  draft: AdminOrderDraft;
  products: CatalogProduct[];
  searchResults: CatalogProduct[];
  productSearch: string;
  isSearchingProducts: boolean;
  isProductSearchError: boolean;
  error: string | null;
  onDraftChange: (draft: AdminOrderDraft) => void;
  onProductSearchChange: (search: string) => void;
  onAddProduct: (product: CatalogProduct) => void;
  onPatchItem: (key: string, patch: Partial<AdminOrderItemDraft>) => void;
  onRemoveItem: (key: string) => void;
  documentContext?: "commande" | "soumission";
}

export function OrderEditorForm({
  draft,
  products,
  searchResults,
  productSearch,
  isSearchingProducts,
  isProductSearchError,
  error,
  onDraftChange,
  onProductSearchChange,
  onAddProduct,
  onPatchItem,
  onRemoveItem,
  documentContext = "commande",
}: OrderEditorFormProps) {
  const subtotalCents = safeEstimate(() =>
    estimateOrderSubtotalCents(draft, products),
  );
  const totalCents = safeEstimate(() =>
    estimateOrderTotalCents(draft, products),
  );

  return (
    <div className="space-y-4">
      <OrderCustomerEditor
        draft={draft}
        onDraftChange={onDraftChange}
        documentContext={documentContext}
      />

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Produits</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Une ligne représente une configuration de produit.
              </p>
            </div>
            <CatalogProductDropdown
              products={searchResults}
              search={productSearch}
              isLoading={isSearchingProducts}
              isError={isProductSearchError}
              onSearchChange={onProductSearchChange}
              onSelect={onAddProduct}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
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
                  onChange={(patch) => onPatchItem(item.key, patch)}
                  onRemove={() => onRemoveItem(item.key)}
                />
              ) : (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive"
                >
                  <span>
                    Le produit {item.productId} ne peut pas être chargé.
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onRemoveItem(item.key)}
                  >
                    Retirer
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Ajustements et total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Rabais">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={draft.discountCents / 100}
                onChange={(event) =>
                  updateAdjustment(
                    draft,
                    "discountCents",
                    Number(event.target.value),
                    onDraftChange,
                  )
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
                  updateAdjustment(
                    draft,
                    "deliveryFeeCents",
                    Number(event.target.value),
                    onDraftChange,
                  )
                }
              />
            </Field>
            <dl className="space-y-2 sm:col-span-2 sm:ml-auto sm:min-w-80">
              <MoneyRow label="Sous-total" cents={subtotalCents} />
              {draft.discountCents > 0 ? (
                <MoneyRow label="Rabais" cents={-draft.discountCents} />
              ) : null}
              {draft.deliveryFeeCents > 0 ? (
                <MoneyRow label="Livraison" cents={draft.deliveryFeeCents} />
              ) : null}
              <MoneyRow label="Total estimé" cents={totalCents} emphasized />
            </dl>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function OrderCustomerEditor({
  draft,
  onDraftChange,
  documentContext = "commande",
}: {
  draft: AdminOrderDraft;
  onDraftChange: (draft: AdminOrderDraft) => void;
  documentContext?: "commande" | "soumission";
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Client</CardTitle>
        <p className="text-sm text-muted-foreground">
          Coordonnées et adresse utilisées pour la {documentContext} et ses
          documents.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom du client">
            <Input
              required
              value={draft.customerName}
              onChange={(event) =>
                onDraftChange({
                  ...draft,
                  customerName: event.target.value,
                })
              }
            />
          </Field>
          <Field label="Téléphone">
            <Input
              required
              inputMode="tel"
              autoComplete="tel"
              placeholder="(819) 555-0123"
              value={draft.customerPhone}
              onChange={(event) =>
                onDraftChange({
                  ...draft,
                  customerPhone: formatPhoneInput(event.target.value),
                })
              }
            />
          </Field>
          <Field label="Courriel">
            <Input
              type="email"
              value={draft.customerEmail}
              onChange={(event) =>
                onDraftChange({
                  ...draft,
                  customerEmail: event.target.value,
                })
              }
            />
          </Field>
          <Field label="Note">
            <Textarea
              value={draft.note}
              onChange={(event) =>
                onDraftChange({ ...draft, note: event.target.value })
              }
            />
          </Field>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <div>
            <h3 className="font-medium">Adresse du client</h3>
            <p className="text-sm text-muted-foreground">
              Facultative; elle apparaît sur la facture et la soumission.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <AddressField
              label="Adresse"
              field="line1"
              draft={draft}
              onDraftChange={onDraftChange}
            />
            <AddressField
              label="Appartement, bureau, etc."
              field="line2"
              draft={draft}
              onDraftChange={onDraftChange}
            />
            <AddressField
              label="Ville"
              field="city"
              draft={draft}
              onDraftChange={onDraftChange}
            />
            <Field label="Province">
              <Select
                value={draft.customerAddress.province}
                onValueChange={(province) =>
                  onDraftChange({
                    ...draft,
                    customerAddress: {
                      ...draft.customerAddress,
                      province,
                    },
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner…" />
                </SelectTrigger>
                <SelectContent>
                  {CANADIAN_PROVINCES.map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      {name} ({code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <AddressField
              label="Code postal"
              field="postalCode"
              draft={draft}
              onDraftChange={onDraftChange}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddressField({
  label,
  field,
  draft,
  onDraftChange,
}: {
  label: string;
  field: keyof AdminOrderDraft["customerAddress"];
  draft: AdminOrderDraft;
  onDraftChange: (draft: AdminOrderDraft) => void;
}) {
  return (
    <Field label={label}>
      <Input
        autoComplete={addressAutoComplete(field)}
        inputMode={field === "postalCode" ? "text" : undefined}
        placeholder={field === "postalCode" ? "J2B 1V7" : undefined}
        value={draft.customerAddress[field]}
        onChange={(event) =>
          onDraftChange({
            ...draft,
            customerAddress: {
              ...draft.customerAddress,
              [field]:
                field === "postalCode"
                  ? formatCanadianPostalInput(event.target.value)
                  : event.target.value,
            },
          })
        }
      />
    </Field>
  );
}

function addressAutoComplete(field: keyof AdminOrderDraft["customerAddress"]) {
  return {
    line1: "address-line1",
    line2: "address-line2",
    city: "address-level2",
    province: "address-level1",
    postalCode: "postal-code",
  }[field];
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
                  {value.label} — {formatCatalogPrice(value.price.amount)}
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

      {mode?.allocationType === "SINGLE_CHOICE" && choices.length > 0 ? (
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
      ) : null}

      {mode?.allocationType === "CHOICE_ALLOCATION" ? (
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
      ) : null}

      {product.ingredientOptions.some((option) => option.active) ? (
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
      ) : null}
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
  cents: number | null;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <dt className={emphasized ? "font-semibold" : "text-muted-foreground"}>
        {label}
      </dt>
      <dd className={emphasized ? "text-xl font-semibold" : "font-medium"}>
        {cents === null ? "Montant invalide" : formatOrderCurrency(cents)}
      </dd>
    </div>
  );
}

function safeEstimate(calculation: () => number): number | null {
  try {
    return calculation();
  } catch {
    return null;
  }
}

function formatCatalogPrice(amount: number) {
  const cents = safeEstimate(() => dollarsToSafeCents(amount));
  return cents === null ? "Montant invalide" : formatOrderCurrency(cents);
}

function updateAdjustment(
  draft: AdminOrderDraft,
  field: "discountCents" | "deliveryFeeCents",
  amount: number,
  onDraftChange: (draft: AdminOrderDraft) => void,
) {
  const cents = safeEstimate(() => dollarsToSafeCents(amount));
  if (cents !== null) {
    onDraftChange({ ...draft, [field]: cents });
  }
}
