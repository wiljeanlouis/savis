import { Button } from "@/shared/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import type { Recipe } from "../types";
import { Link } from "react-router";
import { DeleteAlert } from "@/shared/components/DeleteAlert";

interface RecipeCardProps {
  recipe: Recipe;
  deleteRecipe: () => void;
}

export const RecipeCard = ({ recipe, deleteRecipe }: RecipeCardProps) => {
  const { id, name, description, imageUrl } = recipe;

  const link = id ? `/recipes/${id}` : "";

  return (
    <Card className="relative mx-auto w-full max-w-sm pt-0 flex flex-col justify-between">
      <div className="absolute inset-0 z-30 aspect-video bg-black/35" />
      <img
        src={imageUrl}
        alt={name}
        className="relative z-20 aspect-video w-full object-cover"
      />

      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline">
          <Link to={link} className="w-full">
            Modifier
          </Link>
        </Button>

        <DeleteAlert item={name} onDelete={deleteRecipe} />
      </CardFooter>
    </Card>
  );
};
