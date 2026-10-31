package com.savouretplus.savis.resource.adapter.web;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import java.util.List;
import java.util.UUID;
import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.resource.domain.*;
import com.savouretplus.savis.resource.usecase.ResourceService;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class ResourceBatchControllerTest {
    @Test void resolvesNamesInOneBatchAndOmitsMissingReferences() throws Exception {
        var service = mock(ResourceService.class);
        var mvc = MockMvcBuilders.standaloneSetup(new ResourceController(service))
                .setControllerAdvice(new ResourceExceptionHandler()).build();
        var id = UUID.randomUUID();
        var missing = UUID.randomUUID();
        when(service.findByIds(List.of(id, missing))).thenReturn(List.of(
                new Resource(id, "Farine", "", ResourceCategory.INGREDIENT, Unit.KILOGRAM, ResourceStatus.INACTIVE)));
        mvc.perform(get("/api/resources/batch").param("ids", id + "," + missing))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(id.toString()))
                .andExpect(jsonPath("$[0].name").value("Farine"))
                .andExpect(jsonPath("$[0].status").value("INACTIVE"));
        verify(service).findByIds(List.of(id, missing));
        verifyNoMoreInteractions(service);
        mvc.perform(get("/api/resources/batch").param("ids", "invalid"))
                .andExpect(status().isBadRequest());
    }
}
