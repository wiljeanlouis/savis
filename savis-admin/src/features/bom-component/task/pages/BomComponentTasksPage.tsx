import { BomComponentTaskList } from "../components/BomComponentTaskList";

export function BomComponentTasksPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Tâches d'acquisition</h1>
        <p className="text-sm text-muted-foreground">
          Suivez les acquisitions, recherches et actualisations des offres
          fournisseurs.
        </p>
      </div>
      <BomComponentTaskList />
    </div>
  );
}
