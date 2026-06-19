package com.savouretplus.savis.bom.adapter.messaging;

import java.io.Serializable;

/**
 * Serializable message sent when a component price is needed.
 */
public record ComponentNeededMessage(
        String content,
        String type) implements Serializable {
}
