package com.savouretplus.savis.sales.quotation.usecase;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.time.Instant;
import java.util.*;
import com.savouretplus.savis.sales.quotation.domain.QuoteRequest;
import com.savouretplus.savis.sales.quotation.port.*;
class ImportQuoteRequestsTest {
    final QuoteRequestInbox inbox=mock(QuoteRequestInbox.class);
    final QuoteRequestRepository repository=mock(QuoteRequestRepository.class);
    final ImportQuoteRequests importer=new ImportQuoteRequests(inbox,repository);
    QuoteRequest request(UUID id) { return new QuoteRequest(null,UUID.randomUUID(),"savouretplus",id,null,"a".repeat(64),"{}","Client","5145550123",null,Instant.now(),Instant.now()); }
    @Test void commitPrecedesAcknowledgementAndMalformedRowsDoNotPoisonBatch() {
        UUID bad=UUID.randomUUID(),good=UUID.randomUUID(); var request=request(good);
        when(inbox.pending(100)).thenReturn(List.of("bad","good"));
        when(inbox.receptionId("bad")).thenReturn(bad); when(inbox.receptionId("good")).thenReturn(good);
        when(inbox.decode("bad")).thenThrow(new IllegalArgumentException()); when(inbox.decode("good")).thenReturn(request);
        when(repository.findExternal("savouretplus",good)).thenReturn(Optional.empty());
        var result=importer.execute(); assertEquals(1,result.failed()); assertEquals(1,result.imported());
        var order=inOrder(repository,inbox); order.verify(repository).insert(request); order.verify(inbox).acknowledge(good,true);
    }
    @Test void acknowledgementRetryDoesNotRewriteLocalRequest() {
        UUID id=UUID.randomUUID(); var request=request(id);
        when(inbox.pending(100)).thenReturn(List.of("row")); when(inbox.receptionId("row")).thenReturn(id);
        when(inbox.decode("row")).thenReturn(request);
        when(repository.findExternal("savouretplus",id)).thenReturn(Optional.of(request));
        doThrow(new RuntimeException()).doNothing().when(inbox).acknowledge(id,true);
        assertEquals(1,importer.execute().acknowledgmentFailed());
        assertEquals(1,importer.execute().alreadyImported()); verify(repository,never()).insert(any());
    }
    @Test void importReportsControlledReasonsAndNeverLeaksTechnicalMessages() {
        UUID id=UUID.randomUUID();
        when(inbox.pending(100)).thenReturn(List.of("row"));when(inbox.receptionId("row")).thenReturn(id);
        when(inbox.decode("row")).thenThrow(new com.savouretplus.savis.sales.quotation.domain.QuoteRequestValidationException("La date de l’événement est invalide"));
        assertEquals("La date de l’événement est invalide",importer.execute().failures().getFirst().reason());
        doThrow(new RuntimeException("secret payload")).when(inbox).decode("row");
        assertFalse(importer.execute().failures().getFirst().reason().contains("secret payload"));
    }
    @Test void uniquenessRaceIsRecoveredOutsideInsertTransaction() {
        UUID id=UUID.randomUUID();var request=request(id);
        when(inbox.pending(100)).thenReturn(List.of("row"));when(inbox.receptionId("row")).thenReturn(id);when(inbox.decode("row")).thenReturn(request);
        when(repository.findExternal("savouretplus",id)).thenReturn(Optional.empty(),Optional.of(request));
        when(repository.insert(request)).thenThrow(new org.springframework.dao.DataIntegrityViolationException("unique"));
        assertEquals(1,importer.execute().alreadyImported());verify(inbox).acknowledge(id,true);
    }
}
