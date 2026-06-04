package com.savouretplus.savis.bom.usecase;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.savouretplus.savis.bom.domain.ActivityRate;
import com.savouretplus.savis.bom.domain.ActivityType;
import com.savouretplus.savis.bom.port.ActivityRateRepositoryPort;
import com.savouretplus.savis.common.Money;

@ExtendWith(MockitoExtension.class)
class ActivityRateServiceTest {

    @Mock
    ActivityRateRepositoryPort repository;

    @InjectMocks
    ActivityRateService activityRateService;

    @Test
    void createActivityRate_ShouldSaveWhenActivityTypeDoesNotExist() {
        ActivityRate savedRate = new ActivityRate(1L, ActivityType.PREP, Money.of(60));
        when(repository.findByActivityType(ActivityType.PREP)).thenReturn(Optional.empty());
        when(repository.save(new ActivityRate(null, ActivityType.PREP, Money.of(60)))).thenReturn(savedRate);

        ActivityRate activityRate = activityRateService.createActivityRate(ActivityType.PREP, Money.of(60));

        Assertions.assertEquals(savedRate, activityRate);
        verify(repository).findByActivityType(ActivityType.PREP);
        verify(repository).save(new ActivityRate(null, ActivityType.PREP, Money.of(60)));
        verifyNoMoreInteractions(repository);
    }

    @Test
    void createActivityRate_ShouldThrowWhenActivityTypeAlreadyExists() {
        ActivityRate existingRate = new ActivityRate(1L, ActivityType.PREP, Money.of(60));
        when(repository.findByActivityType(ActivityType.PREP)).thenReturn(Optional.of(existingRate));

        Assertions.assertThrows(IllegalStateException.class, () -> {
            activityRateService.createActivityRate(ActivityType.PREP, Money.of(70));
        });

        verify(repository).findByActivityType(ActivityType.PREP);
        verify(repository, never()).save(org.mockito.ArgumentMatchers.any());
        verifyNoMoreInteractions(repository);
    }

    @Test
    void updateActivityRate_ShouldSaveExistingRateWithNewHourlyRate() {
        ActivityRate existingRate = new ActivityRate(1L, ActivityType.COOK, Money.of(60));
        ActivityRate updatedRate = new ActivityRate(1L, ActivityType.COOK, Money.of(80));
        when(repository.findByActivityType(ActivityType.COOK)).thenReturn(Optional.of(existingRate));
        when(repository.save(updatedRate)).thenReturn(updatedRate);

        ActivityRate activityRate = activityRateService.updateActivityRate(ActivityType.COOK, Money.of(80));

        Assertions.assertEquals(updatedRate, activityRate);
        verify(repository).findByActivityType(ActivityType.COOK);
        verify(repository).save(updatedRate);
        verifyNoMoreInteractions(repository);
    }

    @Test
    void getActivityRate_ShouldReturnExistingRate() {
        ActivityRate existingRate = new ActivityRate(1L, ActivityType.ASSEMBLY, Money.of(45));
        when(repository.findByActivityType(ActivityType.ASSEMBLY)).thenReturn(Optional.of(existingRate));

        ActivityRate activityRate = activityRateService.getActivityRate(ActivityType.ASSEMBLY);

        Assertions.assertEquals(existingRate, activityRate);
        verify(repository).findByActivityType(ActivityType.ASSEMBLY);
        verifyNoMoreInteractions(repository);
    }

    @Test
    void listActivityRates_ShouldDelegateToRepository() {
        ActivityRate prepRate = new ActivityRate(1L, ActivityType.PREP, Money.of(60));
        when(repository.findAll()).thenReturn(List.of(prepRate));

        List<ActivityRate> activityRates = activityRateService.listActivityRates();

        Assertions.assertEquals(List.of(prepRate), activityRates);
        verify(repository).findAll();
        verifyNoMoreInteractions(repository);
    }

    @Test
    void deleteActivityRate_ShouldDeleteExistingRate() {
        ActivityRate existingRate = new ActivityRate(1L, ActivityType.PACKAGING, Money.of(30));
        when(repository.findByActivityType(ActivityType.PACKAGING)).thenReturn(Optional.of(existingRate));

        activityRateService.deleteActivityRate(ActivityType.PACKAGING);

        verify(repository).findByActivityType(ActivityType.PACKAGING);
        verify(repository).deleteByActivityType(ActivityType.PACKAGING);
        verifyNoMoreInteractions(repository);
    }
}
