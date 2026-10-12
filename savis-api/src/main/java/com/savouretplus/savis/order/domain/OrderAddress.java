package com.savouretplus.savis.order.domain;

import java.util.List;
import java.util.Locale;
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
     * Normalizes whitespace, province and postal-code casing, and converts blank
     * values to {@code null}.
     */
    public OrderAddress {
        line1 = normalizeText(line1);
        line2 = normalizeText(line2);
        city = normalizeText(city);
        province = normalizeProvince(province);
        postalCode = normalizePostalCode(postalCode);
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
        String region = Stream.of(province, postalCode)
                .filter(value -> value != null && !value.isBlank())
                .reduce((left, right) -> left + " " + right)
                .orElse(null);
        String locality = city == null ? region : region == null ? city : city + ", " + region;
        return Stream.of(line1, line2, locality)
                .filter(value -> value != null && !value.isBlank())
                .toList();
    }

    private static String normalizeText(String value) {
        return value == null || value.isBlank() ? null : value.trim().replaceAll("\\s+", " ");
    }

    private static String normalizeProvince(String value) {
        String normalized = normalizeText(value);
        return normalized == null ? null : normalized.toUpperCase(Locale.CANADA_FRENCH);
    }

    private static String normalizePostalCode(String value) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            return null;
        }
        String compact = normalized.replaceAll("[\\s-]", "").toUpperCase(Locale.CANADA_FRENCH);
        return compact.length() == 6 ? compact.substring(0, 3) + " " + compact.substring(3) : compact;
    }
}
