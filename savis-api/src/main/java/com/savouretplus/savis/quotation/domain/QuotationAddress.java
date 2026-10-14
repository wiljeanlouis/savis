package com.savouretplus.savis.quotation.domain;

import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;

/**
 * Represents the optional customer address captured on a quotation.
 */
public record QuotationAddress(
        String line1,
        String line2,
        String city,
        String province,
        String postalCode) {

    /** Normalizes address values for storage and display. */
    public QuotationAddress {
        line1 = normalize(line1);
        line2 = normalize(line2);
        city = normalize(city);
        province = normalize(province);
        province = province == null ? null : province.toUpperCase(Locale.CANADA_FRENCH);
        postalCode = postal(postalCode);
    }

    /** Reports whether no address value was supplied. */
    public boolean isEmpty() {
        return line1 == null && line2 == null && city == null && province == null && postalCode == null;
    }

    /** Returns lines ready for a commercial document. */
    public List<String> displayLines() {
        String region = Stream.of(province, postalCode).filter(value -> value != null && !value.isBlank())
                .reduce((left, right) -> left + " " + right).orElse(null);
        String locality = city == null ? region : region == null ? city : city + ", " + region;
        return Stream.of(line1, line2, locality).filter(value -> value != null && !value.isBlank()).toList();
    }

    private static String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim().replaceAll("\\s+", " ");
    }

    private static String postal(String value) {
        String normalized = normalize(value);
        if (normalized == null) {
            return null;
        }
        String compact = normalized.replaceAll("[\\s-]", "").toUpperCase(Locale.CANADA_FRENCH);
        return compact.length() == 6 ? compact.substring(0, 3) + " " + compact.substring(3) : compact;
    }
}
