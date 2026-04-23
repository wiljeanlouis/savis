package com.savouretplus.savis.recipe.infrastructure.web;

import java.net.URI;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.savouretplus.savis.recipe.application.RecipeService;
import com.savouretplus.savis.recipe.infrastructure.web.dto.RecipeDto;
import com.savouretplus.savis.recipe.infrastructure.web.dto.RecipeUpdateRequest;

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
    public ResponseEntity<UUID> createRecipe(@Valid @RequestBody RecipeDto request) {

        UUID recipeId = recipeService.createRecipe(request.toCommand());

        return ResponseEntity.created(URI.create("/api/recipes/" + recipeId)).build();
    }

    @GetMapping("/{recipeId}")
    public ResponseEntity<RecipeDto> getRecipe(@PathVariable UUID recipeId) {

        RecipeDto response = RecipeDto.from(recipeService.getRecipe(recipeId));

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{recipeId}")
    public ResponseEntity<UUID> updateRecipe(@PathVariable UUID recipeId,
            @Valid @RequestBody RecipeDto request) {
        log.info("Updating recipe {} with name '{}' and instructions '{}'", recipeId, request.name(),
                request.instructions());


        UUID recipeUuid = recipeService.updateRecipe(recipeId, request.toCommand());

        return ResponseEntity.ok().body(recipeUuid);
    }

    @DeleteMapping("/{recipeId}")
    public ResponseEntity<Void> deleteRecipe(@PathVariable UUID recipeId) {

        recipeService.deleteRecipe(recipeId);

        return ResponseEntity.noContent().build();
    }

    @GetMapping()
    public ResponseEntity<Iterable<RecipeDto>> listRecipes() {

        Iterable<RecipeDto> responses = recipeService.listRecipes()
                .stream()
                .map(RecipeDto::from)
                .toList();

        return ResponseEntity.ok(responses);
    }

}
