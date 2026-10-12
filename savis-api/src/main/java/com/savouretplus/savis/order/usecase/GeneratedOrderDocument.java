package com.savouretplus.savis.order.usecase;

import java.util.Arrays;

/**
 * Contains one generated order document and its download metadata.
 */
public record GeneratedOrderDocument(String fileName, byte[] content) {

    /**
     * Protects the generated binary content from external mutation.
     */
    public GeneratedOrderDocument {
        content = content == null ? new byte[0] : Arrays.copyOf(content, content.length);
    }

    @Override
    public byte[] content() {
        return Arrays.copyOf(content, content.length);
    }
}
