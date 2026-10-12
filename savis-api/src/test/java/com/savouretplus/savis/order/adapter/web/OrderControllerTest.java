package com.savouretplus.savis.order.adapter.web;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import com.savouretplus.savis.order.domain.Order;
import com.savouretplus.savis.order.domain.OrderSource;
import com.savouretplus.savis.order.domain.OrderStatus;
import com.savouretplus.savis.order.usecase.GenerateOrderDocumentUseCase;
import com.savouretplus.savis.order.usecase.GeneratedOrderDocument;
import com.savouretplus.savis.order.usecase.ImportOrdersUseCase;
import com.savouretplus.savis.order.usecase.OrderDocumentType;
import com.savouretplus.savis.order.usecase.OrderService;

@ExtendWith(MockitoExtension.class)
class OrderControllerTest {
    private static final UUID ORDER_ID = UUID.fromString("10000000-0000-4000-8000-000000000001");

    @Mock OrderService orders;
    @Mock ImportOrdersUseCase importer;
    @Mock GenerateOrderDocumentUseCase documents;

    @Test
    void exposesGeneratedDocumentsAsNonCachedPdfAttachments() {
        byte[] content = { 1, 2, 3 };
        when(documents.generate(ORDER_ID, OrderDocumentType.QUOTE))
                .thenReturn(new GeneratedOrderDocument("soumission-ADM-00000042.pdf", content));
        OrderController controller = new OrderController(orders, importer, documents);

        ResponseEntity<byte[]> response = controller.document(ORDER_ID, "quote");

        assertEquals(MediaType.APPLICATION_PDF, response.getHeaders().getContentType());
        assertEquals("attachment; filename=\"soumission-ADM-00000042.pdf\"",
                response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION));
        assertEquals("no-store", response.getHeaders().getCacheControl());
        assertArrayEquals(content, response.getBody());
    }

    @Test
    void replacesAnEditableAdministrativeOrder() {
        CreateOrderRequest request = new CreateOrderRequest(
                "Ada", "514", null, null, null, 0, 0,
                java.util.List.of(new CreateOrderRequest.ItemRequest(
                        UUID.randomUUID(), 1, "unit", null, java.util.List.of(), java.util.List.of())));
        Instant now = Instant.parse("2026-10-12T12:00:00Z");
        Order updated = new Order(
                1L, ORDER_ID, "ADM-00000001", OrderSource.ADMIN, OrderStatus.NEW,
                "Ada", "514", null, null, 0, null, now, now,
                null, null, null, null, null, List.of(), Map.of());
        when(orders.update(org.mockito.ArgumentMatchers.eq(ORDER_ID), org.mockito.ArgumentMatchers.any()))
                .thenReturn(updated);

        controller().update(ORDER_ID, request);

        org.mockito.Mockito.verify(orders).update(
                org.mockito.ArgumentMatchers.eq(ORDER_ID), org.mockito.ArgumentMatchers.any());
    }

    private OrderController controller() {
        return new OrderController(orders, importer, documents);
    }
}
