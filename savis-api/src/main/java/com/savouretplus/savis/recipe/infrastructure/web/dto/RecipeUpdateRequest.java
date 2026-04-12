package com.savouretplus.savis.recipe.infrastructure.web.dto;

import jakarta.validation.constraints.NotBlank;

public record RecipeUpdateRequest(
        @NotBlank String title,
        @NotBlank String instructions) {
}
