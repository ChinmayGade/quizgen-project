package com.quizgen.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;

@Service
public class DocumentService {

    public String extractText(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename();
        if (filename == null)
            throw new IllegalArgumentException("No filename provided");

        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf")) {
            return extractFromPdf(file.getInputStream());
        } else if (lower.endsWith(".docx")) {
            return extractFromDocx(file.getInputStream());
        } else if (lower.endsWith(".txt")) {
            return extractFromTxt(file.getInputStream());
        } else {
            throw new IllegalArgumentException("Unsupported file type. Please upload PDF, DOCX, or TXT.");
        }
    }

    private String extractFromPdf(InputStream is) throws IOException {
        try (PDDocument doc = Loader.loadPDF(is.readAllBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return sanitizeText(stripper.getText(doc));
        }
    }

    private String extractFromDocx(InputStream is) throws IOException {
        try (XWPFDocument doc = new XWPFDocument(is)) {
            String raw = doc.getParagraphs().stream()
                    .map(XWPFParagraph::getText)
                    .filter(text -> text != null && !text.isBlank())
                    .collect(Collectors.joining("\n"));
            return sanitizeText(raw);
        }
    }

    private String extractFromTxt(InputStream is) throws IOException {
        return sanitizeText(new String(is.readAllBytes(), StandardCharsets.UTF_8));
    }

    /**
     * Clean up problematic Unicode characters that cause garbled display.
     * Replaces smart quotes, em/en dashes, bullets, non-breaking spaces, etc.
     */
    private String sanitizeText(String text) {
        if (text == null)
            return null;

        return text
                // Smart double quotes → regular quotes
                .replace('\u201C', '"') // "
                .replace('\u201D', '"') // "
                .replace('\u201E', '"') // „
                .replace('\u00AB', '"') // «
                .replace('\u00BB', '"') // »
                // Smart single quotes / apostrophes → regular apostrophe
                .replace('\u2018', '\'') // '
                .replace('\u2019', '\'') // '
                .replace('\u201A', '\'') // ‚
                .replace('\u2039', '\'') // ‹
                .replace('\u203A', '\'') // ›
                // Dashes
                .replace('\u2013', '-') // en dash –
                .replace('\u2014', '-') // em dash —
                .replace('\u2015', '-') // horizontal bar ―
                // Spaces
                .replace('\u00A0', ' ') // non-breaking space
                .replace('\u2007', ' ') // figure space
                .replace('\u202F', ' ') // narrow no-break space
                // Bullets and other symbols
                .replace('\u2022', '-') // bullet •
                .replace('\u2023', '-') // triangular bullet ‣
                .replace('\u2043', '-') // hyphen bullet ⁃
                // Ellipsis
                .replace("\u2026", "...") // … → ...
                // Remove any remaining non-ASCII control characters
                .replaceAll("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]", "")
                // Collapse multiple spaces
                .replaceAll(" {2,}", " ")
                .trim();
    }
}
