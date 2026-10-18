package com.quizgen.service;

import com.quizgen.model.*;
import com.quizgen.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    @Autowired
    private StudentAttemptRepository attemptRepository;

    @Autowired
    private StudentAnswerRepository answerRepository;

    @Autowired
    private QuestionRepository questionRepository;

    public Map<String, Object> getAnalytics(String sessionId, Quiz quiz) {
        List<StudentAttempt> attempts = attemptRepository.findByQuizSessionId(sessionId);
        Map<String, Object> analytics = new HashMap<>();

        // Basic stats
        analytics.put("totalStudents", attempts.size());
        analytics.put("quizTitle", quiz.getTitle());
        analytics.put("sessionId", quiz.getSessionId());
        analytics.put("totalQuestions", quiz.getTotalQuestions());

        if (attempts.isEmpty()) {
            analytics.put("averageScore", 0);
            analytics.put("highestScore", 0);
            analytics.put("lowestScore", 0);
            analytics.put("scoreDistribution", Collections.emptyList());
            analytics.put("questionAccuracy", Collections.emptyList());
            analytics.put("studentScores", Collections.emptyList());
            return analytics;
        }

        // Score stats
        double avgScore = attempts.stream()
                .mapToDouble(a -> a.getMaxScore() > 0 ? (a.getTotalScore() / a.getMaxScore()) * 100 : 0)
                .average().orElse(0);
        double highest = attempts.stream()
                .mapToDouble(a -> a.getMaxScore() > 0 ? (a.getTotalScore() / a.getMaxScore()) * 100 : 0)
                .max().orElse(0);
        double lowest = attempts.stream()
                .mapToDouble(a -> a.getMaxScore() > 0 ? (a.getTotalScore() / a.getMaxScore()) * 100 : 0)
                .min().orElse(0);

        analytics.put("averageScore", Math.round(avgScore * 100.0) / 100.0);
        analytics.put("highestScore", Math.round(highest * 100.0) / 100.0);
        analytics.put("lowestScore", Math.round(lowest * 100.0) / 100.0);

        // Score distribution (buckets: 0-20, 20-40, 40-60, 60-80, 80-100)
        List<Map<String, Object>> distribution = new ArrayList<>();
        int[] buckets = new int[5];
        String[] labels = { "0-20%", "20-40%", "40-60%", "60-80%", "80-100%" };
        for (StudentAttempt a : attempts) {
            double pct = a.getMaxScore() > 0 ? (a.getTotalScore() / a.getMaxScore()) * 100 : 0;
            int idx = Math.min((int) (pct / 20), 4);
            buckets[idx]++;
        }
        for (int i = 0; i < 5; i++) {
            Map<String, Object> bucket = new HashMap<>();
            bucket.put("range", labels[i]);
            bucket.put("count", buckets[i]);
            distribution.add(bucket);
        }
        analytics.put("scoreDistribution", distribution);

        // Question-wise accuracy
        List<Question> questions = questionRepository.findByQuizIdOrderByQuestionOrderAsc(quiz.getId());
        List<Map<String, Object>> questionAccuracy = new ArrayList<>();
        for (Question q : questions) {
            List<StudentAnswer> answers = answerRepository.findByQuestionId(q.getId());
            double accuracy = 0;
            if (!answers.isEmpty()) {
                accuracy = answers.stream().mapToDouble(StudentAnswer::getScore).average().orElse(0) * 100;
            }
            Map<String, Object> qa = new HashMap<>();
            qa.put("questionId", q.getId());
            qa.put("questionOrder", q.getQuestionOrder());
            qa.put("questionText", q.getQuestionText().length() > 60
                    ? q.getQuestionText().substring(0, 60) + "..."
                    : q.getQuestionText());
            qa.put("type", q.getType());
            qa.put("accuracy", Math.round(accuracy * 100.0) / 100.0);
            qa.put("totalAttempts", answers.size());
            questionAccuracy.add(qa);
        }
        analytics.put("questionAccuracy", questionAccuracy);

        // Student scores table
        List<Map<String, Object>> studentScores = new ArrayList<>();
        for (StudentAttempt a : attempts) {
            Map<String, Object> ss = new HashMap<>();
            ss.put("attemptId", a.getId());
            ss.put("studentName", a.getStudentName());
            ss.put("totalScore", Math.round(a.getTotalScore() * 100.0) / 100.0);
            ss.put("maxScore", a.getMaxScore());
            double pct = a.getMaxScore() > 0 ? (a.getTotalScore() / a.getMaxScore()) * 100 : 0;
            ss.put("percentage", Math.round(pct * 100.0) / 100.0);
            ss.put("submittedAt", a.getSubmittedAt().toString());
            studentScores.add(ss);
        }
        analytics.put("studentScores", studentScores);

        return analytics;
    }

    public Map<String, Object> getStudentResults(StudentAttempt attempt, Quiz quiz) {
        Map<String, Object> results = new HashMap<>();
        results.put("studentName", attempt.getStudentName());
        results.put("totalScore", Math.round(attempt.getTotalScore() * 100.0) / 100.0);
        results.put("maxScore", attempt.getMaxScore());
        double pct = attempt.getMaxScore() > 0 ? (attempt.getTotalScore() / attempt.getMaxScore()) * 100 : 0;
        results.put("percentage", Math.round(pct * 100.0) / 100.0);

        // Percentile calculation
        List<StudentAttempt> allAttempts = attemptRepository.findByQuizSessionId(quiz.getSessionId());
        long belowCount = allAttempts.stream()
                .filter(a -> a.getTotalScore() < attempt.getTotalScore())
                .count();
        double percentile = allAttempts.size() > 1
                ? ((double) belowCount / (allAttempts.size() - 1)) * 100
                : 100;
        results.put("percentile", Math.round(percentile * 100.0) / 100.0);

        // Class average
        double classAvg = allAttempts.stream()
                .mapToDouble(a -> a.getMaxScore() > 0 ? (a.getTotalScore() / a.getMaxScore()) * 100 : 0)
                .average().orElse(0);
        results.put("classAverage", Math.round(classAvg * 100.0) / 100.0);

        // Per-question breakdown
        List<Question> questions = questionRepository.findByQuizIdOrderByQuestionOrderAsc(quiz.getId());
        List<StudentAnswer> studentAnswers = answerRepository.findByAttemptId(attempt.getId());
        Map<Long, StudentAnswer> answerMap = studentAnswers.stream()
                .collect(Collectors.toMap(a -> a.getQuestion().getId(), a -> a, (a, b) -> a));

        List<Map<String, Object>> questionResults = new ArrayList<>();
        for (Question q : questions) {
            Map<String, Object> qr = new HashMap<>();
            qr.put("questionId", q.getId());
            qr.put("questionOrder", q.getQuestionOrder());
            qr.put("questionText", q.getQuestionText());
            qr.put("type", q.getType());
            qr.put("correctAnswer", q.getCorrectAnswer());
            qr.put("options", q.getOptions());

            StudentAnswer sa = answerMap.get(q.getId());
            if (sa != null) {
                qr.put("studentAnswer", sa.getSelectedAnswer());
                qr.put("score", Math.round(sa.getScore() * 100.0) / 100.0);
                qr.put("isCorrect", sa.getScore() >= 0.99);
            } else {
                qr.put("studentAnswer", "");
                qr.put("score", 0);
                qr.put("isCorrect", false);
            }
            questionResults.add(qr);
        }
        results.put("questions", questionResults);

        // Performance data for chart
        List<Map<String, Object>> performanceData = new ArrayList<>();
        for (Question q : questions) {
            Map<String, Object> pd = new HashMap<>();
            pd.put("question", "Q" + q.getQuestionOrder());
            StudentAnswer sa = answerMap.get(q.getId());
            pd.put("score", sa != null ? Math.round(sa.getScore() * 100) : 0);

            // Class average for this question
            List<StudentAnswer> allAnswers = answerRepository.findByQuestionId(q.getId());
            double qAvg = allAnswers.stream().mapToDouble(StudentAnswer::getScore).average().orElse(0) * 100;
            pd.put("classAverage", Math.round(qAvg));
            performanceData.add(pd);
        }
        results.put("performanceData", performanceData);

        return results;
    }

    public String exportCSV(String sessionId, Quiz quiz) {
        List<StudentAttempt> attempts = attemptRepository.findByQuizSessionId(sessionId);
        List<Question> questions = questionRepository.findByQuizIdOrderByQuestionOrderAsc(quiz.getId());

        StringBuilder sb = new StringBuilder();

        // Header
        sb.append("Student Name,Total Score,Max Score,Percentage,Submitted At");
        for (Question q : questions) {
            sb.append(",Q").append(q.getQuestionOrder()).append(" Score");
        }
        sb.append("\n");

        // Rows
        for (StudentAttempt a : attempts) {
            double pct = a.getMaxScore() > 0 ? (a.getTotalScore() / a.getMaxScore()) * 100 : 0;
            sb.append(escapeCsv(a.getStudentName())).append(",");
            sb.append(Math.round(a.getTotalScore() * 100.0) / 100.0).append(",");
            sb.append(a.getMaxScore()).append(",");
            sb.append(Math.round(pct * 100.0) / 100.0).append("%,");
            sb.append(a.getSubmittedAt().toString());

            List<StudentAnswer> answers = answerRepository.findByAttemptId(a.getId());
            Map<Long, StudentAnswer> answerMap = answers.stream()
                    .collect(Collectors.toMap(sa -> sa.getQuestion().getId(), sa -> sa, (x, y) -> x));

            for (Question q : questions) {
                StudentAnswer sa = answerMap.get(q.getId());
                sb.append(",").append(sa != null ? Math.round(sa.getScore() * 100.0) / 100.0 : 0);
            }
            sb.append("\n");
        }

        return sb.toString();
    }

    private String escapeCsv(String value) {
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
