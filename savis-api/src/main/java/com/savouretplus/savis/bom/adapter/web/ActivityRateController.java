package com.savouretplus.savis.bom.adapter.web;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.savouretplus.savis.bom.domain.ActivityRate;
import com.savouretplus.savis.bom.domain.ActivityType;
import com.savouretplus.savis.bom.usecase.ActivityRateService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST controller exposing activity rate management endpoints.
 */
@Slf4j
@RestController
@RequestMapping({ "/api/activity-rates" })
@AllArgsConstructor
public class ActivityRateController {

    private final ActivityRateService activityRateService;

    /**
     * Creates a new activity rate.
     */
    @PostMapping()
    public ResponseEntity<ActivityRateDto> createActivityRate(@Valid @RequestBody ActivityRateDto request) {
        log.info("Received request to create activity rate: {}", request);

        ActivityRate activityRate = activityRateService.createActivityRate(
                request.activityType(),
                request.hourlyRate());

        return ResponseEntity.ok(ActivityRateDto.from(activityRate));
    }

    /**
     * Updates an existing activity rate.
     */
    @PutMapping("/{activityType}")
    public ResponseEntity<ActivityRateDto> updateActivityRate(
            @PathVariable ActivityType activityType,
            @Valid @RequestBody ActivityRateDto request) {
        log.info("Received request to update activity rate: {}", activityType);

        ActivityRate activityRate = activityRateService.updateActivityRate(
                activityType,
                request.hourlyRate());

        return ResponseEntity.ok(ActivityRateDto.from(activityRate));
    }

    /**
     * Returns an activity rate by activity type.
     */
    @GetMapping("/{activityType}")
    public ResponseEntity<ActivityRateDto> getActivityRate(@PathVariable ActivityType activityType) {
        log.info("Received request to get activity rate: {}", activityType);

        ActivityRate activityRate = activityRateService.getActivityRate(activityType);

        return ResponseEntity.ok(ActivityRateDto.from(activityRate));
    }

    /**
     * Lists all configured activity rates.
     */
    @GetMapping()
    public ResponseEntity<List<ActivityRateDto>> listActivityRates() {
        log.info("Received request to list activity rates");

        List<ActivityRateDto> activityRates = activityRateService.listActivityRates()
                .stream()
                .map(ActivityRateDto::from)
                .toList();

        return ResponseEntity.ok(activityRates);
    }

    /**
     * Deletes an activity rate by activity type.
     */
    @DeleteMapping("/{activityType}")
    public ResponseEntity<Void> deleteActivityRate(@PathVariable ActivityType activityType) {
        log.info("Received request to delete activity rate: {}", activityType);

        activityRateService.deleteActivityRate(activityType);

        return ResponseEntity.noContent().build();
    }
}
