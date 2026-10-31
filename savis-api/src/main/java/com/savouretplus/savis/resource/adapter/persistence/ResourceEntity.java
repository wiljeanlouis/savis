package com.savouretplus.savis.resource.adapter.persistence;

import java.util.UUID;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import com.savouretplus.savis.common.Unit;
import com.savouretplus.savis.resource.domain.ResourceCategory;
import com.savouretplus.savis.resource.domain.ResourceStatus;

@Getter
@Setter
@Entity
@Table(name = "resources")
public class ResourceEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private UUID publicId;
    @Column(nullable = false, length = 160)
    private String name;
    @Column(columnDefinition = "text")
    private String description;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 32)
    private ResourceCategory category;
    @Enumerated(EnumType.STRING) @Column(length = 32)
    private Unit referenceUnit;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 16)
    private ResourceStatus status;
}
