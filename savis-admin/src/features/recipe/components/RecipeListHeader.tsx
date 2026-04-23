
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { Link } from "react-router";
import { ButtonGroup } from "@/shared/ui/button-group";
import { Field } from "@/shared/ui/field";

export const RecipeListHeader = () => {
    return (
        <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Recettes</h1>

            <Field>
                <ButtonGroup>
                    <Input placeholder="Rechercher dans les recettes" />
                    <Button variant="outline">
                        <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
                    </Button>
                </ButtonGroup>
            </Field>

            <Button >
                <Link to="/recipes/add">
                    + Ajouter
                </Link>
            </Button>
        </div>
    )
}