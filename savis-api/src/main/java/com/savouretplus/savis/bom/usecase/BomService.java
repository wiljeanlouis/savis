package com.savouretplus.savis.bom.usecase;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.bom.domain.ComponentNeededEvent;
import com.savouretplus.savis.bom.domain.Bom;
import com.savouretplus.savis.bom.port.BomRepositoryPort;
import com.savouretplus.savis.bom.port.ComponentNeededEventPort;
import com.savouretplus.savis.bom.port.ComponentPricePort;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional
@AllArgsConstructor
public class BomService {

    private final BomRepositoryPort repository;
    private final ComponentPricePort priceCalculator;
    private final ComponentNeededEventPort componentNeededEventPublisher;

    public UUID saveBom(UUID bomId, Bom bom) {
        log.info("Save bom {} with id : {}", bom, bomId);

        if (bomId != null) {
            Bom oldBom = getBom(bomId);
            bom = Bom.merge(oldBom, bom);
        }

        repository.save(bom);
        publishComponentNeededEvents(bom);

        return bom.getPublicId();
    }

    public Bom getBom(UUID bomId) {
        return repository.findByPublicId(bomId)
                .orElseThrow(() -> new RuntimeException("Bom not found"));
    }

    public void deleteBom(UUID bomId) {
        Bom bom = getBom(bomId);
        repository.delete(bom);
    }

    public List<Bom> listBoms() {
        return repository.findAll();
    }

    public Money calculateTotalCost(UUID bomId) {
        Bom bom = getBom(bomId);
        return bom.calculateTotal(priceCalculator);
    }

    private void publishComponentNeededEvents(Bom bom) {
        bom.getComponents().forEach(component -> {
            componentNeededEventPublisher.publish(ComponentNeededEvent.of(component.componentName(), bom.getType()));
        });
    }

}
