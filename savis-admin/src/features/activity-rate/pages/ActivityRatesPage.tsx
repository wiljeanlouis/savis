import { NoData } from "@/shared/components/NoData";
import { DeleteAlert } from "@/shared/components/DeleteAlert";
import { Badge } from "@/shared/ui/badge";
import { Spinner } from "@/shared/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { toast } from "sonner";
import { ActivityRateDialog } from "../components/ActivityRateDialog";
import {
  useCreateActivityRate,
  useDeleteActivityRate,
  useGetActivityRates,
  useUpdateActivityRate,
} from "../hooks/useActivityRateApi";
import type { ActivityRate, ActivityRateValues } from "../types";
import { activityTypeLabel } from "../types";

const formatHourlyRate = (activityRate: ActivityRate) =>
  new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: activityRate.hourlyRate.currency,
  }).format(Number(activityRate.hourlyRate.amount));

const toActivityRate = (values: ActivityRateValues): ActivityRate => ({
  activityType: values.activityType,
  hourlyRate: {
    amount: values.hourlyRateAmount,
    currency: values.currency,
  },
});

export function ActivityRatesPage() {
  const activityRatesQuery = useGetActivityRates();
  const createMutation = useCreateActivityRate();
  const updateMutation = useUpdateActivityRate();
  const deleteMutation = useDeleteActivityRate();
  const activityRates = activityRatesQuery.data ?? [];

  const handleCreate = (values: ActivityRateValues) => {
    createMutation.mutate(toActivityRate(values), {
      onSuccess: () => toast.success("Taux d'activité ajouté."),
      onError: () => toast.error("Impossible d'ajouter le taux horaire."),
    });
  };

  const handleUpdate = (
    activityRate: ActivityRate,
    values: ActivityRateValues,
  ) => {
    updateMutation.mutate(
      { ...toActivityRate(values), id: activityRate.id },
      {
        onSuccess: () => toast.success("Taux horaire modifié."),
        onError: () => toast.error("Impossible de modifier le taux horaire."),
      },
    );
  };

  const handleDelete = (activityRate: ActivityRate) => {
    deleteMutation.mutate(activityRate.activityType, {
      onSuccess: () => toast.success("Taux d'activité supprimé."),
      onError: () => toast.error("Impossible de supprimer le taux horaire."),
    });
  };

  if (activityRatesQuery.isError) {
    toast.error(
      "Une erreur est survenue lors de la récupération des taux horaires.",
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Taux horaire</h1>
          <p className="text-sm text-muted-foreground">
            Coûts horaires globaux utilisés dans le calcul des BOM.
          </p>
        </div>
        <ActivityRateDialog
          activityRates={activityRates}
          isSaving={createMutation.isPending}
          onSave={handleCreate}
        />
      </div>

      {activityRatesQuery.isPending ? (
        <div className="flex h-full items-center justify-center">
          <Spinner />
        </div>
      ) : activityRates.length === 0 ? (
        <NoData />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Taux horaire</TableHead>
                <TableHead>Devise</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activityRates.map((activityRate) => (
                <TableRow key={activityRate.activityType}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {activityRate.activityType}
                      </Badge>
                      <span>
                        {activityTypeLabel(activityRate.activityType)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{formatHourlyRate(activityRate)} / h</TableCell>
                  <TableCell>{activityRate.hourlyRate.currency}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <ActivityRateDialog
                        activityRate={activityRate}
                        activityRates={activityRates}
                        isSaving={updateMutation.isPending}
                        onSave={(values) => handleUpdate(activityRate, values)}
                      />
                      <DeleteAlert
                        item={activityTypeLabel(activityRate.activityType)}
                        onDelete={() => handleDelete(activityRate)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
