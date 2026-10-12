package com.savouretplus.savis.order.adapter.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.savouretplus.savis.order.usecase.OrderNotFoundException;

/**
 * Maps order errors to stable Problem Details responses.
 */
@RestControllerAdvice(assignableTypes = OrderController.class)
public class OrderExceptionHandler {
    @ExceptionHandler(OrderNotFoundException.class)
    ProblemDetail handleNotFound(OrderNotFoundException exception) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
        problem.setTitle("Commande introuvable");
        problem.setDetail(exception.getMessage());
        return problem;
    }

    @ExceptionHandler(IllegalStateException.class)
    ProblemDetail handleState(IllegalStateException exception) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        problem.setTitle("Opération de commande impossible");
        problem.setDetail(exception.getMessage());
        return problem;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ProblemDetail handleInvalid(IllegalArgumentException exception) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setTitle("Commande invalide");
        problem.setDetail(exception.getMessage());
        return problem;
    }
}
