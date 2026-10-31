import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";
import { BookOpenTextIcon, HelpCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ProductType } from "../types";

export type CatalogProductGuideSection =
  | "product-information"
  | "product-classification"
  | "product-boms"
  | "product-purchase-modes"
  | "product-options"
  | "product-availability";

interface GuideSection {
  title: string;
  summary: string;
  tips: string[];
  warning?: string;
}

const sectionGuides: Record<CatalogProductGuideSection, GuideSection> = {
  "product-information": {
    title: "Informations générales",
    summary:
      "Définissez l'identité du produit telle qu'elle sera reconnue et présentée.",
    tips: [
      "Le `Nom` et la `Description` sont les principaux contenus visibles par le client.",
      "Le `Code` est une référence interne stable; évitez de le réutiliser pour un autre produit.",
      "Le `Slug` identifie le produit dans une URL et devrait rester court et lisible.",
      "Utilisez des images accessibles publiquement et placez une URL par ligne dans la galerie.",
    ],
    warning:
      "Une URL d'image invalide n'empêche pas la sauvegarde, mais l'image ne pourra pas être affichée.",
  },
  "product-classification": {
    title: "Classification",
    summary:
      "Choisissez la nature commerciale et le comportement de configuration du produit.",
    tips: [
      "La `Nature commerciale` indique si vous vendez un bien ou un service.",
      "La `Configuration` détermine les choix proposés au client; elle ne décrit pas la nature commerciale.",
      "La `Marge cible` sert à comparer le prix de vente au coût calculé. Entrez 30 pour 30 %.",
    ],
    warning:
      "Changer la configuration peut masquer certaines options. Vérifiez les sections affichées avant d'enregistrer.",
  },
  "product-boms": {
    title: "Compositions",
    summary:
      "Associez ce qui est toujours nécessaire pour produire le bien ou réaliser le service.",
    tips: [
      "Une `Composition de base` s'applique à toutes les configurations du produit.",
      "La quantité multiplie les besoins et le coût de la composition sélectionnée.",
      "L'ordre contrôle la présentation lorsque plusieurs compositions sont associées.",
      "Un service peut rester sans composition lorsqu'aucun coût de production ne doit être calculé.",
    ],
    warning:
      "Ne placez pas ici une composition propre à une option, sinon son coût sera compté pour toutes les variantes.",
  },
  "product-purchase-modes": {
    title: "Modes d'achat",
    summary: "Définissez les formats, quantités et prix proposés au client.",
    tips: [
      "Au moins un mode d'achat doit être actif.",
      "Le `Format` remplit automatiquement le code et le libellé pour les formats courants.",
      "Choisissez `Personnalisé` pour saisir un autre code et un autre libellé.",
      "Le `Code` et le libellé identifient le format vendu; la quantité doit être supérieure à zéro.",
      "Le prix est un montant commercial en CAD et ne doit pas être négatif.",
      "Pour un format composable, la répartition détermine si le choix porte sur tout le lot ou sur sa composition.",
    ],
  },
  "product-options": {
    title: "Options et Choix",
    summary:
      "Décrivez les variantes ou extras permis par la configuration actuelle.",
    tips: [],
  },
  "product-availability": {
    title: "Disponibilité",
    summary:
      "Contrôlez si le produit peut être acheté et comment il est ordonné.",
    tips: [
      "`Disponible` indique si le produit peut être acheté par le client.",
      "La note de disponibilité précise les délais ou conditions particulières.",
      "L'ordre permet de stabiliser la position du produit dans les listes.",
      "La publication vers SavouretPlus se fait ensuite depuis la carte du produit.",
    ],
  },
};

const flows: Record<
  ProductType,
  { label: string; example: string; tips: string[]; warning?: string }
> = {
  STANDARD: {
    label: "Standard",
    example: "Exemple : pâté simple vendu à l'unité.",
    tips: ["Aucune option client supplémentaire n'est requise."],
  },
  SINGLE_CHOICE: {
    label: "Choix unique",
    example: "Exemple : pâté avec choix de farce.",
    tips: [
      "Chaque option active doit avoir un code unique.",
      "La composition de l'option représente le coût de la variante choisie.",
    ],
  },
  SINGLE_CHOICE_BUNDLE: {
    label: "Formats composables",
    example: "Exemple : boîte de 12 pâtés répartie entre plusieurs farces.",
    tips: [
      "En choix unique, la même option est appliquée à tout le lot.",
      "En composition, les quantités réparties doivent totaliser la quantité du mode d'achat.",
    ],
    warning:
      "Une répartition dont le total diffère de la taille du lot sera rejetée.",
  },
  INGREDIENT_CUSTOMIZATION: {
    label: "Ingrédients personnalisables",
    example: "Exemple : bol avec extra poulet ou fromage.",
    tips: [
      "Défaut, minimum et maximum définissent la plage permise.",
      "Le prix extra s'ajoute seulement au-dessus de la quantité par défaut.",
      "La composition de l'extra permet de mesurer son coût additionnel.",
    ],
  },
};

export function CatalogProductGuide({
  section,
  productType,
}: {
  section: CatalogProductGuideSection;
  productType: ProductType;
}) {
  const guide = sectionGuides[section];
  const flow = flows[productType];
  const tips =
    section === "product-options" ? [...guide.tips, ...flow.tips] : guide.tips;
  const warning = section === "product-options" ? flow.warning : guide.warning;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={`Aide contextuelle — ${guide.title}`}
        >
          <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={2} />
          <span className="hidden sm:inline">Aide contextuelle</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="data-[side=right]:w-[min(92vw,28rem)] data-[side=right]:sm:max-w-md">
        <SheetHeader className="border-b pr-14">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <HugeiconsIcon icon={BookOpenTextIcon} strokeWidth={2} />
            </div>
            <div>
              <Badge variant="outline" className="mb-2">
                Section actuelle
              </Badge>
              <SheetTitle>Aide — {guide.title}</SheetTitle>
              <SheetDescription>{guide.summary}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6 text-sm">
          {section === "product-options" && (
            <section className="rounded-lg border bg-muted/30 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium">Configuration actuelle</h3>
                <Badge variant="secondary">{flow.label}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {flow.example}
              </p>
            </section>
          )}

          <section className="rounded-lg border p-4">
            <h3 className="font-medium">Points à vérifier</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {tips.map((tip) => (
                <li key={tip}>
                  <InlineCode text={tip} />
                </li>
              ))}
            </ul>
          </section>

          {warning && (
            <section className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <h3 className="font-medium text-amber-900 dark:text-amber-100">
                Attention
              </h3>
              <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
                {warning}
              </p>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
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
