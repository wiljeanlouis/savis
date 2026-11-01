import { Link, useParams } from "react-router";
import { ApiErrorAlert } from "@/shared/components/ApiErrorAlert";
import { Spinner } from "@/shared/ui/spinner";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { formatOrderDate } from "../../orders/types";
import {
  formatPhoneForDisplay,
  phoneHref,
} from "../../orders/model/contactFormat";
import { RequestedProductAvailability } from "../components/RequestedProductAvailability";
import { QuoteRequestStatusBadge } from "../components/QuoteRequestStatusBadge";
import { CloseRequestDialog } from "../components/CloseRequestDialog";
import { RequestProposals } from "../components/RequestProposals";
import { QualificationPanel } from "../components/QualificationPanel";
import { OriginalRequest } from "../components/OriginalRequest";
import { useRequest } from "../hooks/useQuoteRequests";
export function QuoteRequestDetailsPage() {
  const { requestId = "" } = useParams();
  const query = useRequest(requestId);
  if (query.isError)
    return (
      <ApiErrorAlert
        title="Impossible de charger la demande."
        error={query.error}
      />
    );
  if (!query.data)
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  const r = query.data;
  const customer = r.qualification ?? r;
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            className="text-sm text-muted-foreground hover:underline"
            to="/sales/quote-requests"
          >
            ← Toutes les demandes
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">
              Demande de {customer.customerName}
            </h1>
            <QuoteRequestStatusBadge status={r.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Reçue le {formatOrderDate(r.receivedAt)}
          </p>
        </div>
        {r.status !== "CLOSED" && <CloseRequestDialog request={r} />}
      </div>
      {r.status === "CLOSED" && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="font-medium">Demande clôturée</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
            {r.closedReason}
          </p>
        </div>
      )}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Client</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Nom</dt>
              <dd className="mt-1 font-medium">{customer.customerName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Téléphone</dt>
              <dd className="mt-1">
                <a
                  className="hover:underline"
                  href={`tel:${phoneHref(customer.customerPhone)}`}
                >
                  {formatPhoneForDisplay(customer.customerPhone)}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Courriel</dt>
              <dd className="mt-1 break-words">
                {customer.customerEmail ? (
                  <a
                    className="hover:underline"
                    href={`mailto:${customer.customerEmail}`}
                  >
                    {customer.customerEmail}
                  </a>
                ) : (
                  "Non précisé"
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      <Tabs defaultValue="request" className="space-y-4">
        <TabsList aria-label="Détail de la demande">
          <TabsTrigger value="request">Demande originale</TabsTrigger>
          <TabsTrigger value="qualification">Qualification</TabsTrigger>
          <TabsTrigger value="quotations">Devis associés</TabsTrigger>
        </TabsList>
        <TabsContent value="request" className="space-y-4">
          <OriginalRequest payload={r.originalPayload} />
          <RequestedProductAvailability payload={r.originalPayload} />
        </TabsContent>
        <TabsContent
          value="qualification"
          forceMount
          className="data-[state=inactive]:hidden"
        >
          <QualificationPanel key={`${r.publicId}:${r.version}`} request={r} />
        </TabsContent>
        <TabsContent
          value="quotations"
          forceMount
          className="data-[state=inactive]:hidden"
        >
          <RequestProposals request={r} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
