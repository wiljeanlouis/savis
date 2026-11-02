package com.savouretplus.savis.sales.quotation.usecase;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import com.savouretplus.savis.catalog.api.CatalogOrderingApi;
import com.savouretplus.savis.sales.quotation.adapter.supabase.QuoteRequestSelectionMapper;
import com.savouretplus.savis.sales.quotation.domain.*;

class PrepareQuoteRequestTest {
    final UUID product = UUID.randomUUID();
    final CatalogOrderingApi catalog = mock(CatalogOrderingApi.class);
    final PrepareQuoteRequest preparation = new PrepareQuoteRequest(new QuoteRequestSelectionMapper(), catalog);
    @BeforeEach void product() {
        when(catalog.identify(product)).thenReturn(new CatalogOrderingApi.ProductIdentity(product,"Catalog actuel",true));
    }
    QuoteRequest request(String config, QuoteRequestQualification saved) {
        String payload = """
                {"items":[{"offering_id":"%s","name":"Produit demandé","requested_quantity":7,
                "configuration":%s}]}
                """.formatted(product,config);
        return new QuoteRequest(1L,UUID.randomUUID(),"savouretplus",UUID.randomUUID(),null,"a".repeat(64),payload,
                "Client","5145550123",null,Instant.now(),Instant.now(),QuoteRequestStatus.RECEIVED,0,saved,null,List.of(),
                Set.of("item:0","service:organisation"));
    }
    String config() {
        return """
                {"purchase_mode":{"id":"dozen"},"selection":{"choice_id":"chicken"},
                "allocation":[{"choice_id":"beef","quantity":12}],
                "ingredients":[{"id":"sauce","quantity":0,"extra_price_cents":999999}],"price":1}
                """;
    }
    @Test void mapsPublicIdentifiersQuantityAndConfigurationWithoutPrices() {
        var result=preparation.execute(request(config(),null));
        var line=result.qualification().lines().getFirst();
        assertEquals(product,line.productId());assertEquals(7,line.quantity());
        assertEquals("dozen",line.purchaseModeCode());assertEquals("chicken",line.choiceCode());
        assertEquals(List.of(new QuoteRequestQualification.Allocation("beef",12)),line.allocations());
        assertEquals(List.of(new QuoteRequestQualification.Ingredient("sauce",0)),line.ingredients());
        assertEquals(Set.of("item:0"),line.needKeys());
        assertEquals(PrepareQuoteRequest.State.RECOGNIZED,result.needs().getFirst().state());
        assertEquals(PrepareQuoteRequest.State.CUSTOM,result.needs().getLast().state());
        verify(catalog).snapshot(new CatalogOrderingApi.ProductSelection(product,"dozen","chicken",
                List.of(new CatalogOrderingApi.ChoiceAllocation("beef",12)),List.of(new CatalogOrderingApi.IngredientSelection("sauce",0))));
        assertFalse(result.saved());
    }
    @Test void repeatedOpeningIsDeterministicWithoutSavingOrDuplicating() {
        var request=request(config(),null);
        assertEquals(preparation.execute(request),preparation.execute(request));
        assertNull(request.qualification());assertEquals(0,request.version());assertTrue(request.history().isEmpty());
        assertEquals(1,preparation.execute(request).qualification().lines().size());
    }
    @Test void missingProductIsUnresolved() {
        when(catalog.identify(product)).thenThrow(new IllegalArgumentException());
        var result=preparation.execute(request(config(),null));
        assertEquals(PrepareQuoteRequest.State.UNRESOLVED,result.needs().getFirst().state());
        assertTrue(result.qualification().lines().isEmpty());verify(catalog,never()).snapshot(any());
    }
    @Test void unavailableProductRequiresReview() {
        when(catalog.identify(product)).thenReturn(new CatalogOrderingApi.ProductIdentity(product,"Retiré",false));
        var result=preparation.execute(request(config(),null));
        assertEquals(PrepareQuoteRequest.State.REVIEW,result.needs().getFirst().state());
        assertTrue(result.qualification().lines().isEmpty());verify(catalog,never()).snapshot(any());
    }
    @Test void obsoleteConfigurationRequiresReviewAndKeepsRequestedSelection() {
        when(catalog.snapshot(any())).thenThrow(new IllegalArgumentException("Choix inactif"));
        var result=preparation.execute(request(config(),null));
        assertEquals(PrepareQuoteRequest.State.REVIEW,result.needs().getFirst().state());
        assertEquals("Choix inactif",result.needs().getFirst().issue());
        assertNotNull(result.needs().getFirst().requestedLine());assertTrue(result.qualification().lines().isEmpty());
    }
    @Test void malformedConfigurationDoesNotGuessValues() {
        var result=preparation.execute(request("{\"allocation\":{},\"purchase_mode\":{\"label\":\"Douzaine\"}}",null));
        assertEquals(PrepareQuoteRequest.State.REVIEW,result.needs().getFirst().state());
        assertTrue(result.qualification().lines().isEmpty());verify(catalog,never()).snapshot(any());
    }
    @Test void savedManualLinesQuantitiesConfigurationNotesAndExclusionsWinEvenWhenCatalogChanges() {
        var manual=new QuoteRequestQualification.Line(UUID.randomUUID(),UUID.randomUUID(),23,"custom","choice",List.of(),List.of(),Set.of("item:0"));
        var saved=new QuoteRequestQualification("Corrigé","5145550199","client@example.test","Notes conservées",List.of(manual),Map.of("service:organisation","Non proposé"));
        when(catalog.identify(product)).thenThrow(new IllegalArgumentException());
        var result=preparation.execute(request(config(),saved));
        assertSame(saved,result.qualification());assertTrue(result.saved());
        assertEquals(manual.id(),result.qualification().lines().getFirst().id());
    }
    @Test void freeRequestHasNoInventedProduct() {
        var request=request(config(),null);
        request=new QuoteRequest(request.id(),request.publicId(),request.source(),request.externalId(),null,request.fingerprint(),"{\"items\":[]}",
                request.customerName(),request.customerPhone(),null,request.receivedAt(),request.importedAt(),QuoteRequestStatus.RECEIVED,0,null,null,List.of(),Set.of("service:organisation"));
        var result=preparation.execute(request);
        assertTrue(result.qualification().lines().isEmpty());assertEquals(PrepareQuoteRequest.State.CUSTOM,result.needs().getFirst().state());
        verifyNoInteractions(catalog);
    }
}
