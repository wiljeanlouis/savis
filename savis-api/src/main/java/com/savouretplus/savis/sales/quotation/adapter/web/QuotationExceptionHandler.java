package com.savouretplus.savis.sales.quotation.adapter.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.savouretplus.savis.sales.quotation.usecase.QuotationNotFoundException;

/** Maps quotation errors to stable Problem Details responses. */
@RestControllerAdvice(assignableTypes = QuotationController.class)
public class QuotationExceptionHandler {
    /** Maps unknown quotation identifiers. */
    @ExceptionHandler(QuotationNotFoundException.class)
    ProblemDetail handleNotFound(QuotationNotFoundException exception) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
        problem.setTitle("Soumission introuvable");
        problem.setDetail(exception.getMessage());
        return problem;
    }

    /** Maps forbidden state changes and repeated incompatible operations. */
    @ExceptionHandler(IllegalStateException.class)
    ProblemDetail handleState(IllegalStateException exception) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        problem.setTitle("Opération de soumission impossible");
        problem.setDetail(exception.getMessage());
        return problem;
    }

    /** Maps invalid commercial or configuration data. */
    @ExceptionHandler({IllegalArgumentException.class, ArithmeticException.class})
    ProblemDetail handleInvalid(RuntimeException exception) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setTitle("Soumission invalide");
        problem.setDetail(exception.getMessage());
        return problem;
    }
}
