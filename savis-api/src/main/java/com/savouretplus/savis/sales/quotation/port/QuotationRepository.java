package com.savouretplus.savis.sales.quotation.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.savouretplus.savis.sales.quotation.domain.Quotation;

/** Defines persistence operations for quotations. */
public interface QuotationRepository {
    record Proposal(Quotation quotation,String fingerprint) {}
    Optional<Proposal> findProposal(UUID sourceId,UUID proposalId);
    Quotation attachSource(UUID quotationId,UUID sourceId,UUID proposalId,String fingerprint,java.util.Map<String,String> exclusions);
    List<Quotation> findBySource(UUID sourceId);

    /** Persists the quotation aggregate and returns its stored representation. */
    Quotation save(Quotation quotation);

    /** Finds a quotation by its public identifier. */
    Optional<Quotation> findByPublicId(UUID publicId);

    /** Finds and locks a quotation for a state-changing operation. */
    Optional<Quotation> findByPublicIdForUpdate(UUID publicId);

    /** Returns all quotations from newest to oldest. */
    List<Quotation> findAll();
}
