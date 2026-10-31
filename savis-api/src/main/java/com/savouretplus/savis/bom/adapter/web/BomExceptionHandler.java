package com.savouretplus.savis.bom.adapter.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.http.HttpStatusCode;

import com.savouretplus.savis.bom.adapter.persistence.BomPersistenceException;

/**
 * Maps BOM-related domain and persistence exceptions to HTTP responses.
 */
@RestControllerAdvice
public class BomExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail handleInvalidBomReference(IllegalArgumentException e) {
        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatusCode.valueOf(400));
        problemDetail.setTitle("Composition invalide");
        problemDetail.setDetail(e.getMessage());
        return problemDetail;
    }

    /**
     * Converts BOM persistence failures to HTTP problem details.
     */
    @ExceptionHandler(BomPersistenceException.class)
    public ProblemDetail handleBomPersistenceException(BomPersistenceException e) {
        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        problemDetail.setTitle(e.getMessage());
        problemDetail.setDetail(e.getCause().getMessage());
        return problemDetail;
    }
}
