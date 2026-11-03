package com.savouretplus.savis.sales.quotation.adapter.web;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import com.savouretplus.savis.sales.quotation.adapter.supabase.InboxUnavailableException;
@RestControllerAdvice(assignableTypes=QuoteRequestController.class)
public class QuoteRequestExceptionHandler {
    @ExceptionHandler(com.savouretplus.savis.sales.quotation.domain.QuoteRequestValidationException.class)
    ProblemDetail businessValidation(com.savouretplus.savis.sales.quotation.domain.QuoteRequestValidationException error) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, error.getMessage());
    }
    @ExceptionHandler(com.savouretplus.savis.sales.quotation.domain.QuoteRequestConflictException.class)
    ProblemDetail businessConflict(com.savouretplus.savis.sales.quotation.domain.QuoteRequestConflictException error) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, error.getMessage());
    }
    @ExceptionHandler(com.savouretplus.savis.sales.quotation.usecase.QuoteRequestNotFoundException.class) ProblemDetail missing() {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND,"Demande introuvable");
    }
    @ExceptionHandler({IllegalStateException.class,org.springframework.dao.OptimisticLockingFailureException.class}) ProblemDetail conflict() {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,"La demande a évolué ou l'opération est incompatible avec son état. Rechargez la demande");
    }
    @ExceptionHandler(IllegalArgumentException.class) ProblemDetail invalid() {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,"Demande ou paramètres invalides");
    }
    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    ProblemDetail unreadable(org.springframework.http.converter.HttpMessageNotReadableException error) {
        Throwable cause = error;
        for (int depth = 0; cause != null && depth < 20; depth++, cause = cause.getCause()) {
            if (cause instanceof com.savouretplus.savis.sales.quotation.domain.QuoteRequestValidationException business) {
                return businessValidation(business);
            }
        }
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Le contenu de la demande est invalide");
    }
    @ExceptionHandler(InboxUnavailableException.class) ProblemDetail unavailable() {
        return ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE,"La réception Supabase est indisponible");
    }
}
