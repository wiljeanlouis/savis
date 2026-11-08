import type { ReactNode } from "react";

export function NoData({
  children = "Aucune donnée trouvée.",
  description,
  action,
}: {
  children?: ReactNode;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div
      role="status"
      className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground"
    >
      <p>{children}</p>
      {description && <p className="max-w-sm">{description}</p>}
      {action}
    </div>
  );
}
