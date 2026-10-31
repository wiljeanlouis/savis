package com.savouretplus.savis.common;

import java.math.BigDecimal;
import java.util.Currency;
import java.util.Locale;
import java.util.Objects;

/**
 * Represents a monetary amount in a specific currency.
 */
public record Money(
        BigDecimal amount,
        String currency) {
    public static final Money ZERO = new Money(BigDecimal.ZERO, "CAD");

    /**
     * Validates and normalizes a monetary amount.
     */
    public Money {
        if (amount == null) {
            throw new IllegalArgumentException("Montant requis");
        }
        if (currency == null || currency.isBlank()) {
            throw new IllegalArgumentException("Devise requise");
        }
        currency = currency.trim().toUpperCase(Locale.ROOT);
        try {
            Currency.getInstance(currency);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Devise invalide: " + currency, exception);
        }
    }

     /**
      * Creates a new value object from the provided input.
      */
     public static Money of(double d) {
        /**
         * Creates a money instance.
         */
        return new Money(BigDecimal.valueOf(d), "CAD");
    }

     /**
      * Creates a new value object from the provided input.
      */
     public static Money of(String amount, String currency) {
        /**
         * Creates a money instance.
         */
        return new Money(new BigDecimal(amount), currency);
    }

    /**
     * Returns the sum of this money amount and another amount with the same currency.
     */
    public Money add(Money other) {
        Objects.requireNonNull(other, "Le montant à additionner est requis");
        if (!this.currency.equals(other.currency)) {
            throw new IllegalArgumentException("Devises différentes !");
        }
        /**
         * Creates a money instance.
         */
        return new Money(this.amount.add(other.amount), this.currency);
    }

    /**
     * Returns this money amount multiplied by the provided factor.
     */
    public Money multiply(int i) {
        /**
         * Creates a money instance.
         */
        return new Money(this.amount.multiply(BigDecimal.valueOf(i)), this.currency);
    }

    /**
     * Returns this money amount multiplied by the provided factor.
     */
    public Money multiply(BigDecimal multiplier) {
        /**
         * Creates a money instance.
         */
        return new Money(this.amount.multiply(multiplier), this.currency);
    }

}
