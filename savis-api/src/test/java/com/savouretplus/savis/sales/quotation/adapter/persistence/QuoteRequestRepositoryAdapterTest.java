package com.savouretplus.savis.sales.quotation.adapter.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.savouretplus.savis.sales.quotation.domain.QuoteRequest;
import com.savouretplus.savis.sales.quotation.domain.QuoteRequestStatus;
import com.savouretplus.savis.sales.quotation.port.QuoteRequestRepository;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class QuoteRequestRepositoryAdapterTest {
    @Autowired QuoteRequestRepository repository;
    @Autowired QuoteRequestJpaRepository jpa;

    @BeforeEach
    void requests() {
        save("Alice", QuoteRequestStatus.RECEIVED);
        save("Bob", QuoteRequestStatus.RECEIVED);
        save("Alice", QuoteRequestStatus.CLOSED);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    void statusFilterDoesNotRequireSearch(String search) {
        var result = repository.list(0, 20, search, "receivedAt,desc", "RECEIVED");

        assertEquals(2, result.totalElements());
    }

    @Test
    void searchAndStatusFiltersAreCombined() {
        var result = repository.list(0, 20, "ALICE", "receivedAt,desc", "RECEIVED");

        assertEquals(1, result.totalElements());
        assertEquals("Alice", result.content().getFirst().customerName());
    }

    private void save(String name, QuoteRequestStatus status) {
        var request = repository.insert(new QuoteRequest(null, UUID.randomUUID(), "savouretplus",
                UUID.randomUUID(), null, "a".repeat(64), "{}", name, "5145550123", null,
                Instant.now(), Instant.now()));
        var entity = jpa.findByPublicId(request.publicId()).orElseThrow();
        entity.setStatus(status);
        jpa.saveAndFlush(entity);
    }
}
