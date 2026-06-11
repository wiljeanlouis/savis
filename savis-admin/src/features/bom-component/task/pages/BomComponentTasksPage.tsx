import { BomComponentTaskList } from "../components/BomComponentTaskList";

export function BomComponentTasksPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Tâches de récupération</h1>
        <p className="text-sm text-muted-foreground">
          Suivez les récupérations, recherches et actualisations des composants
          BOM.
        </p>
      </div>
      <BomComponentTaskList />
    </div>
  );
}
