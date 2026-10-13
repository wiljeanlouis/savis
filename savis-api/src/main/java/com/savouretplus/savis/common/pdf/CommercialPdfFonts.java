package com.savouretplus.savis.common.pdf;

import java.io.IOException;
import java.io.InputStream;

import org.springframework.core.io.ClassPathResource;

import com.openhtmltopdf.extend.FSSupplier;
import com.openhtmltopdf.outputdevice.helper.BaseRendererBuilder.FontStyle;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;

/**
 * Registers the fonts embedded in SAVIS commercial PDF documents.
 */
public final class CommercialPdfFonts {
    public static final String BODY_FAMILY = "Savis Sans";
    public static final String TITLE_FAMILY = "Savis Title";

    private static final String FONT_ROOT = "fonts/";

    private CommercialPdfFonts() {
    }

    /**
     * Adds every supported text style to the provided renderer builder.
     *
     * @param builder PDF renderer being configured
     * @return the configured builder
     */
    public static PdfRendererBuilder registerOn(PdfRendererBuilder builder) {
        builder.useFont(font("liberation-sans/LiberationSans-Regular.ttf"), BODY_FAMILY, 400, FontStyle.NORMAL,
                true);
        builder.useFont(font("liberation-sans/LiberationSans-Bold.ttf"), BODY_FAMILY, 700, FontStyle.NORMAL, true);
        builder.useFont(font("liberation-sans/LiberationSans-Italic.ttf"), BODY_FAMILY, 400, FontStyle.ITALIC, true);
        builder.useFont(font("liberation-sans/LiberationSans-BoldItalic.ttf"), BODY_FAMILY, 700, FontStyle.ITALIC,
                true);
        builder.useFont(font("roboto-condensed/RobotoCondensed-Bold.ttf"), TITLE_FAMILY, 700, FontStyle.NORMAL, true);
        return builder;
    }

    private static FSSupplier<InputStream> font(String path) {
        return () -> {
            try {
                return new ClassPathResource(FONT_ROOT + path).getInputStream();
            } catch (IOException exception) {
                throw new IllegalStateException("Impossible de charger la police PDF " + path, exception);
            }
        };
    }
}
