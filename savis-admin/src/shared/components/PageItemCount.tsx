export function PageItemCount({
  itemName,
  totalItems,
}: {
  itemName: string;
  totalItems?: number;
}) {
  if (totalItems === undefined) return null;

  return (
    <p aria-live="polite" className="text-xs text-muted-foreground">
      {totalItems} {itemName}
      {totalItems === 1 ? "" : "s"}
    </p>
  );
}
