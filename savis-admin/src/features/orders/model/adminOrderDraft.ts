import type {
  CatalogProduct,
  ProductPurchaseMode,
} from "@/features/catalog/types";
import { createUuid } from "@/shared/lib/utils";
import type { CreateOrderRequest } from "../types";

export interface AdminOrderDraft {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: {
    line1: string;
    line2: string;
    city: string;
    province: string;
    postalCode: string;
  };
  note: string;
  discountCents: number;
  deliveryFeeCents: number;
  items: AdminOrderItemDraft[];
}

export interface AdminOrderItemDraft {
  key: string;
  productId: string;
  quantity: number;
  purchaseModeCode: string;
  choiceCode: string;
  allocations: Record<string, number>;
  ingredients: Record<string, number>;
}

export const emptyAdminOrderDraft = (): AdminOrderDraft => ({
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  customerAddress: {
    line1: "",
    line2: "",
    city: "",
    province: "",
    postalCode: "",
  },
  note: "",
  discountCents: 0,
  deliveryFeeCents: 0,
  items: [],
});

export function createAdminOrderItem(
  product: CatalogProduct,
): AdminOrderItemDraft {
  const mode = activeModes(product)[0];
  if (!product.id || !mode) {
    throw new Error("Ce produit ne peut pas être ajouté à une commande.");
  }
  const choices = activeChoices(product);
  const choiceCode =
    mode.allocationType === "SINGLE_CHOICE" ? (choices[0]?.code ?? "") : "";
  const allocations =
    mode.allocationType === "CHOICE_ALLOCATION" && choices[0]
      ? { [choices[0].code]: mode.quantity }
      : {};

  return {
    key: createUuid(),
    productId: product.id,
    quantity: 1,
    purchaseModeCode: mode.code,
    choiceCode,
    allocations,
    ingredients: Object.fromEntries(
      product.ingredientOptions
        .filter((option) => option.active)
        .map((option) => [option.code, option.defaultQuantity]),
    ),
  };
}

export function changePurchaseMode(
  item: AdminOrderItemDraft,
  product: CatalogProduct,
  purchaseModeCode: string,
): AdminOrderItemDraft {
  const mode = requireMode(product, purchaseModeCode);
  const choices = activeChoices(product);
  return {
    ...item,
    purchaseModeCode,
    choiceCode:
      mode.allocationType === "SINGLE_CHOICE"
        ? item.choiceCode || choices[0]?.code || ""
        : "",
    allocations:
      mode.allocationType === "CHOICE_ALLOCATION" && choices[0]
        ? { [choices[0].code]: mode.quantity }
        : {},
  };
}

export function buildCreateOrderRequest(
  draft: AdminOrderDraft,
  products: CatalogProduct[],
): CreateOrderRequest {
  if (!draft.customerName.trim()) {
    throw new Error("Le nom du client est requis.");
  }
  if (!draft.customerPhone.trim()) {
    throw new Error("Le téléphone du client est requis.");
  }
  if (draft.items.length === 0) {
    throw new Error("Ajoutez au moins un produit à la commande.");
  }
  const subtotalCents = estimateOrderSubtotalCents(draft, products);
  if (draft.discountCents < 0 || draft.deliveryFeeCents < 0) {
    throw new Error(
      "Le rabais et les frais de livraison doivent être positifs.",
    );
  }
  if (draft.discountCents > subtotalCents) {
    throw new Error("Le rabais ne peut pas dépasser le sous-total.");
  }

  return {
    customerName: draft.customerName.trim(),
    customerPhone: draft.customerPhone.trim(),
    customerEmail: blankToNull(draft.customerEmail),
    customerAddress: addressOrNull(draft.customerAddress),
    note: blankToNull(draft.note),
    discountCents: draft.discountCents,
    deliveryFeeCents: draft.deliveryFeeCents,
    items: draft.items.map((item) => {
      const product = requireProduct(products, item.productId);
      const mode = requireMode(product, item.purchaseModeCode);
      if (item.quantity <= 0) {
        throw new Error(`La quantité de ${product.name} doit être positive.`);
      }

      const choices = activeChoices(product);
      if (mode.allocationType === "SINGLE_CHOICE" && !item.choiceCode) {
        throw new Error(`Sélectionnez un choix pour ${product.name}.`);
      }
      const allocations =
        mode.allocationType === "CHOICE_ALLOCATION"
          ? choices
              .map((choice) => ({
                choiceCode: choice.code,
                quantity: item.allocations[choice.code] ?? 0,
              }))
              .filter((allocation) => allocation.quantity > 0)
          : [];
      if (
        mode.allocationType === "CHOICE_ALLOCATION" &&
        allocations.reduce((sum, value) => sum + value.quantity, 0) !==
          mode.quantity
      ) {
        throw new Error(
          `La répartition de ${product.name} doit totaliser ${mode.quantity}.`,
        );
      }

      const ingredients = product.ingredientOptions
        .filter((option) => option.active)
        .map((option) => {
          const quantity =
            item.ingredients[option.code] ?? option.defaultQuantity;
          if (quantity < option.minQuantity || quantity > option.maxQuantity) {
            throw new Error(
              `La quantité de ${option.name} doit être comprise entre ${option.minQuantity} et ${option.maxQuantity}.`,
            );
          }
          return { ingredientCode: option.code, quantity };
        });

      return {
        productId: product.id!,
        quantity: item.quantity,
        purchaseModeCode: mode.code,
        choiceCode:
          mode.allocationType === "SINGLE_CHOICE" ? item.choiceCode : null,
        allocations,
        ingredients,
      };
    }),
  };
}

export function estimateOrderTotalCents(
  draft: AdminOrderDraft,
  products: CatalogProduct[],
) {
  const subtotal = estimateOrderSubtotalCents(draft, products);
  return Math.max(0, subtotal - draft.discountCents) + draft.deliveryFeeCents;
}

export function estimateOrderSubtotalCents(
  draft: AdminOrderDraft,
  products: CatalogProduct[],
) {
  return draft.items.reduce((total, item) => {
    const product = products.find((value) => value.id === item.productId);
    const mode = product?.purchaseModes.find(
      (value) => value.active && value.code === item.purchaseModeCode,
    );
    if (!product || !mode) return total;
    const extras = product.ingredientOptions
      .filter((option) => option.active)
      .reduce((sum, option) => {
        const selected =
          item.ingredients[option.code] ?? option.defaultQuantity;
        return (
          sum +
          Math.max(0, selected - option.defaultQuantity) *
            cents(option.extraPrice.amount)
        );
      }, 0);
    return total + (cents(mode.price.amount) + extras) * item.quantity;
  }, 0);
}

export const activeModes = (product: CatalogProduct) =>
  product.purchaseModes
    .filter((mode) => mode.active)
    .sort((left, right) => left.displayOrder - right.displayOrder);

export const activeChoices = (product: CatalogProduct) =>
  (product.choiceGroup?.options ?? [])
    .filter((choice) => choice.active)
    .sort((left, right) => left.displayOrder - right.displayOrder);

export function selectedMode(
  product: CatalogProduct,
  item: AdminOrderItemDraft,
): ProductPurchaseMode | undefined {
  return activeModes(product).find(
    (mode) => mode.code === item.purchaseModeCode,
  );
}

function requireProduct(products: CatalogProduct[], productId: string) {
  const product = products.find((value) => value.id === productId);
  if (!product?.id) {
    throw new Error("Un produit sélectionné est introuvable.");
  }
  return product;
}

function requireMode(product: CatalogProduct, code: string) {
  const mode = activeModes(product).find((value) => value.code === code);
  if (!mode) {
    throw new Error(`Sélectionnez un mode d’achat pour ${product.name}.`);
  }
  return mode;
}

function cents(amount: number) {
  return Math.round(amount * 100);
}

function blankToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function addressOrNull(address: AdminOrderDraft["customerAddress"]) {
  const normalized = {
    line1: blankToNull(address.line1),
    line2: blankToNull(address.line2),
    city: blankToNull(address.city),
    province: blankToNull(address.province),
    postalCode: blankToNull(address.postalCode),
  };
  return Object.values(normalized).some(Boolean) ? normalized : null;
}
