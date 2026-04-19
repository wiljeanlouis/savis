
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";

export const RecipeListHeader = () => {
    return (
        <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Recettes</h1>

            <div className="flex">
                <Input className="flex" placeholder="Rechercher dans les recettes" />
                <Button>
                    <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
                </Button>
            </div>

            <div className="flex gap-2">
                <Button>+ Ajouter</Button>
            </div>
        </div>
    )
}