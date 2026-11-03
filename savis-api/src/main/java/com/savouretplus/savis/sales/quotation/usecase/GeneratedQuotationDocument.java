package com.savouretplus.savis.sales.quotation.usecase;

/** Contains a downloadable quotation PDF. */
public record GeneratedQuotationDocument(String fileName, byte[] content) {
    /** Protects the mutable byte array at the application boundary. */
    public GeneratedQuotationDocument {
        content = content.clone();
    }

    /** Returns an independent copy of the document bytes. */
    @Override
    public byte[] content() {
        return content.clone();
    }
}
