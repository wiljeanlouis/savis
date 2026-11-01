package com.savouretplus.savis.sales.quotation.domain;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Incoming need, independent of any commercial proposal. Original JSON is immutable. */
public record QuoteRequest(Long id, UUID publicId, String source, UUID externalId,
        UUID submissionRequestId, String fingerprint, String originalPayload,
        String customerName, String customerPhone, String customerEmail,
        Instant receivedAt, Instant importedAt, QuoteRequestStatus status, long version,
        QuoteRequestQualification qualification, String closedReason, List<Change> history, java.util.Set<String> needKeys) {
    public QuoteRequest(Long id, UUID publicId, String source, UUID externalId, UUID submissionRequestId,
            String fingerprint, String originalPayload, String customerName, String customerPhone, String customerEmail,
            Instant receivedAt, Instant importedAt) {
        this(id,publicId,source,externalId,submissionRequestId,fingerprint,originalPayload,customerName,customerPhone,
                customerEmail,receivedAt,importedAt,QuoteRequestStatus.RECEIVED,0,null,null,List.of(),java.util.Set.of());
    }
    public QuoteRequest {
        if (status == null || version < 0 || publicId == null || externalId == null || receivedAt == null || importedAt == null
                || source == null || source.isBlank() || customerName == null || customerName.isBlank()
                || customerPhone == null || customerPhone.isBlank() || originalPayload == null
                || fingerprint == null || fingerprint.length() != 64) {
            throw new QuoteRequestValidationException("Demande de soumission invalide");
        }
        history=List.copyOf(history); needKeys=java.util.Set.copyOf(needKeys);
    }
    public QuoteRequest qualify(long expectedVersion,QuoteRequestQualification next,Instant at) {
        editable(expectedVersion); next.validateNeeds(needKeys);
        var changes=new java.util.ArrayList<>(history);
        changes.add(new Change(at,"QUALIFICATION",status,null,next));
        return copy(status==QuoteRequestStatus.RECEIVED?QuoteRequestStatus.IN_PROGRESS:status,next,null,changes);
    }
    public QuoteRequest changeStatus(long expectedVersion,QuoteRequestStatus next,String reason,Instant at) {
        editable(expectedVersion);
        if(next==null || next==QuoteRequestStatus.RECEIVED || next==QuoteRequestStatus.QUOTED
                || status==QuoteRequestStatus.QUOTED && next!=QuoteRequestStatus.CLOSED)
            throw new QuoteRequestConflictException("Transition de demande invalide");
        if(next==QuoteRequestStatus.CLOSED && (reason==null || reason.isBlank() || reason.length()>2000))
            throw new QuoteRequestValidationException("Le motif de clôture est obligatoire");
        var changes=new java.util.ArrayList<>(history); changes.add(new Change(at,"STATUS",next,reason,null));
        return copy(next,qualification,next==QuoteRequestStatus.CLOSED?reason:null,changes);
    }
    public QuoteRequest quoted(long expectedVersion,Instant at) {
        editable(expectedVersion);
        var changes=new java.util.ArrayList<>(history); changes.add(new Change(at,"PROPOSAL_CREATED",QuoteRequestStatus.QUOTED,null,null));
        return copy(QuoteRequestStatus.QUOTED,qualification,null,changes);
    }
    public void editable(long expectedVersion) {
        if(expectedVersion!=version) throw new QuoteRequestConflictException("La demande a été modifiée. Rechargez-la avant de réessayer");
        if(status==QuoteRequestStatus.CLOSED) throw new QuoteRequestConflictException("La demande est clôturée");
    }
    private QuoteRequest copy(QuoteRequestStatus next,QuoteRequestQualification qualified,String reason,List<Change> changes) {
        return new QuoteRequest(id,publicId,source,externalId,submissionRequestId,fingerprint,originalPayload,
                customerName,customerPhone,customerEmail,receivedAt,importedAt,next,version,qualified,reason,changes,needKeys);
    }
    public record Change(Instant at,String action,QuoteRequestStatus status,String reason,QuoteRequestQualification qualification) {}
}
