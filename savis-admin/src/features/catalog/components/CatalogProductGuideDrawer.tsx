import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { HelpCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const flows = [
  {
    type: "STANDARD",
    label: "Standard",
    title: "Produit simple",
    example: "Pâté simple vendu à l'unité.",
    when: "Le client ne choisit pas de variante au moment de l'achat.",
    fields: [
      "Les `Modes d'achat` portent les formats, quantités et prix.",
      "Les `BOM communs` contiennent la composition de base.",
    ],
    warning:
      "Un produit sans BOM peut être sauvegardé, mais son analyse de coût risque d'être incomplète.",
  },
  {
    type: "SINGLE_CHOICE",
    label: "Choix unique",
    title: "Choix unique",
    example: "Pâté avec choix de farce : poulet, bœuf ou morue.",
    when: "Le client sélectionne une seule option dans un groupe.",
    fields: [
      "La section `Saveurs et choix` est obligatoire.",
      "Chaque option active doit avoir un `code` unique.",
      "Le BOM de l'option représente le coût de la variante choisie.",
    ],
    warning:
      "Ne mettez pas le BOM d'une option dans les BOMs communs, sinon le coût sera compté pour toutes les variantes.",
  },
  {
    type: "SINGLE_CHOICE_BUNDLE",
    label: "Formats composables",
    title: "Bundle composable",
    example: "Boîte de 12 pâtés répartie entre plusieurs farces.",
    when: "Le produit est vendu en lot avec un choix unique ou une répartition.",
    fields: [
      "Les `Modes d'achat` définissent les formats, quantités et prix.",
      "`Répartition` = `Choix unique` applique un choix à tout le lot.",
      "`Répartition` = `Composition` exige que les quantités réparties totalisent la quantité du mode.",
    ],
    warning:
      "Pour une boîte de 12, les allocations doivent totaliser 12. Sinon l'analyse est rejetée.",
  },
  {
    type: "INGREDIENT_CUSTOMIZATION",
    label: "Ingrédients personnalisables",
    title: "Ingrédients personnalisables",
    example: "Bol avec extra poulet ou fromage.",
    when: "Le client ajuste des ingrédients ou extras.",
    fields: [
      "La section `Ingrédients et extras` doit contenir au moins un ingrédient.",
      "`Défaut`, `Minimum` et `Maximum` définissent la plage permise.",
      "Le `Prix extra` s'ajoute seulement au-dessus de la quantité par défaut.",
    ],
    warning:
      "Sans BOM extra, le prix peut augmenter sans que le coût additionnel soit bien mesuré.",
  },
];

const statuses = [
  ["GOOD", "La marge réelle atteint ou dépasse la marge cible."],
  ["REVIEW", "Le produit est rentable, mais sous la marge cible."],
  ["LOSS", "Le coût est plus élevé que le prix de vente."],
  ["INCOMPLETE", "Tous les BOMs nécessaires ne peuvent pas être calculés."],
] as const;

const publication =
  "`Disponible` indique si le produit est achetable. La publication vers SavouretPlus se fait directement depuis la carte du produit.";

export function CatalogProductGuideButton({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Button
      type="button"
      variant={open ? "default" : "outline"}
      size="icon-sm"
      aria-label="Guide produits"
      aria-expanded={open}
      onClick={() => onOpenChange(!open)}
    >
      <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={2} />
    </Button>
  );
}

export function CatalogProductGuidePanel() {
  return (
    <aside
      aria-label="Guide de création produit"
      className="flex max-h-[calc(92vh-7rem)] flex-col overflow-hidden rounded-md border bg-background xl:sticky xl:top-0"
    >
      <header className="border-b p-4">
        <div>
          <h2 className="font-semibold">Guide de création produit</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Choisir le bon type, remplir les champs critiques et lire l'analyse.
          </p>
        </div>
      </header>

      <div className="space-y-4 overflow-y-auto p-4">
        {flows.map((flow) => (
          <section key={flow.type} className="rounded-md border p-4">
            <div className="flex flex-wrap items-center gap-2">
              Type: <Badge variant="outline">{flow.label}</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{flow.when}</p>
            <p className="mt-2 text-xs">{flow.example}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
              {flow.fields.map((field) => (
                <li key={field}>
                  <InlineCode text={field} />
                </li>
              ))}
            </ul>
            <p className="mt-3 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              {flow.warning}
            </p>
          </section>
        ))}

        <section className="rounded-md border p-4">
          <h3 className="font-semibold">Analyse de prix</h3>
          <p className="mt-2 text-xs text-muted-foreground">
            Le prix recommandé est indicatif et n'est jamais copié
            automatiquement.
          </p>
          <div className="mt-3 grid gap-2">
            {statuses.map(([status, description]) => (
              <div key={status} className="flex items-start gap-2 text-xs">
                <Badge
                  variant={
                    status === "GOOD"
                      ? "default"
                      : status === "LOSS"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {status}
                </Badge>
                <span className=" text-xs text-muted-foreground">
                  {description}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-md border p-4">
          <h3 className="font-semibold">Publication</h3>
          <p className="mt-2 text-xs text-muted-foreground">
            <InlineCode text={publication} />
          </p>
        </section>
      </div>
    </aside>
  );
}

function InlineCode({ text }: { text: string }) {
  const parts = inlineCodeParts(text);
  return (
    <>
      {parts.map((part) =>
        part.code ? (
          <code key={part.key} className="rounded bg-muted px-1 py-0.5 text-xs">
            {part.text}
          </code>
        ) : (
          <span key={part.key}>{part.text}</span>
        ),
      )}
    </>
  );
}

function inlineCodeParts(text: string) {
  const parts: Array<{ key: string; text: string; code: boolean }> = [];
  const pattern = /`([^`]+)`/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    if (match.index > cursor) {
      parts.push({
        key: `text-${cursor}`,
        text: text.slice(cursor, match.index),
        code: false,
      });
    }

    parts.push({
      key: `code-${match.index}`,
      text: match[1],
      code: true,
    });
    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) {
    parts.push({
      key: `text-${cursor}`,
      text: text.slice(cursor),
      code: false,
    });
  }

  return parts;
}
