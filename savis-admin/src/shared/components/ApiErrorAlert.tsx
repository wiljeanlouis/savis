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
    <div
      role="alert"
      className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center text-destructive"
    >
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 whitespace-pre-line text-sm">
          {getApiErrorMessage(error)}
        </p>
      </div>
      {children}
    </div>
  );
}
