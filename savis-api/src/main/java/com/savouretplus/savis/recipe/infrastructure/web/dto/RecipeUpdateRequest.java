package com.savouretplus.savis.recipe.infrastructure.web.dto;

import com.savouretplus.savis.recipe.application.command.RecipeUpdateCommand;

public record RecipeUpdateRequest(
                String title,
                String instructions,
                Integer cookingMinutes,
                Integer preparationMinutes) {

        public RecipeUpdateCommand toCommand() {
                return RecipeUpdateCommand.builder()
                                .title(title)
                                .instructions(instructions)
                                .cookingMinutes(cookingMinutes)
                                .preparationMinutes(preparationMinutes)
                                .build();
        }
}
