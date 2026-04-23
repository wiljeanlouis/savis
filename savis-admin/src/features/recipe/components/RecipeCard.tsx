import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import type { Recipe } from "../types"

export function RecipeCard({ title, description, imageUrl }: Recipe) {
  return (
    <Card className="relative mx-auto w-full max-w-sm pt-0 flex flex-col justify-between">
      <div className="absolute inset-0 z-30 aspect-video bg-black/35" />
      <img
        src={imageUrl}
        alt={title}
        className="relative z-20 aspect-video w-full object-cover"
      />

      <CardHeader>
        <CardAction>
          <Badge variant="secondary">Featured</Badge>
        </CardAction>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardFooter>
        <Button variant="destructive" className="w-full">View Recipe</Button>
      </CardFooter>
    </Card>
  )
}
