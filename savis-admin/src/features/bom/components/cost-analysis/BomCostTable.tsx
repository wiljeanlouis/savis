import { useId, useRef, useState } from "react";
import { Table, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import type { BomCostCategory } from "../../model/bomCostPresentation";
import type { BomCostLine } from "../../types";
import { BomCostGroup } from "./BomCostGroup";
import { BomCostProvenance } from "./BomCostProvenance";

export function BomCostTable({
  categories,
}: {
  categories: BomCostCategory[];
}) {
  const [selected, setSelected] = useState<{
    line: BomCostLine;
    label: string;
  } | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const dialogId = useId();

  return (
    <>
      <div className="min-w-0 overflow-hidden rounded-lg border">
        <Table aria-label="Postes de coût" className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="w-[48%]">
                Poste
              </TableHead>
              <TableHead scope="col" className="w-[27%] whitespace-normal">
                Quantité / durée
              </TableHead>
              <TableHead scope="col" className="w-[25%] text-right">
                Coût
              </TableHead>
            </TableRow>
          </TableHeader>
          {categories.map((category) => (
            <BomCostGroup
              key={category.id}
              category={category}
              selectedLine={selected?.line}
              dialogId={dialogId}
              onInspect={(line, label, button) => {
                trigger.current = button;
                setSelected({ line, label });
              }}
            />
          ))}
        </Table>
      </div>
      <BomCostProvenance
        selected={selected}
        dialogId={dialogId}
        onClose={() => setSelected(null)}
        onRestoreFocus={() => trigger.current?.focus()}
      />
    </>
  );
}
