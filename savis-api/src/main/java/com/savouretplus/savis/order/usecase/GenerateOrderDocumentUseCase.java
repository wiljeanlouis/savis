package com.savouretplus.savis.order.usecase;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.savouretplus.savis.order.domain.Order;
import com.savouretplus.savis.order.port.OrderDocumentRenderer;
import com.savouretplus.savis.order.port.OrderRepository;

import lombok.AllArgsConstructor;

/**
 * Generates downloadable customer documents from captured order data.
 */
@Service
@Transactional(readOnly = true)
@AllArgsConstructor
public class GenerateOrderDocumentUseCase {
    private final OrderRepository orders;
    private final OrderDocumentRenderer renderer;
    private final Clock clock;

    /**
     * Generates a PDF document for one order.
     */
    public GeneratedOrderDocument generate(UUID orderId, OrderDocumentType type) {
        if (type == null) {
            throw new IllegalArgumentException("Le type de document est requis");
        }
        Order order = orders.findByPublicId(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));
        Instant generatedAt = Instant.now(clock);
        byte[] content = renderer.render(order, type, generatedAt);
        String fileName = "%s-%s.pdf".formatted(type.frenchName(), safe(order.orderNumber()));
        return new GeneratedOrderDocument(fileName, content);
    }

    private String safe(String value) {
        return value.replaceAll("[^A-Za-z0-9._-]", "-");
    }
}
