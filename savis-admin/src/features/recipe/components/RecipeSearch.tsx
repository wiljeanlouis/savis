import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { ButtonGroup } from "@/shared/ui/button-group";
import { Field } from "@/shared/ui/field";

interface RecipeSearchProps {
  searchQuery: string;
  onSearchQueryChange: (searchQuery: string) => void;
}

export const RecipeSearch = ({
  searchQuery,
  onSearchQueryChange,
}: RecipeSearchProps) => {
  return (
    <Field>
      <ButtonGroup>
        <Input
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Rechercher dans les recettes"
        />
        <Button variant="outline" type="button" aria-label="Rechercher">
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
        </Button>
      </ButtonGroup>
    </Field>
  );
};
