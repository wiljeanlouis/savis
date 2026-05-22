package com.savouretplus.savis.common;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class UnitTest {

    @Test
    void fromCode_ShouldAcceptCanonicalCodes() {
        Assertions.assertEquals(Unit.GRAM, Unit.fromSymbole("g"));
        Assertions.assertEquals(Unit.KILOGRAM, Unit.fromSymbole("kg"));
        Assertions.assertEquals(Unit.LITER, Unit.fromSymbole("l"));
        Assertions.assertEquals(Unit.MILLILITER, Unit.fromSymbole("ml"));
        Assertions.assertEquals(Unit.PIECE, Unit.fromSymbole("piece"));
        Assertions.assertEquals(Unit.PORTION, Unit.fromSymbole("portion"));
    }

    @Test
    void fromCode_ShouldAcceptJavaEnumNamesDuringTransition() {
        Assertions.assertEquals(Unit.GRAM, Unit.fromSymbole("GRAM"));
        Assertions.assertEquals(Unit.KILOGRAM, Unit.fromSymbole("KILOGRAM"));
        Assertions.assertEquals(Unit.LITER, Unit.fromSymbole("LITER"));
        Assertions.assertEquals(Unit.MILLILITER, Unit.fromSymbole("MILLILITER"));
        Assertions.assertEquals(Unit.PIECE, Unit.fromSymbole("PIECE"));
        Assertions.assertEquals(Unit.PORTION, Unit.fromSymbole("PORTION"));
    }

    @Test
    void getSymbole_ShouldReturnCanonicalSymbol() {
        Assertions.assertEquals("kg", Unit.KILOGRAM.getSymbole());
        Assertions.assertEquals("portion", Unit.PORTION.getSymbole());
    }
}
