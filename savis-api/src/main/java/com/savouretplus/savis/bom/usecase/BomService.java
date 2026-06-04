package com.savouretplus.savis.bom.usecase;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.savouretplus.savis.common.Money;
import com.savouretplus.savis.bom.domain.ActivityRate;
import com.savouretplus.savis.bom.domain.ActivityType;
import com.savouretplus.savis.bom.domain.ComponentNeededEvent;
import com.savouretplus.savis.bom.domain.Bom;
import com.savouretplus.savis.bom.port.ActivityRateRepositoryPort;
import com.savouretplus.savis.bom.port.BomRepositoryPort;
import com.savouretplus.savis.bom.port.ComponentNeededEventPort;
import com.savouretplus.savis.bom.port.ComponentPricePort;
import com.savouretplus.savis.bom.port.ComponentPriceRequest;

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
    private final ActivityRateRepositoryPort activityRateRepository;
    private final ComponentNeededEventPort componentNeededEventPublisher;

    public UUID saveBom(UUID bomId, Bom bom) {
        log.info("Save bom {} with id : {}", bom, bomId);

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
        return calculateTotalCost(bom);
    }

    public Money calculateTotalCost(Bom bom) {
        return bom.calculateTotal(
                priceCalculator.getPrices(bom.componentPriceRequests()),
                activityRatesByType());
    }

    public Map<UUID, Money> calculateTotalCosts(List<Bom> boms) {
        List<ComponentPriceRequest> requests = boms.stream()
                .flatMap(bom -> bom.componentPriceRequests().stream())
                .distinct()
                .toList();

        Map<ComponentPriceRequest, Money> componentPrices = priceCalculator.getPrices(requests);
        Map<ActivityType, Money> activityRates = activityRatesByType();

        return boms.stream()
                .collect(Collectors.toMap(
                        Bom::getPublicId,
                        bom -> bom.calculateTotal(componentPrices, activityRates)));
    }

    private Map<ActivityType, Money> activityRatesByType() {
        return activityRateRepository.findAll().stream()
                .collect(Collectors.toMap(
                        ActivityRate::activityType,
                        ActivityRate::hourlyRate));
    }

    private void publishComponentNeededEvents(Bom bom) {
        bom.getComponents().forEach(component -> {
            componentNeededEventPublisher.publish(ComponentNeededEvent.of(component.componentName(), bom.getType()));
        });
    }

}
