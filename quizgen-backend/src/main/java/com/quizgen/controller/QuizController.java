package com.quizgen.controller;

import com.quizgen.dto.QuizSubmissionRequest;
import com.quizgen.model.*;
import com.quizgen.repository.*;
import com.quizgen.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@RequestMapping("/api/quiz")
public class QuizController {

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private StudentAttemptRepository attemptRepository;

    @Autowired
    private StudentAnswerRepository answerRepository;

    @Autowired
    private DocumentService documentService;

    @Autowired
    private QuizGenerationService quizGenerationService;

    @Autowired
    private ScoringService scoringService;

    @Autowired
    private AnalyticsService analyticsService;

    /**
     * Generate a quiz from an uploaded document.
     */
    @PostMapping("/generate")
    public ResponseEntity<?> generateQuiz(
            @RequestParam("file") MultipartFile file,
            @RequestParam("difficulty") String difficulty,
            @RequestParam("questionCount") int questionCount,
            @RequestParam("questionType") String questionType,
            @RequestParam(value = "title", required = false) String title) {
        try {
            // Extract text from document
            String text = documentService.extractText(file);
            if (text == null || text.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Could not extract text from the document."));
            }

            // Generate session ID
            String sessionId = UUID.randomUUID().toString().substring(0, 8).toUpperCase();

            // Create quiz
            String quizTitle = (title != null && !title.isBlank()) ? title : file.getOriginalFilename();
            Quiz quiz = new Quiz(sessionId, quizTitle, difficulty.toUpperCase(), questionType.toUpperCase(),
                    questionCount);
            quiz.setSourceText(text);
            quiz = quizRepository.save(quiz);

            // Generate questions
            List<Question> questions = quizGenerationService.generateQuestions(quiz, text, questionCount, difficulty,
                    questionType.toUpperCase());
            for (Question q : questions) {
                q.setQuiz(quiz);
            }
            questionRepository.saveAll(questions);

            quiz.setTotalQuestions(questions.size());
            quiz = quizRepository.save(quiz);

            Map<String, Object> response = new HashMap<>();
            response.put("sessionId", sessionId);
            response.put("title", quiz.getTitle());
            response.put("totalQuestions", questions.size());
            response.put("difficulty", quiz.getDifficulty());
            response.put("questionType", quiz.getQuestionType());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to generate quiz: " + e.getMessage()));
        }
    }

    /**
     * Get quiz for teacher review (includes correct answers).
     */
    @GetMapping("/{sessionId}/review")
    public ResponseEntity<?> getQuizForReview(@PathVariable String sessionId) {
        Optional<Quiz> opt = quizRepository.findBySessionId(sessionId.toUpperCase());
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Quiz quiz = opt.get();
        List<Question> questions = questionRepository.findByQuizIdOrderByQuestionOrderAsc(quiz.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("sessionId", quiz.getSessionId());
        response.put("title", quiz.getTitle());
        response.put("difficulty", quiz.getDifficulty());
        response.put("questionType", quiz.getQuestionType());
        response.put("totalQuestions", quiz.getTotalQuestions());
        response.put("published", quiz.isPublished());

        List<Map<String, Object>> questionList = new ArrayList<>();
        for (Question q : questions) {
            Map<String, Object> qMap = new HashMap<>();
            qMap.put("id", q.getId());
            qMap.put("questionText", q.getQuestionText());
            qMap.put("type", q.getType());
            qMap.put("questionOrder", q.getQuestionOrder());
            qMap.put("options", q.getOptions());
            qMap.put("correctAnswer", q.getCorrectAnswer()); // Include answer for teacher
            questionList.add(qMap);
        }
        response.put("questions", questionList);

        return ResponseEntity.ok(response);
    }

    /**
     * Update questions (teacher edits before publishing).
     */
    @PutMapping("/{sessionId}/questions")
    public ResponseEntity<?> updateQuestions(@PathVariable String sessionId,
            @RequestBody List<Map<String, Object>> updates) {
        Optional<Quiz> opt = quizRepository.findBySessionId(sessionId.toUpperCase());
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Quiz quiz = opt.get();
        if (quiz.isPublished()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot edit a published quiz."));
        }

        for (Map<String, Object> update : updates) {
            Long questionId = ((Number) update.get("id")).longValue();
            Optional<Question> qOpt = questionRepository.findById(questionId);
            if (qOpt.isEmpty())
                continue;

            Question q = qOpt.get();
            // Verify this question belongs to this quiz
            if (!q.getQuiz().getId().equals(quiz.getId()))
                continue;

            if (update.containsKey("questionText")) {
                q.setQuestionText((String) update.get("questionText"));
            }
            if (update.containsKey("correctAnswer")) {
                q.setCorrectAnswer((String) update.get("correctAnswer"));
            }
            if (update.containsKey("options")) {
                Object opts = update.get("options");
                if (opts instanceof String) {
                    q.setOptions((String) opts);
                } else if (opts instanceof List) {
                    try {
                        q.setOptions(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(opts));
                    } catch (Exception ignored) {
                    }
                }
            }
            questionRepository.save(q);
        }

        return ResponseEntity.ok(Map.of("status", "updated"));
    }

    /**
     * Publish a quiz (makes it available to students).
     */
    @PostMapping("/{sessionId}/publish")
    public ResponseEntity<?> publishQuiz(@PathVariable String sessionId) {
        Optional<Quiz> opt = quizRepository.findBySessionId(sessionId.toUpperCase());
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Quiz quiz = opt.get();
        quiz.setPublished(true);
        quizRepository.save(quiz);

        return ResponseEntity.ok(Map.of("status", "published", "sessionId", quiz.getSessionId()));
    }

    /**
     * Get quiz details for students (without correct answers).
     */
    @GetMapping("/{sessionId}")
    public ResponseEntity<?> getQuiz(@PathVariable String sessionId) {
        Optional<Quiz> opt = quizRepository.findBySessionId(sessionId.toUpperCase());
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Quiz quiz = opt.get();
        if (!quiz.isPublished()) {
            return ResponseEntity.badRequest().body(Map.of("error", "This quiz is not yet published by the teacher."));
        }

        List<Question> questions = questionRepository.findByQuizIdOrderByQuestionOrderAsc(quiz.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("sessionId", quiz.getSessionId());
        response.put("title", quiz.getTitle());
        response.put("difficulty", quiz.getDifficulty());
        response.put("questionType", quiz.getQuestionType());
        response.put("totalQuestions", quiz.getTotalQuestions());

        List<Map<String, Object>> questionList = new ArrayList<>();
        for (Question q : questions) {
            Map<String, Object> qMap = new HashMap<>();
            qMap.put("id", q.getId());
            qMap.put("questionText", q.getQuestionText());
            qMap.put("type", q.getType());
            qMap.put("questionOrder", q.getQuestionOrder());
            qMap.put("options", q.getOptions());
            // Do NOT include correctAnswer for students
            questionList.add(qMap);
        }
        response.put("questions", questionList);

        return ResponseEntity.ok(response);
    }

    /**
     * Submit quiz answers.
     */
    @PostMapping("/{sessionId}/submit")
    public ResponseEntity<?> submitQuiz(@PathVariable String sessionId, @RequestBody QuizSubmissionRequest request) {
        Optional<Quiz> opt = quizRepository.findBySessionId(sessionId.toUpperCase());
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Quiz quiz = opt.get();
        StudentAttempt attempt = new StudentAttempt(quiz, request.getStudentName());
        attempt = attemptRepository.save(attempt);

        double totalScore = 0;
        double maxScore = 0;
        List<StudentAnswer> answers = new ArrayList<>();

        for (QuizSubmissionRequest.AnswerDto ansDto : request.getAnswers()) {
            Optional<Question> qOpt = questionRepository.findById(ansDto.getQuestionId());
            if (qOpt.isEmpty())
                continue;

            Question question = qOpt.get();
            double score;
            maxScore += 1.0;

            if ("MCQ".equals(question.getType())) {
                score = scoringService.scoreMCQ(ansDto.getAnswer(), question.getCorrectAnswer());
            } else {
                score = scoringService.scoreTheory(ansDto.getAnswer(), question.getCorrectAnswer());
            }

            totalScore += score;
            StudentAnswer sa = new StudentAnswer(attempt, question, ansDto.getAnswer(), score);
            answers.add(sa);
        }

        answerRepository.saveAll(answers);
        attempt.setTotalScore(totalScore);
        attempt.setMaxScore(maxScore);
        attempt = attemptRepository.save(attempt);

        Map<String, Object> response = new HashMap<>();
        response.put("attemptId", attempt.getId());
        response.put("totalScore", Math.round(totalScore * 100.0) / 100.0);
        response.put("maxScore", maxScore);
        double pct = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
        response.put("percentage", Math.round(pct * 100.0) / 100.0);

        return ResponseEntity.ok(response);
    }

    /**
     * Get analytics for a quiz (teacher dashboard).
     */
    @GetMapping("/{sessionId}/analytics")
    public ResponseEntity<?> getAnalytics(@PathVariable String sessionId) {
        Optional<Quiz> opt = quizRepository.findBySessionId(sessionId.toUpperCase());
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(analyticsService.getAnalytics(sessionId.toUpperCase(), opt.get()));
    }

    /**
     * Get student results.
     */
    @GetMapping("/{sessionId}/results/{attemptId}")
    public ResponseEntity<?> getStudentResults(@PathVariable String sessionId, @PathVariable Long attemptId) {
        Optional<Quiz> quizOpt = quizRepository.findBySessionId(sessionId.toUpperCase());
        if (quizOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Optional<StudentAttempt> attemptOpt = attemptRepository.findById(attemptId);
        if (attemptOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(analyticsService.getStudentResults(attemptOpt.get(), quizOpt.get()));
    }

    /**
     * Export results as CSV.
     */
    @GetMapping("/{sessionId}/export")
    public ResponseEntity<byte[]> exportCSV(@PathVariable String sessionId) {
        Optional<Quiz> opt = quizRepository.findBySessionId(sessionId.toUpperCase());
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String csv = analyticsService.exportCSV(sessionId.toUpperCase(), opt.get());
        byte[] bytes = csv.getBytes();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDisposition(ContentDisposition.builder("attachment")
                .filename("quiz_results_" + sessionId + ".csv")
                .build());

        return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
    }
}
