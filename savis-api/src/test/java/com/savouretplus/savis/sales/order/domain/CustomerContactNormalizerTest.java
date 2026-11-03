package com.savouretplus.savis.sales.order.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class CustomerContactNormalizerTest {

    @Test
    void normalizesCanadianPhoneAndAddressValues() {
        OrderAddress address = CustomerContactNormalizer.normalizeAddress(
                new OrderAddress(" 12,  rue la gloire ", null, " Drummondville ", "qc", "j2b1v7"));

        assertEquals("+15145550100", CustomerContactNormalizer.normalizePhone("(514) 555-0100"));
        assertEquals("12, rue la gloire", address.line1());
        assertEquals("QC", address.province());
        assertEquals("J2B 1V7", address.postalCode());
        assertEquals("Drummondville, QC J2B 1V7", address.displayLines().getLast());
    }

    @Test
    void rejectsImpossiblePhonesAndMalformedPostalCodes() {
        assertThrows(IllegalArgumentException.class,
                () -> CustomerContactNormalizer.normalizePhone("514"));
        assertThrows(IllegalArgumentException.class,
                () -> CustomerContactNormalizer.normalizePhone("123-456-7890"));
        assertThrows(IllegalArgumentException.class,
                () -> CustomerContactNormalizer.normalizeAddress(
                        new OrderAddress("12 rue Test", null, "Drummondville", "QC", "J2B EV7")));
    }
}
