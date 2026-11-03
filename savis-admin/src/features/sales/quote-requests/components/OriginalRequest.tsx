import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@/shared/ui/table";
import { formatDateOnly } from "../../quotations/components/QuotationsTable";
import {
  parseOriginalRequest,
  configurationLabels,
  serviceLabels,
} from "../model/originalRequest";
export function OriginalRequest({ payload }: { payload: string }) {
  const data = parseOriginalRequest(payload);
  const event = data.event_details;
  const items = (data.items ?? []).map((item, index) => ({
    ...item,
    key: `item:${index}`,
  }));
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Événement</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {Object.entries({
                "Type d’événement": event?.event_type,
                Date: event?.event_date
                  ? formatDateOnly(event.event_date)
                  : null,
                Heure: event?.event_time,
                "Nombre d’invités": event?.guest_count,
                Lieu: event?.event_address,
                Budget: event?.budget,
              }).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="mt-1 font-medium whitespace-pre-wrap">
                    {value ?? "Non précisé"}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Services et contraintes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {data.requested_services?.map((service) => (
                <Badge key={service} variant="secondary">
                  {serviceLabels[service] ?? service}
                </Badge>
              ))}
            </div>
            <dl className="space-y-4">
              <div>
                <dt className="text-muted-foreground">
                  Allergies et restrictions
                </dt>
                <dd className="mt-1 whitespace-pre-wrap">
                  {event?.allergies || "Aucune précision fournie"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Notes du client</dt>
                <dd className="mt-1 whitespace-pre-wrap">
                  {[data.customer?.note, event?.note]
                    .filter(Boolean)
                    .join("\n") || "Aucune note"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Articles demandés</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Article</TableHead>
                  <TableHead>Configuration demandée</TableHead>
                  <TableHead className="text-right">Quantité</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.key}>
                    <TableCell className="align-top">
                      <p className="font-medium">{item.name}</p>
                      {item.note && (
                        <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                          {item.note}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-normal text-muted-foreground">
                      {configurationLabels(item.configuration).join(" · ") ||
                        "À compléter lors de la qualification"}
                    </TableCell>
                    <TableCell className="text-right align-top">
                      {item.requested_quantity}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-4 text-center text-muted-foreground">
              Aucun article précisé dans la demande.
            </p>
          )}
        </CardContent>
      </Card>
      <details className="rounded-lg border px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium text-muted-foreground">
          Consulter les données originales
        </summary>
        <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
}
