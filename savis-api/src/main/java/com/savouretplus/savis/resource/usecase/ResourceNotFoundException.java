package com.savouretplus.savis.resource.usecase;

import java.util.UUID;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(UUID id) { super("Ressource introuvable : " + id); }
}
