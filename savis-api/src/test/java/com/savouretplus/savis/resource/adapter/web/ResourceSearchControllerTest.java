package com.savouretplus.savis.resource.adapter.web;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import com.savouretplus.savis.resource.domain.ResourceCategory;
import com.savouretplus.savis.resource.domain.ResourceStatus;
import com.savouretplus.savis.resource.port.ResourcePage;
import com.savouretplus.savis.resource.port.ResourceSort;
import com.savouretplus.savis.resource.usecase.ResourceService;

class ResourceSearchControllerTest {
    private final ResourceService service = mock(ResourceService.class);
    private final org.springframework.test.web.servlet.MockMvc mvc = MockMvcBuilders
            .standaloneSetup(new ResourceController(service)).setControllerAdvice(new ResourceExceptionHandler()).build();

    static Stream<Arguments> sorts() {
        return Stream.of(
                Arguments.of("name,asc", ResourceSort.NAME_ASC), Arguments.of("name,desc", ResourceSort.NAME_DESC),
                Arguments.of("category,asc", ResourceSort.CATEGORY_ASC), Arguments.of("category,desc", ResourceSort.CATEGORY_DESC),
                Arguments.of("referenceUnit,asc", ResourceSort.UNIT_ASC), Arguments.of("referenceUnit,desc", ResourceSort.UNIT_DESC));
    }

    @ParameterizedTest @MethodSource("sorts")
    void translatesAllowedSortsAndPreservesFilters(String sort, ResourceSort expected) throws Exception {
        when(service.search("farine", ResourceCategory.PACKAGING, ResourceStatus.ACTIVE, 2, 10, expected))
                .thenReturn(new ResourcePage(List.of(), 0, 2, 10));
        mvc.perform(get("/api/resources").param("search", "farine").param("category", "PACKAGING")
                        .param("status", "ACTIVE").param("page", "2").param("size", "10").param("sort", sort))
                .andExpect(status().isOk()).andExpect(jsonPath("$.page").value(2));
        verify(service).search("farine", ResourceCategory.PACKAGING, ResourceStatus.ACTIVE, 2, 10, expected);
    }

    @Test void defaultsToNameAscendingForExistingClients() throws Exception {
        when(service.search(null, null, null, 0, 20, ResourceSort.NAME_ASC)).thenReturn(new ResourcePage(List.of(), 0, 0, 20));
        mvc.perform(get("/api/resources")).andExpect(status().isOk());
        verify(service).search(null, null, null, 0, 20, ResourceSort.NAME_ASC);
    }

    @Test void rejectsUnknownSortFieldsAndDirectionsBeforeQuerying() throws Exception {
        for (String sort : List.of("id,asc", "name,invalid", "category", "name,asc,extra")) {
            mvc.perform(get("/api/resources").param("sort", sort)).andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.startsWith("Tri invalide")));
        }
        verifyNoInteractions(service);
    }
}
