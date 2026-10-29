import { useEffect, useMemo, useState } from "react";
import { cn } from "@/shared/lib/utils";

export function BomEditorNavigation({ showCost }: { showCost: boolean }) {
  const [activeSection, setActiveSection] = useState("bom-information");
  const items = useMemo(() => {
    const sections = [
      { id: "bom-information", label: "Informations générales" },
      { id: "bom-production", label: "Production et rendement" },
      { id: "bom-components", label: "Ressources" },
      { id: "bom-activities", label: "Activités" },
    ];
    if (showCost) sections.push({ id: "bom-cost", label: "Analyse des coûts" });
    return sections;
  }, [showCost]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (left, right) =>
              left.boundingClientRect.top - right.boundingClientRect.top,
          )[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-96px 0px -65% 0px", threshold: 0 },
    );
    items.forEach(({ id }) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, [items]);

  return (
    <aside className="sticky top-16 z-30 -mx-2 border-b bg-background/95 px-2 backdrop-blur xl:top-20 xl:mx-0 xl:self-start xl:border-b-0 xl:bg-transparent xl:px-0 xl:backdrop-blur-none">
      <p className="mb-2 hidden text-xs font-medium tracking-wide text-muted-foreground uppercase xl:block">
        Dans cette page
      </p>
      <nav
        aria-label="Sections de la composition"
        className="flex min-w-0 overflow-x-auto xl:-ml-px xl:flex-col xl:overflow-visible xl:border-l"
      >
        {items.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            aria-current={activeSection === id ? "location" : undefined}
            onClick={() => setActiveSection(id)}
            className={cn(
              "border-b-2 border-transparent px-3 py-2 text-xs whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground xl:border-b-0 xl:border-l-2",
              activeSection === id &&
                "border-primary bg-primary/10 text-foreground",
            )}
          >
            {label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
