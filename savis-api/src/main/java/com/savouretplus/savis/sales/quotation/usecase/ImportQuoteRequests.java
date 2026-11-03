package com.savouretplus.savis.sales.quotation.usecase;

import com.savouretplus.savis.sales.quotation.domain.QuoteRequestValidationException;
import com.savouretplus.savis.sales.quotation.domain.QuoteRequestConflictException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.dao.DataIntegrityViolationException;
import com.savouretplus.savis.sales.quotation.domain.QuoteRequest;
import com.savouretplus.savis.sales.quotation.port.QuoteRequestInbox;
import com.savouretplus.savis.sales.quotation.port.QuoteRequestRepository;
import lombok.RequiredArgsConstructor;

/**
 * No encompassing transaction: every insert commits before its network
 * acknowledgement.
 */
@Service
@RequiredArgsConstructor
public class ImportQuoteRequests {
    private final QuoteRequestInbox inbox;
    private final QuoteRequestRepository repository;

    public Result execute() {
        List<String> rows = inbox.pending(100);
        int imported = 0, existing = 0, failed = 0, ackFailed = 0;
        List<Failure> failures = new ArrayList<>();
        for (String row : rows) {
            UUID id = null;
            try {
                id = inbox.receptionId(row);
                QuoteRequest incoming = inbox.decode(row);
                var stored = repository.findExternal(incoming.source(), incoming.externalId());
                if (stored.isPresent()) {
                    same(stored.get(), incoming);
                    existing++;
                } else {
                    try {
                        repository.insert(incoming);
                        imported++;
                    } catch (DataIntegrityViolationException collision) {
                        // insert transaction has ended; read the winning commit in a fresh transaction.
                        same(repository.findExternal(incoming.source(), incoming.externalId())
                                .orElseThrow(() -> collision), incoming);
                        existing++;
                    }
                }
                try {
                    inbox.acknowledge(id, true);
                } catch (RuntimeException error) {
                    ackFailed++;
                    failures.add(new Failure(id, "ACKNOWLEDGEMENT_FAILED", "La synchronisation avec Supabase n’a pas pu être confirmée. Relancez l’import"));
                }
            } catch (RuntimeException error) {
                failed++;
                failures.add(new Failure(id, "INVALID_OR_CONFLICTING_REQUEST", reason(error)));
                if (id != null)
                    try {
                        inbox.acknowledge(id, false);
                    } catch (RuntimeException ack) {
                        ackFailed++;
                        failures.add(new Failure(id, "ACKNOWLEDGEMENT_FAILED", "La synchronisation avec Supabase n’a pas pu être confirmée. Relancez l’import"));
                    }
            }
        }
        return new Result(rows.size(), imported, existing, failed, ackFailed, List.copyOf(failures));
    }

    private void same(QuoteRequest stored, QuoteRequest incoming) {
        if (!stored.fingerprint().equals(incoming.fingerprint()))
            throw new QuoteRequestConflictException("Cette réception diffère de la demande déjà importée. Le contenu local a été conservé");
    }

    private String reason(RuntimeException error) {
        if (error instanceof QuoteRequestValidationException || error instanceof QuoteRequestConflictException) return error.getMessage();
        return "La demande n’a pas pu être importée. Vérifiez son format et les diagnostics du serveur";
    }

    public record Failure(UUID externalId, String code, String reason) {
    }

    public record Result(int fetched, int imported, int alreadyImported, int failed, int acknowledgmentFailed,
            List<Failure> failures) {
    }
}
