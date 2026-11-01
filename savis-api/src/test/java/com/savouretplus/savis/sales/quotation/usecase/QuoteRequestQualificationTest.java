package com.savouretplus.savis.sales.quotation.usecase;
import static org.junit.jupiter.api.Assertions.*;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.Test;
import com.savouretplus.savis.sales.quotation.domain.*;
class QuoteRequestQualificationTest {
    QuoteRequest request() { return new QuoteRequest(1L,UUID.randomUUID(),"savouretplus",UUID.randomUUID(),null,"a".repeat(64),"{}","Initial","5145550123",null,Instant.now(),Instant.now()); }
    QuoteRequestQualification qualification() { return new QuoteRequestQualification("Corrigé","5145550123",null,"Interne",List.of(),Map.of()); }
    @Test void qualificationKeepsOriginalImmutableAndRecordsHistory() {
        var original=request();var qualified=original.qualify(0,qualification(),Instant.now());
        assertEquals("Initial",qualified.customerName());assertEquals("Corrigé",qualified.qualification().customerName());
        assertEquals(original.originalPayload(),qualified.originalPayload());assertEquals(1,qualified.history().size());
        assertEquals(QuoteRequestStatus.IN_PROGRESS,qualified.status());
    }
    @Test void staleVersionIsActuallyCompared() { assertThrows(IllegalStateException.class,()->request().qualify(12,qualification(),Instant.now())); }
    @Test void closedRequestRequiresReasonAndRejectsChanges() {
        assertThrows(IllegalArgumentException.class,()->request().changeStatus(0,QuoteRequestStatus.CLOSED," ",Instant.now()));
        var closed=request().changeStatus(0,QuoteRequestStatus.CLOSED,"Abandon",Instant.now());
        assertThrows(IllegalStateException.class,()->closed.qualify(0,qualification(),Instant.now()));
    }
    @Test void quotedStillAcceptsQualificationAndAdditionalProposals() {
        var quoted=request().quoted(0,Instant.now());
        assertEquals(QuoteRequestStatus.QUOTED,quoted.qualify(0,qualification(),Instant.now()).status());
        assertEquals(QuoteRequestStatus.QUOTED,quoted.quoted(0,Instant.now()).status());
    }
}
