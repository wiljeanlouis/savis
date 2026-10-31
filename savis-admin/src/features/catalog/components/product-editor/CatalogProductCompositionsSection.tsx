import type { Bom } from "@/features/bom/types";
import { emptyProductBom, type CatalogProduct } from "../../types";
import {
  BomField,
  DecimalField,
  NumberField,
  RemoveButton,
} from "./CatalogProductEditorFields";
import { CollectionSection } from "./CatalogProductEditorSection";
import type { UpdateCatalogProduct } from "./types";

export function CatalogProductCompositionsSection({
  form,
  boms,
  onUpdate,
}: {
  form: CatalogProduct;
  boms: Bom[];
  onUpdate: UpdateCatalogProduct;
}) {
  const updateProductBom = (
    index: number,
    patch: Partial<CatalogProduct["productBoms"][number]>,
  ) => {
    onUpdate(
      "productBoms",
      form.productBoms.map((item, current) =>
        current === index ? { ...item, ...patch } : item,
      ),
    );
  };

  return (
    <CollectionSection
      id="product-boms"
      title="Compositions de base"
      description="Composition toujours incluse dans le coût, peu importe le choix du client."
      onAdd={() =>
        onUpdate("productBoms", [
          ...form.productBoms,
          emptyProductBom(
            form.productBoms.length,
            boms.find((bom) => bom.id)?.id ?? "",
          ),
        ])
      }
    >
      {form.productBoms.map((productBom, index) => (
        <div
          className="grid gap-3 border-b pb-4 md:grid-cols-4"
          key={productBom.id}
        >
          <BomField
            label="Composition"
            value={productBom.bomId}
            boms={boms}
            required
            onChange={(bomId) =>
              updateProductBom(index, { bomId: bomId ?? "" })
            }
          />
          <DecimalField
            label="Quantité"
            value={productBom.quantity}
            onChange={(quantity) => updateProductBom(index, { quantity })}
          />
          <NumberField
            label="Ordre"
            value={productBom.displayOrder}
            onChange={(displayOrder) =>
              updateProductBom(index, { displayOrder })
            }
          />
          <RemoveButton
            onClick={() =>
              onUpdate(
                "productBoms",
                form.productBoms.filter((_, item) => item !== index),
              )
            }
          />
        </div>
      ))}
    </CollectionSection>
  );
}
