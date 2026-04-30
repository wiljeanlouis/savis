package com.savouretplus.savis.recipe.infrastructure.web;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.savouretplus.savis.recipe.application.RecipeService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/recipes")
@CrossOrigin(origins = "http://localhost:5173") // Allow only your frontend origin
@AllArgsConstructor
@Slf4j
public class RecipeController {

    private final RecipeService recipeService;

    @PostMapping()
    public ResponseEntity<UUID> saveRecipe(@Valid @RequestBody RecipeDto request) {
        log.info("Received request to save recipe: {}", request.id());

        UUID recipeId = recipeService.saveRecipe(request.toCommand());

        return ResponseEntity.ok(recipeId);
    }

    @GetMapping("/{recipeId}")
    public ResponseEntity<RecipeDto> getRecipe(@PathVariable UUID recipeId) {
        log.info("Received request to get recipe: {}", recipeId);

        RecipeDto response = RecipeDto.from(recipeService.getRecipe(recipeId));

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{recipeId}")
    public ResponseEntity<Void> deleteRecipe(@PathVariable UUID recipeId) {
        log.info("Received request to delete recipe: {}", recipeId);
        recipeService.deleteRecipe(recipeId);

        return ResponseEntity.noContent().build();
    }

    @GetMapping()
    public ResponseEntity<Iterable<RecipeDto>> listRecipes() {
        log.info("Received request to list recipes");

        Iterable<RecipeDto> responses = recipeService.listRecipes()
                .stream()
                .map(RecipeDto::from)
                .toList();

        return ResponseEntity.ok(responses);
    }

}
