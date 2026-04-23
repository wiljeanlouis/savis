package com.savouretplus.savis.recipe.infrastructure.web.dto;

import com.savouretplus.savis.recipe.application.command.RecipeCommand;

public record RecipeUpdateRequest(
                String title,
                String instructions,
                Integer cookingMinutes,
                Integer preparationMinutes) {

        public RecipeCommand toCommand() {
                return RecipeCommand.builder()
                                .title(title)
                                .instructions(instructions)
                                .cookingMinutes(cookingMinutes)
                                .preparationMinutes(preparationMinutes)
                                .build();
        }
}
