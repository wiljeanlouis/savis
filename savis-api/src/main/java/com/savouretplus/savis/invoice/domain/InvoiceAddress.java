package com.savouretplus.savis.invoice.domain;

import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;

/** Represents the immutable customer address printed on an invoice. */
public record InvoiceAddress(
        String line1,
        String line2,
        String city,
        String province,
        String postalCode) {

    /** Normalizes the captured address without consulting another aggregate. */
    public InvoiceAddress {
        line1 = normalize(line1);
        line2 = normalize(line2);
        city = normalize(city);
        province = upper(normalize(province));
        postalCode = postalCode(normalize(postalCode));
    }

    /** Reports whether no address value is present. */
    public boolean isEmpty() {
        return line1 == null && line2 == null && city == null && province == null && postalCode == null;
    }

    /** Returns customer-facing address lines. */
    public List<String> displayLines() {
        String region = Stream.of(province, postalCode)
                .filter(value -> value != null && !value.isBlank())
                .reduce((left, right) -> left + " " + right)
                .orElse(null);
        String locality = city == null ? region : region == null ? city : city + ", " + region;
        return Stream.of(line1, line2, locality).filter(value -> value != null && !value.isBlank()).toList();
    }

    private static String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim().replaceAll("\\s+", " ");
    }

    private static String upper(String value) {
        return value == null ? null : value.toUpperCase(Locale.CANADA_FRENCH);
    }

    private static String postalCode(String value) {
        if (value == null) {
            return null;
        }
        String compact = value.replaceAll("[\\s-]", "").toUpperCase(Locale.CANADA_FRENCH);
        return compact.length() == 6 ? compact.substring(0, 3) + " " + compact.substring(3) : compact;
    }
}
