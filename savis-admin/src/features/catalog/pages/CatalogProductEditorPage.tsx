import { useEffect, useRef, useState } from "react";
import { Link, useBlocker, useNavigate, useParams } from "react-router";
import { CatalogProductEditor } from "../components/CatalogProductEditor";
import { useCatalogProductManagement } from "../hooks/useCatalogProductManagement";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";

/** Full-page editor used to create or modify a catalog product. */
export function CatalogProductEditorPage() {
  const { productId } = useParams();
  return (
    <CatalogProductEditorContent
      key={productId ?? "new-product"}
      productId={productId}
    />
  );
}

function CatalogProductEditorContent({
  productId,
}: {
  productId: string | undefined;
}) {
  const navigate = useNavigate();
  const allowNavigation = useRef(false);
  const [isDirty, setIsDirty] = useState(false);
  const { products, boms, isLoading, isSaving, saveProduct } =
    useCatalogProductManagement();
  const product = productId
    ? products.find((candidate) => candidate.id === productId)
    : undefined;
  const blocker = useBlocker(
    () => isDirty && !allowNavigation.current && !isSaving,
  );

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (window.confirm("Abandonner les modifications non enregistrées ?")) {
      blocker.proceed();
    } else {
      blocker.reset();
    }
  }, [blocker]);

  useEffect(() => {
    if (!isDirty) return;
    const preventUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", preventUnload);
    return () => window.removeEventListener("beforeunload", preventUnload);
  }, [isDirty]);

  const returnToCatalog = () => {
    allowNavigation.current = true;
    navigate("/catalog-products");
  };

  if (isLoading) {
    return (
      <div
        className="flex min-h-64 items-center justify-center"
        aria-label="Chargement du produit"
      >
        <Spinner />
      </div>
    );
  }

  if (productId && !product) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-xl border border-dashed text-center">
        <div>
          <h1 className="text-xl font-semibold">Produit introuvable</h1>
          <p className="text-sm text-muted-foreground">
            Ce produit n’existe plus ou n’est pas accessible.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/catalog-products">Retour aux produits</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CatalogProductEditor
        product={product}
        boms={boms}
        saving={isSaving}
        onSave={saveProduct}
        onCancel={returnToCatalog}
        onSaved={returnToCatalog}
        onDirtyChange={setIsDirty}
      />
    </div>
  );
}
