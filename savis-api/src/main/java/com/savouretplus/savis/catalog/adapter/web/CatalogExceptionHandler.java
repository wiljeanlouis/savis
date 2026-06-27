package com.savouretplus.savis.catalog.adapter.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.savouretplus.savis.catalog.usecase.ProductNotFoundException;

/**
 * Maps catalog exceptions to HTTP responses.
 */
@RestControllerAdvice(assignableTypes = CatalogController.class)
public class CatalogExceptionHandler {

    @ExceptionHandler(ProductNotFoundException.class)
    ProblemDetail handleNotFound(RuntimeException exception) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
        problem.setTitle("Produit introuvable");
        problem.setDetail(exception.getMessage());
        return problem;
    }

    @ExceptionHandler({ IllegalArgumentException.class, IllegalStateException.class })
    ProblemDetail handleInvalidProduct(RuntimeException exception) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setTitle("Produit catalogue invalide");
        problem.setDetail(exception.getMessage());
        return problem;
    }
}
