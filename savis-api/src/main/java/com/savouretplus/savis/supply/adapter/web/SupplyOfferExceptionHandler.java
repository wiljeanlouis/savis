package com.savouretplus.savis.supply.adapter.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Maps invalid Supply offer queries to a stable Problem Details response. */
@RestControllerAdvice(assignableTypes = SupplyOfferController.class)
public class SupplyOfferExceptionHandler {

    /** Maps invalid pagination, status, search, or sort parameters. */
    @ExceptionHandler(IllegalArgumentException.class)
    ProblemDetail handleInvalidQuery(IllegalArgumentException exception) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setTitle("Paramètres de consultation des offres invalides");
        problem.setDetail(exception.getMessage());
        return problem;
    }
}
