package com.savouretplus.savis.bom.adapter.messaging;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.modulith.events.EventExternalizationConfiguration;

import com.savouretplus.savis.bom.domain.ComponentNeededEvent;

/**
 * Configures Spring Modulith externalization for component-needed events.
 */
@Configuration
class ComponentNeededEventExternalizationConfiguration {

    @Bean
    EventExternalizationConfiguration componentNeededEventExternalization() {
        return EventExternalizationConfiguration.externalizing()
                .selectByType(ComponentNeededEvent.class)
                .mapping(ComponentNeededEvent.class, ComponentNeededEventExternalizationConfiguration::toMessage)
                .build();
    }

    /**
     * Converts the domain event to the externalized message payload.
     */
    private static ComponentNeededMessage toMessage(ComponentNeededEvent event) {
        return new ComponentNeededMessage(event.componentNameKey(), event.type().name());
    }
}
