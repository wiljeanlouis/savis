package com.savouretplus.savis.resource.port;

import java.util.List;
import com.savouretplus.savis.resource.domain.Resource;

public record ResourcePage(List<Resource> content, long totalElements, int page, int size) {
    public ResourcePage { content = List.copyOf(content); }
    public long totalPages() { return (totalElements + size - 1) / size; }
}
