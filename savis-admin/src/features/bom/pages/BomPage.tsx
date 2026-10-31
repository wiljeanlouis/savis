import { BomForm } from "../components/BomForm";
import { useLoaderData, useLocation } from "react-router";
import { useEffect } from "react";
import type { Bom } from "../types";

export const BomPage = () => {
  const bom = useLoaderData<Bom | null>();
  const { hash } = useLocation();

  useEffect(() => {
    if (hash === "#bom-cost") {
      document.getElementById("bom-cost")?.scrollIntoView({ block: "start" });
    }
  }, [hash, bom?.id]);

  return (
    <div className="space-y-6">
      <BomForm
        key={bom?.id ?? "new-bom"}
        costing={bom?.costing}
        yieldUnit={bom?.yield.unit ?? "portion"}
      />
    </div>
  );
};
