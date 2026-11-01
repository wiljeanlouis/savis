package com.savouretplus.savis;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import com.savouretplus.savis.catalog.api.CatalogOrderingApi;
import com.savouretplus.savis.sales.quotation.domain.*;
import com.savouretplus.savis.sales.quotation.port.*;
import com.savouretplus.savis.sales.quotation.usecase.*;
import com.savouretplus.savis.sales.order.usecase.OrderService;
import com.savouretplus.savis.sales.invoice.usecase.InvoiceService;

/** Real transactions, migrations, constraints and locks. Requires a disposable PostgreSQL database. */
@SpringBootTest @ActiveProfiles("test")
@EnabledIfEnvironmentVariable(named="SAVIS_TEST_POSTGRES_URL", matches=".+")
class QuoteRequestPostgresTest {
    @DynamicPropertySource static void postgres(DynamicPropertyRegistry properties) {
        properties.add("spring.datasource.url",()->System.getenv("SAVIS_TEST_POSTGRES_URL"));
        properties.add("spring.datasource.username",()->System.getenv("SAVIS_TEST_POSTGRES_USER"));
        properties.add("spring.datasource.password",()->System.getenv("SAVIS_TEST_POSTGRES_PASSWORD"));
        properties.add("spring.datasource.driver-class-name",()->"org.postgresql.Driver");
        properties.add("spring.flyway.enabled",()->"true");
        properties.add("spring.jpa.hibernate.ddl-auto",()->"validate");
    }
    @org.springframework.test.context.bean.override.mockito.MockitoSpyBean QuoteRequestRepository requests;
    @Autowired QuoteRequestService qualification;
    @Autowired CreateQuoteRequestProposal proposals;
    @Autowired QuotationRepository quotations;
    @Autowired QuotationService quotationService;
    @Autowired ImportQuoteRequests importer;
    @Autowired OrderService orders;
    @Autowired InvoiceService invoices;
    @MockitoBean CatalogOrderingApi catalog;
    @MockitoBean QuoteRequestInbox inbox;
    static final UUID PRODUCT=UUID.fromString("10000000-0000-4000-8000-000000000001");
    @BeforeEach void pricing() {
        when(catalog.snapshot(any())).thenReturn(new CatalogOrderingApi.ProductSnapshot(PRODUCT,"Service","SERVICE","STANDARD",null,
                1200,1200,new CatalogOrderingApi.PurchaseModeSnapshot("unit","Unité",1,"NONE"),null,List.of(),List.of()));
    }
    QuoteRequest incoming() {
        return new QuoteRequest(null,UUID.randomUUID(),"savouretplus",UUID.randomUUID(),UUID.randomUUID(),"a".repeat(64),"{}",
                "Client","5145550123",null,Instant.now(),Instant.now(),QuoteRequestStatus.RECEIVED,0,null,null,List.of(),Set.of("service:traiteur"));
    }
    QuoteRequest qualified() {
        var r=requests.insert(incoming());
        return qualification.qualify(r.publicId(),r.version(),new QuoteRequestQualification("Client","5145550123",null,"Interne",List.of(
                new QuoteRequestQualification.Line(UUID.randomUUID(),PRODUCT,2,"unit",null,List.of(),List.of(),Set.of("service:traiteur"))),Map.of()));
    }
    CreateQuoteRequestProposal.Command command(QuoteRequest r,UUID key) {
        return new CreateQuoteRequestProposal.Command(key,r.version(),List.of(r.qualification().lines().getFirst().id()),Map.of(),LocalDate.now().plusDays(30),null,0,0);
    }
    <T> List<T> concurrent(Callable<T> operation) throws Exception {
        var ready=new CountDownLatch(2); var start=new CountDownLatch(1);
        try(var executor=Executors.newFixedThreadPool(2)) {
            Callable<T> job=()->{ready.countDown();assertTrue(start.await(10,TimeUnit.SECONDS));return operation.call();};
            var a=executor.submit(job);var b=executor.submit(job);assertTrue(ready.await(10,TimeUnit.SECONDS));start.countDown();
            return List.of(a.get(30,TimeUnit.SECONDS),b.get(30,TimeUnit.SECONDS));
        }
    }
    @Test void concurrentImportCommitsOneAggregateAndRetriesAcknowledgementWithoutResettingQualification() throws Exception {
        var incoming=incoming();when(inbox.pending(100)).thenReturn(List.of("row"));when(inbox.receptionId("row")).thenReturn(incoming.externalId());when(inbox.decode("row")).thenReturn(incoming);
        var results=concurrent(importer::execute);assertEquals(1,results.stream().mapToInt(ImportQuoteRequests.Result::imported).sum());
        assertEquals(1,results.stream().mapToInt(ImportQuoteRequests.Result::alreadyImported).sum());
        var stored=requests.findExternal(incoming.source(),incoming.externalId()).orElseThrow();
        var saved=qualification.qualify(stored.publicId(),stored.version(),new QuoteRequestQualification("Corrigé","5145550123",null,"Ne pas écraser",List.of(),Map.of()));
        doThrow(new IllegalStateException()).doNothing().when(inbox).acknowledge(incoming.externalId(),true);
        assertEquals(1,importer.execute().acknowledgmentFailed());assertEquals(1,importer.execute().alreadyImported());
        assertEquals(saved.qualification(),requests.find(stored.publicId()).orElseThrow().qualification());
    }
    @Test void concurrentReplayReturnsOneQuotationAndConflictingReplayFailsEvenAfterClosure() throws Exception {
        var r=qualified();var cmd=command(r,UUID.randomUUID());
        var results=concurrent(()->proposals.execute(r.publicId(),cmd));assertEquals(results.get(0).publicId(),results.get(1).publicId());
        assertEquals(1,quotations.findBySource(r.publicId()).size());
        var current=requests.find(r.publicId()).orElseThrow();qualification.status(r.publicId(),current.version(),QuoteRequestStatus.CLOSED,"Terminé");
        assertEquals(results.getFirst().publicId(),proposals.execute(r.publicId(),cmd).publicId());
        var conflict=new CreateQuoteRequestProposal.Command(cmd.proposalRequestId(),cmd.expectedVersion(),cmd.lineIds(),cmd.exclusions(),cmd.validUntil(),"Différent",0,0);
        assertThrows(IllegalStateException.class,()->proposals.execute(r.publicId(),conflict));
    }
    @Test void staleQualificationIsRejectedAndFailedPricingRollsBack() {
        var r=qualified();assertThrows(IllegalStateException.class,()->qualification.qualify(r.publicId(),0,r.qualification()));
        when(catalog.snapshot(any())).thenThrow(new IllegalArgumentException("Indisponible"));
        assertThrows(IllegalArgumentException.class,()->proposals.execute(r.publicId(),command(r,UUID.randomUUID())));
        assertTrue(quotations.findBySource(r.publicId()).isEmpty());assertEquals(r.version(),requests.find(r.publicId()).orElseThrow().version());
    }
    @Test void multipleProposalsKeepOriginThroughEditsAndConvertIndependentlyWithSnapshotPrices() {
        var r=qualified();var first=proposals.execute(r.publicId(),command(r,UUID.randomUUID()));
        var current=requests.find(r.publicId()).orElseThrow();var second=proposals.execute(r.publicId(),command(current,UUID.randomUUID()));
        assertNotEquals(first.publicId(),second.publicId());assertEquals(2,quotations.findBySource(r.publicId()).size());
        first=quotationService.update(first.publicId(),new SaveQuotationCommand("Client","5145550123",null,null,LocalDate.now().plusDays(30),"Modifié",0,0,
                List.of(new SaveQuotationCommand.Item(PRODUCT,2,"unit",null,List.of(),List.of()))));
        assertEquals(r.publicId(),first.sourceQuoteRequestId());
        when(catalog.snapshot(any())).thenThrow(new IllegalArgumentException("Produit retiré après création"));
        Set<UUID> orderIds=new HashSet<>();
        for(var q:List.of(first,second)) {
            quotationService.changeStatus(q.publicId(),QuotationStatus.SENT);quotationService.changeStatus(q.publicId(),QuotationStatus.ACCEPTED);
            UUID orderId=quotationService.convert(q.publicId());orderIds.add(orderId);
            assertEquals(2400,orders.get(orderId).totalCents());assertEquals(2400,invoices.createFromOrder(orderId).totalCents());
            assertEquals(orderId,quotationService.convert(q.publicId()));
        }
        assertEquals(2,orderIds.size());
    }
    @Test void failureAfterQuotationInsertionRollsBackOriginAndStatusTogether() {
        var r=qualified();
        doThrow(new IllegalStateException("Échec simulé après insertion du devis")).when(requests).save(any());
        assertThrows(IllegalStateException.class,()->proposals.execute(r.publicId(),command(r,UUID.randomUUID())));
        assertTrue(quotations.findBySource(r.publicId()).isEmpty());
        assertEquals(r.version(),requests.find(r.publicId()).orElseThrow().version());
    }
    @Test void proposalCannotIgnoreOrInventNeeds() {
        var incoming=incoming();
        var received=requests.insert(new QuoteRequest(null,incoming.publicId(),incoming.source(),incoming.externalId(),incoming.submissionRequestId(),
                incoming.fingerprint(),incoming.originalPayload(),incoming.customerName(),incoming.customerPhone(),null,incoming.receivedAt(),incoming.importedAt(),
                QuoteRequestStatus.RECEIVED,0,null,null,List.of(),Set.of("service:traiteur","service:organisation")));
        var r=qualification.qualify(received.publicId(),0,new QuoteRequestQualification("Client","5145550123",null,null,List.of(
                new QuoteRequestQualification.Line(UUID.randomUUID(),PRODUCT,1,"unit",null,List.of(),List.of(),Set.of("service:traiteur"))),Map.of()));
        assertThrows(IllegalArgumentException.class,()->proposals.execute(r.publicId(),command(r,UUID.randomUUID())));
        var cmd=command(r,UUID.randomUUID());
        var explicit=new CreateQuoteRequestProposal.Command(cmd.proposalRequestId(),cmd.expectedVersion(),cmd.lineIds(),Map.of("service:organisation","À traiter dans une autre proposition"),cmd.validUntil(),null,0,0);
        assertNotNull(proposals.execute(r.publicId(),explicit));
    }
    @Test void paginationUsesStableUuidTieBreakAndBoundedStatusFilter() {
        String name="Page "+UUID.randomUUID();var at=Instant.now();
        for(int index=0;index<3;index++) {
            var r=incoming();requests.insert(new QuoteRequest(null,r.publicId(),r.source(),r.externalId(),null,r.fingerprint(),"{}",name,"5145550123",null,at,at));
        }
        var a=requests.list(0,2,name,true,"RECEIVED");var b=requests.list(1,2,name,true,"RECEIVED");
        assertEquals(3,a.totalElements());assertEquals(2,a.content().size());assertEquals(1,b.content().size());
        var ids=new HashSet<UUID>();a.content().forEach(r->ids.add(r.publicId()));b.content().forEach(r->ids.add(r.publicId()));assertEquals(3,ids.size());
        assertEquals(a.content(),requests.list(0,2,name,true,"RECEIVED").content());
    }
    @Test void rejectionDoesNotCloseRequestOrPreventAnotherAcceptedProposal() {
        var r=qualified();var q=proposals.execute(r.publicId(),command(r,UUID.randomUUID()));
        quotationService.changeStatus(q.publicId(),QuotationStatus.SENT);quotationService.changeStatus(q.publicId(),QuotationStatus.REJECTED);
        var current=requests.find(r.publicId()).orElseThrow();assertEquals(QuoteRequestStatus.QUOTED,current.status());
        assertNotNull(proposals.execute(r.publicId(),command(current,UUID.randomUUID())));
    }
}
