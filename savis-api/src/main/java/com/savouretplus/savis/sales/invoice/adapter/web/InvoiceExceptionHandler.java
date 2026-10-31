package com.savouretplus.savis.sales.invoice.adapter.web;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.savouretplus.savis.sales.invoice.usecase.InvoiceNotFoundException;
import com.savouretplus.savis.sales.order.api.InvoiceSourceOrderNotFoundException;

/** Maps invoice errors to stable Problem Details responses. */
@RestControllerAdvice(assignableTypes = InvoiceController.class)
public class InvoiceExceptionHandler {
    /** Maps unknown invoice and source-order identifiers. */
    @ExceptionHandler({InvoiceNotFoundException.class, InvoiceSourceOrderNotFoundException.class})
    ProblemDetail handleNotFound(RuntimeException exception) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
        problem.setTitle("Facture ou commande introuvable");
        problem.setDetail(exception.getMessage());
        return problem;
    }

    /** Maps forbidden transitions and concurrent uniqueness conflicts. */
    @ExceptionHandler({IllegalStateException.class, DataIntegrityViolationException.class})
    ProblemDetail handleConflict(RuntimeException exception) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        problem.setTitle("Opération de facturation impossible");
        problem.setDetail(exception.getMessage());
        return problem;
    }

    /** Maps invalid customer or financial data. */
    @ExceptionHandler({IllegalArgumentException.class, ArithmeticException.class})
    ProblemDetail handleInvalid(RuntimeException exception) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setTitle("Facture invalide");
        problem.setDetail(exception.getMessage());
        return problem;
    }
}
