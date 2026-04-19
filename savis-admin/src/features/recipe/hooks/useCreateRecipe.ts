import { useMutation } from "@tanstack/react-query"
import { createRecipe } from "../api/createRecipe"

export const useCreateRecipe = () => {
  return useMutation({
    mutationFn: createRecipe
  })
}