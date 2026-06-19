package com.savouretplus.savis.bom.adapter.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.savouretplus.savis.bom.adapter.persistence.BomPersistenceException;

/**
 * Maps BOM-related domain and persistence exceptions to HTTP responses.
 */
@RestControllerAdvice
public class BomExceptionHandler {

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
