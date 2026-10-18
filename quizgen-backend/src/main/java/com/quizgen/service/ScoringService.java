package com.quizgen.service;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ScoringService {

    public double scoreMCQ(String studentAnswer, String correctAnswer) {
        if (studentAnswer == null || correctAnswer == null)
            return 0.0;
        return studentAnswer.trim().equalsIgnoreCase(correctAnswer.trim()) ? 1.0 : 0.0;
    }

    public double scoreTheory(String studentAnswer, String correctAnswer) {
        if (studentAnswer == null || studentAnswer.isBlank())
            return 0.0;
        if (correctAnswer == null || correctAnswer.isBlank())
            return 0.0;

        // Cosine similarity using TF vectors
        Map<String, Double> vec1 = buildTfVector(studentAnswer);
        Map<String, Double> vec2 = buildTfVector(correctAnswer);

        return cosineSimilarity(vec1, vec2);
    }

    private Map<String, Double> buildTfVector(String text) {
        String[] words = text.toLowerCase().replaceAll("[^a-zA-Z0-9\\s]", "").split("\\s+");
        Map<String, Double> vector = new HashMap<>();
        for (String word : words) {
            if (word.length() > 2) {
                vector.merge(word, 1.0, Double::sum);
            }
        }
        return vector;
    }

    private double cosineSimilarity(Map<String, Double> vec1, Map<String, Double> vec2) {
        Set<String> allKeys = new HashSet<>();
        allKeys.addAll(vec1.keySet());
        allKeys.addAll(vec2.keySet());

        double dotProduct = 0.0;
        double norm1 = 0.0;
        double norm2 = 0.0;

        for (String key : allKeys) {
            double v1 = vec1.getOrDefault(key, 0.0);
            double v2 = vec2.getOrDefault(key, 0.0);
            dotProduct += v1 * v2;
            norm1 += v1 * v1;
            norm2 += v2 * v2;
        }

        if (norm1 == 0 || norm2 == 0)
            return 0.0;
        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }
}
