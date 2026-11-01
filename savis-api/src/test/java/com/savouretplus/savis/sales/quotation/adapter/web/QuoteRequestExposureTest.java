package com.savouretplus.savis.sales.quotation.adapter.web;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
@SpringBootTest @ActiveProfiles("test")
class QuoteRequestExposureTest {
    @Autowired org.springframework.context.ApplicationContext context;
    @Test void quoteRequestRoutesAreRegisteredAtStartup() {
        assertFalse(context.getBeansOfType(QuoteRequestController.class).isEmpty());
    }
}
