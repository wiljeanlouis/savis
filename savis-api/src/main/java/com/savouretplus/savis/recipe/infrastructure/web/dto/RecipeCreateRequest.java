package com.savouretplus.savis.recipe.infrastructure.web.dto;

import jakarta.validation.constraints.NotEmpty;

public record RecipeCreateRequest(
    @NotEmpty String title
) {

}
