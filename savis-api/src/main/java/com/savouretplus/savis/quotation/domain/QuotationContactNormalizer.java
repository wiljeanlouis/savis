package com.savouretplus.savis.quotation.domain;

import java.util.regex.Pattern;

import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.Phonenumber.PhoneNumber;

/**
 * Validates quotation customer contact information with Canadian defaults.
 */
public final class QuotationContactNormalizer {
    private static final PhoneNumberUtil PHONES = PhoneNumberUtil.getInstance();
    private static final Pattern POSTAL = Pattern.compile(
            "^[ABCEGHJ-NPRSTVXY]\\d[ABCEGHJ-NPRSTV-Z] \\d[ABCEGHJ-NPRSTV-Z]\\d$");

    private QuotationContactNormalizer() {
    }

    /** Returns a valid phone number in E.164 format. */
    public static String phone(String value) {
        try {
            PhoneNumber phone = PHONES.parse(value, "CA");
            if (phone.hasExtension() || !PHONES.isValidNumber(phone)) {
                throw invalidPhone();
            }
            return PHONES.format(phone, PhoneNumberUtil.PhoneNumberFormat.E164);
        } catch (NumberParseException | NullPointerException exception) {
            throw invalidPhone();
        }
    }

    /** Normalizes and validates an optional Canadian address. */
    public static QuotationAddress address(QuotationAddress value) {
        if (value == null || value.isEmpty()) {
            return null;
        }
        QuotationAddress normalized = new QuotationAddress(
                value.line1(), value.line2(), value.city(), value.province(), value.postalCode());
        if (normalized.postalCode() != null && !POSTAL.matcher(normalized.postalCode()).matches()) {
            throw new IllegalArgumentException("Le code postal canadien doit respecter le format A1A 1A1");
        }
        return normalized;
    }

    /** Formats a stored phone number for a commercial document. */
    public static String documentPhone(String value) {
        try {
            PhoneNumber phone = PHONES.parse(value, "CA");
            return PHONES.isValidNumber(phone)
                    ? PHONES.format(phone, PhoneNumberUtil.PhoneNumberFormat.INTERNATIONAL).replace('-', ' ')
                    : value;
        } catch (NumberParseException exception) {
            return value;
        }
    }

    private static IllegalArgumentException invalidPhone() {
        return new IllegalArgumentException("Le numéro de téléphone est invalide");
    }
}
