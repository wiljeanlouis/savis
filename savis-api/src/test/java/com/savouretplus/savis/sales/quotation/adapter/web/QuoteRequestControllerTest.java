package com.savouretplus.savis.sales.quotation.adapter.web;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import com.savouretplus.savis.sales.quotation.port.*;
import com.savouretplus.savis.sales.quotation.usecase.*;
class QuoteRequestControllerTest {
    final QuoteRequestService service=mock(QuoteRequestService.class);
    final QuoteRequestRepository requests=mock(QuoteRequestRepository.class);
    final CreateQuoteRequestProposal proposals=mock(CreateQuoteRequestProposal.class);
    final PrepareQuoteRequest preparation=mock(PrepareQuoteRequest.class);
    final org.springframework.test.web.servlet.MockMvc mvc=MockMvcBuilders.standaloneSetup(new QuoteRequestController(
            requests,mock(ImportQuoteRequests.class),proposals,mock(QuotationRepository.class),service,preparation))
            .setControllerAdvice(new QuoteRequestExceptionHandler()).build();
    @Test void detailReturnsReadOnlyPreparationWithoutSavingQualification() throws Exception {
        var id=UUID.randomUUID();var now=java.time.Instant.now();
        var request=new com.savouretplus.savis.sales.quotation.domain.QuoteRequest(1L,id,"savouretplus",UUID.randomUUID(),null,"a".repeat(64),"{}","Client","5145550123",null,now,now);
        var qualification=new com.savouretplus.savis.sales.quotation.domain.QuoteRequestQualification("Client","5145550123",null,null,java.util.List.of(),java.util.Map.of());
        when(requests.find(id)).thenReturn(java.util.Optional.of(request));
        when(preparation.execute(request)).thenReturn(new PrepareQuoteRequest.Preparation(qualification,java.util.List.of(),false));
        for(int index=0;index<2;index++) mvc.perform(get("/api/quote-requests/"+id))
                .andExpect(status().isOk()).andExpect(header().string("Cache-Control","no-store"))
                .andExpect(jsonPath("$.qualification").doesNotExist()).andExpect(jsonPath("$.version").value(0))
                .andExpect(jsonPath("$.preparation.saved").value(false))
                .andExpect(jsonPath("$.preparation.qualification.customerName").value("Client"));
        verify(requests,never()).save(any());verify(requests,never()).insert(any());verify(requests,never()).lock(any());
    }
    @Test void staleVersionReturns409WithoutPersonalData() throws Exception {
        doThrow(new IllegalStateException("secret contact")).when(service).status(any(),eq(2L),any(),any());
        mvc.perform(put("/api/quote-requests/"+UUID.randomUUID()+"/status").contentType(MediaType.APPLICATION_JSON)
                .content("{\"expectedVersion\":2,\"status\":\"CLOSED\",\"reason\":\"Abandon\"}"))
                .andExpect(status().isConflict()).andExpect(header().string("Cache-Control","no-store"))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("secret contact"))));
    }
    @Test void businessConflictExposesItsReason() throws Exception {
        doThrow(new com.savouretplus.savis.sales.quotation.domain.QuoteRequestConflictException("La demande est clôturée"))
                .when(service).status(any(),eq(2L),any(),any());
        mvc.perform(put("/api/quote-requests/"+UUID.randomUUID()+"/status").contentType(MediaType.APPLICATION_JSON)
                .content("{\"expectedVersion\":2,\"status\":\"CLOSED\",\"reason\":\"Abandon\"}"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.detail").value("La demande est clôturée"));
    }
    @Test void qualificationValidationIncludesTheBusinessReason() throws Exception {
        doThrow(new com.savouretplus.savis.sales.quotation.domain.QuoteRequestValidationException("Le motif de clôture est obligatoire"))
                .when(service).status(any(),eq(2L),any(),any());
        mvc.perform(put("/api/quote-requests/"+UUID.randomUUID()+"/status").contentType(MediaType.APPLICATION_JSON)
                .content("{\"expectedVersion\":2,\"status\":\"CLOSED\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.detail").value("Le motif de clôture est obligatoire"));
    }
    @Test void validationFromJsonConstructorIsAlsoExposedWithoutEchoingPayload() throws Exception {
        mvc.perform(post("/api/quote-requests/"+UUID.randomUUID()+"/quotations").contentType(MediaType.APPLICATION_JSON)
                .content("{\"note\":\"secret contact\",\"discountCents\":0,\"deliveryFeeCents\":0}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.detail").value("Commande de proposition invalide"))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("secret contact"))));
    }
    @Test void excessivePageSizeAndUnknownSortReturn400() throws Exception {
        mvc.perform(get("/api/quote-requests?size=101")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/quote-requests?sort=customerEmail,desc")).andExpect(status().isBadRequest());
        verifyNoInteractions(requests);
    }
}
