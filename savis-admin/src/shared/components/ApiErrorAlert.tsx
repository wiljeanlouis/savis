import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/alert";
import type { ReactNode } from "react";
import { getApiErrorMessage } from "@/shared/api/apiError";

export function ApiErrorAlert({
  title,
  error,
  children,
}: {
  title: string;
  error: unknown;
  children?: ReactNode;
}) {
  return (
    <Alert
      variant="destructive"
      className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center text-destructive"
    >
      <div>
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
      </div>
      {children}
    </Alert>
  );
}
