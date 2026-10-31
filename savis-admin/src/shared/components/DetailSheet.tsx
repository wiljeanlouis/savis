import { useRef, type ReactNode, type RefObject } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";

export function DetailSheet({
  open,
  onClose,
  title,
  listRef,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  listRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  const trigger = useRef<HTMLElement | null>(null);
  return (
    <Sheet
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <SheetContent
        closeButtonLabel="Fermer"
        aria-describedby={undefined}
        className="data-[side=right]:w-full data-[side=right]:sm:max-w-[680px] gap-0 p-3 pt-14"
        onOpenAutoFocus={() => {
          trigger.current = document.activeElement as HTMLElement;
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (
            trigger.current?.isConnected &&
            listRef.current?.contains(trigger.current)
          )
            trigger.current.focus();
          else
            listRef.current
              ?.querySelector<HTMLButtonElement>("button")
              ?.focus();
        }}
      >
        <SheetTitle className="sr-only">{title}</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  );
}
