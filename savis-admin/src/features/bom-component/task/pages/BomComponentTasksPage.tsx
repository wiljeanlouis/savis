import { BomComponentTaskList } from "../components/BomComponentTaskList";

export function BomComponentTasksPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Tâches d'acquisition</h1>
          <p className="text-sm text-muted-foreground">
            Suivez les acquisitions, recherches et actualisations des offres
            fournisseurs.
          </p>
        </div>
      </header>
      <BomComponentTaskList />
    </div>
  );
}
