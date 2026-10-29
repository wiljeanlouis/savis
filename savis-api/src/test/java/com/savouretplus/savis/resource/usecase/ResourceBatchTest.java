package com.savouretplus.savis.resource.usecase;

import java.util.stream.IntStream;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.List;
import java.util.UUID;
import com.savouretplus.savis.resource.port.ResourceRepository;
import org.junit.jupiter.api.Test;

class ResourceBatchTest {
    private final ResourceRepository repository = mock(ResourceRepository.class);
    private final ResourceService service = new ResourceService(repository);

    @Test void resolvesDistinctIdsWithOneRead() {
        UUID id = UUID.randomUUID();
        when(repository.findByPublicIds(List.of(id))).thenReturn(List.of());
        assertEquals(List.of(), service.findByIds(List.of(id, id)));
        verify(repository).findByPublicIds(List.of(id));
        verifyNoMoreInteractions(repository);
    }

    @Test void rejectsUnboundedOrEmptyReads() {
        assertThrows(IllegalArgumentException.class, () -> service.findByIds(List.of()));
        assertThrows(IllegalArgumentException.class, () -> service.findByIds(
                IntStream.range(0, 101).mapToObj(i -> UUID.randomUUID()).toList()));
        verifyNoInteractions(repository);
    }
}
