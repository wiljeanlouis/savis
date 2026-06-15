package com.savouretplus.savis.bom.adapter.messaging;

import java.io.Serializable;

public record ComponentNeededMessage(
        String content,
        String type) implements Serializable {
}
