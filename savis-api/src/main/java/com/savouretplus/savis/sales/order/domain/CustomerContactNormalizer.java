package com.savouretplus.savis.sales.order.domain;

import java.util.regex.Pattern;

import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.Phonenumber.PhoneNumber;

/**
 * Normalizes and validates customer contact information using Canadian defaults.
 */
public final class CustomerContactNormalizer {
    private static final String DEFAULT_REGION = "CA";
    private static final Pattern CANADIAN_POSTAL_CODE = Pattern.compile(
            "^[ABCEGHJ-NPRSTVXY]\\d[ABCEGHJ-NPRSTV-Z] \\d[ABCEGHJ-NPRSTV-Z]\\d$");
    private static final PhoneNumberUtil PHONES = PhoneNumberUtil.getInstance();

    private CustomerContactNormalizer() {
    }

    /**
     * Returns a valid phone number in E.164 form.
     */
    public static String normalizePhone(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Le téléphone du client est requis");
        }
        try {
            PhoneNumber phone = PHONES.parse(value.trim(), DEFAULT_REGION);
            if (phone.hasExtension() || !PHONES.isValidNumber(phone)) {
                throw invalidPhone();
            }
            return PHONES.format(phone, PhoneNumberUtil.PhoneNumberFormat.E164);
        } catch (NumberParseException exception) {
            throw invalidPhone();
        }
    }

    /**
     * Formats a stored phone number for customer-facing documents.
     */
    public static String formatPhoneForDocument(String value) {
        try {
            PhoneNumber phone = PHONES.parse(value, DEFAULT_REGION);
            if (!PHONES.isValidNumber(phone)) {
                return value;
            }
            return PHONES.format(phone, PhoneNumberUtil.PhoneNumberFormat.INTERNATIONAL)
                    .replace('-', ' ');
        } catch (NumberParseException exception) {
            return value;
        }
    }

    /**
     * Normalizes an optional address and rejects a malformed Canadian postal code.
     */
    public static OrderAddress normalizeAddress(OrderAddress address) {
        if (address == null || address.isEmpty()) {
            return null;
        }
        OrderAddress normalized = new OrderAddress(
                address.line1(), address.line2(), address.city(), address.province(), address.postalCode());
        if (normalized.postalCode() != null
                && !CANADIAN_POSTAL_CODE.matcher(normalized.postalCode()).matches()) {
            throw new IllegalArgumentException("Le code postal canadien doit respecter le format A1A 1A1");
        }
        return normalized;
    }

    private static IllegalArgumentException invalidPhone() {
        return new IllegalArgumentException("Le numéro de téléphone est invalide");
    }
}
