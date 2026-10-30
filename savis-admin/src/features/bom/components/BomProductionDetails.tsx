import type { Bom } from "../types";
import {
  costActivityLabel,
  formatBomDuration,
  formatBomQuantity,
} from "../model/bomCostPresentation";
export function BomProductionDetails({ bom }: { bom: Bom }) {
  return (
    <>
      <section
        aria-label="Composants matériels"
        className="space-y-2 border-t pt-3"
      >
        <h3 className="text-sm font-semibold">
          Composants matériels ({bom.components.length})
        </h3>
        {!bom.components.length && (
          <p className="text-sm text-muted-foreground">Aucun composant</p>
        )}
        {bom.components.map((component) => (
          <div
            key={
              component.id ??
              `${component.resourceId}-${component.componentName}`
            }
            className="flex items-start justify-between gap-3 border-b py-1.5 text-sm last:border-0"
          >
            <div className="min-w-0 [overflow-wrap:anywhere]">
              {component.componentName}
              <p className="text-xs text-muted-foreground">
                Ressource matérielle
              </p>
            </div>
            <span className="shrink-0 tabular-nums">
              {formatBomQuantity(component.quantity, component.unit)}
            </span>
          </div>
        ))}
      </section>
      <section aria-label="Activités" className="space-y-2 border-t pt-3">
        <h3 className="text-sm font-semibold">
          Activités ({bom.activities.length})
        </h3>
        {!bom.activities.length && (
          <p className="text-sm text-muted-foreground">Aucune activité</p>
        )}
        {[...bom.activities]
          .sort((a, b) => a.sequence - b.sequence)
          .map((activity) => (
            <div
              key={activity.id ?? `${activity.sequence}-${activity.type}`}
              className="flex justify-between gap-3 border-b py-1.5 text-sm last:border-0"
            >
              <span className="min-w-0 [overflow-wrap:anywhere]">
                {costActivityLabel(activity.type)}
              </span>
              <span className="shrink-0 tabular-nums">
                {formatBomDuration(activity.minutes)}
              </span>
            </div>
          ))}
      </section>
    </>
  );
}
