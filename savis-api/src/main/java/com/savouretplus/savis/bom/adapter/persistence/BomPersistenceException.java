package com.savouretplus.savis.bom.adapter.persistence;

/**
 * Runtime exception used to wrap persistence failures in the BOM adapter.
 */
public class BomPersistenceException extends RuntimeException {

    /**
     * Wraps a BOM persistence failure with a stable error code.
     */
    public BomPersistenceException(String message, Throwable cause) {
        super(message, cause);
    }

}
