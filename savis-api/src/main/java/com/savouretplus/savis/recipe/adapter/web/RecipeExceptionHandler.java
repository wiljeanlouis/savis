package com.savouretplus.savis.recipe.adapter.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.savouretplus.savis.recipe.adapter.persistence.RecipePersistenceException;

@RestControllerAdvice
public class RecipeExceptionHandler {

    @ExceptionHandler(RecipePersistenceException.class)
    public ProblemDetail handleRecipePersistenceException(RecipePersistenceException e) {
        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        problemDetail.setTitle(e.getMessage());
        problemDetail.setDetail(e.getCause().getMessage());
        return problemDetail;
    }
}
