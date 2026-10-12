package com.savouretplus.savis.order.domain;

import java.util.List;
import java.util.stream.Stream;

/**
 * Represents the optional customer address captured with an order.
 */
public record OrderAddress(
        String line1,
        String line2,
        String city,
        String province,
        String postalCode) {

    /**
     * Trims address values and converts blank values to {@code null}.
     */
    public OrderAddress {
        line1 = blankToNull(line1);
        line2 = blankToNull(line2);
        city = blankToNull(city);
        province = blankToNull(province);
        postalCode = blankToNull(postalCode);
    }

    /**
     * Reports whether no address value was supplied.
     */
    public boolean isEmpty() {
        return line1 == null && line2 == null && city == null && province == null && postalCode == null;
    }

    /**
     * Returns non-empty address lines ready for display.
     */
    public List<String> displayLines() {
        String locality = Stream.of(city, province, postalCode)
                .filter(value -> value != null && !value.isBlank())
                .reduce((left, right) -> left + " " + right)
                .orElse(null);
        return Stream.of(line1, line2, locality)
                .filter(value -> value != null && !value.isBlank())
                .toList();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
