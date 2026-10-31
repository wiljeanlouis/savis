import type { ReactNode } from "react";

export function EditorSection({
  id,
  title,
  description,
  action,
  children,
}: {
  id: string;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const titleId = `${id}-title`;

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className="flex scroll-mt-24 flex-col gap-4 rounded-xl border bg-card p-5"
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 id={titleId} className="text-sm font-medium">
            {title}
          </h2>
          <p className="mt-1 text-xs/relaxed leading-normal text-muted-foreground">
            {description}
          </p>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
