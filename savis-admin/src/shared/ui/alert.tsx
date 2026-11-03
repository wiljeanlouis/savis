import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/utils";
export function Alert({
  className,
  variant = "default",
  ...props
}: ComponentProps<"div"> & { variant?: "default" | "destructive" }) {
  return (
    <div
      role="alert"
      data-slot="alert"
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        variant === "destructive"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "bg-muted/30 text-foreground",
        className,
      )}
      {...props}
    />
  );
}
export function AlertTitle({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("font-medium", className)} {...props} />;
}
export function AlertDescription({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn("mt-1 whitespace-pre-line text-sm", className)}
      {...props}
    />
  );
}
