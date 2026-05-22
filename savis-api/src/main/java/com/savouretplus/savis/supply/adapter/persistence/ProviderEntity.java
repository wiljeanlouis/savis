package com.savouretplus.savis.supply.adapter.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@Embeddable
public class ProviderEntity {
    @Column(name = "provider_name")
    private String name;

    @Column(name = "provider_identifier")
    private String identifier;

    @Column(name = "provider_site")
    private String site;

    @Column(name = "provider_address")
    private String address;
}
