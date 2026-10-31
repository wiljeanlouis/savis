package com.savouretplus.savis.sales.invoice.usecase;

import java.util.regex.Pattern;

import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.savouretplus.savis.sales.invoice.domain.InvoiceAddress;

/** Normalizes editable invoice contact values using Canadian defaults. */
final class InvoiceContactNormalizer {
    private static final String DEFAULT_REGION = "CA";
    private static final Pattern CANADIAN_POSTAL_CODE = Pattern.compile(
            "^[ABCEGHJ-NPRSTVXY]\\d[ABCEGHJ-NPRSTV-Z] \\d[ABCEGHJ-NPRSTV-Z]\\d$");
    private static final PhoneNumberUtil PHONES = PhoneNumberUtil.getInstance();

    private InvoiceContactNormalizer() {
    }

    static String phone(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Le téléphone du client est requis");
        }
        try {
            var phone = PHONES.parse(value.trim(), DEFAULT_REGION);
            if (phone.hasExtension() || !PHONES.isValidNumber(phone)) {
                throw invalidPhone();
            }
            return PHONES.format(phone, PhoneNumberUtil.PhoneNumberFormat.E164);
        } catch (NumberParseException exception) {
            throw invalidPhone();
        }
    }

    static InvoiceAddress address(InvoiceAddress value) {
        if (value == null || value.isEmpty()) {
            return null;
        }
        if (value.postalCode() != null && !CANADIAN_POSTAL_CODE.matcher(value.postalCode()).matches()) {
            throw new IllegalArgumentException("Le code postal canadien doit respecter le format A1A 1A1");
        }
        return value;
    }

    private static IllegalArgumentException invalidPhone() {
        return new IllegalArgumentException("Le numéro de téléphone est invalide");
    }
}
