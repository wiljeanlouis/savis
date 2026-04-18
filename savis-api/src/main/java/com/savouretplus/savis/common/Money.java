package com.savouretplus.savis.common;

import java.math.BigDecimal;

public record Money(
        BigDecimal amount,
        String currency) {
    public static final Money ZERO = new Money(BigDecimal.ZERO, "CAD");

    public Money {
        if (amount == null)
            throw new IllegalArgumentException("Montant requis");
    }

    public Money add(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new IllegalArgumentException("Devises différentes !");
        }
        return new Money(this.amount.add(other.amount), this.currency);
    }

    public static Money of(double d) {
        return new Money(BigDecimal.valueOf(d), "CAD");
    }

    public Money multiply(int i) {
        return new Money(this.amount.multiply(BigDecimal.valueOf(i)), this.currency);
    }
}
