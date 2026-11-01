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
    final org.springframework.test.web.servlet.MockMvc mvc=MockMvcBuilders.standaloneSetup(new QuoteRequestController(
            requests,mock(ImportQuoteRequests.class),proposals,mock(QuotationRepository.class),service))
            .setControllerAdvice(new QuoteRequestExceptionHandler()).build();
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
                .content("{\"note\":\"secret contact\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.detail").value("Commande de proposition invalide"))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("secret contact"))));
    }
    @Test void excessivePageSizeAndUnknownSortReturn400() throws Exception {
        mvc.perform(get("/api/quote-requests?size=101")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/quote-requests?sort=customerEmail,desc")).andExpect(status().isBadRequest());
        verifyNoInteractions(requests);
    }
}
