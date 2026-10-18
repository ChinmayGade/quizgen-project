package com.quizgen.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quizgen.model.Question;
import com.quizgen.model.Quiz;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Generates content-based quiz questions from document text.
 *
 * Strategy:
 * - Extract factual statements (Subject → Predicate) from sentences
 * - MCQ: Ask "What is [subject]?" with answer = predicate, distractors =
 * predicates from OTHER facts
 * - Theory: Ask about key concepts with targeted questions
 * - All questions test comprehension of the content, NOT grammar or vocabulary
 */
@Service
public class QuizGenerationService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Random random = new Random();

    private static final Set<String> STOP_WORDS = Set.of(
            "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
            "have", "has", "had", "do", "does", "did", "will", "would", "could",
            "should", "may", "might", "shall", "can", "need", "dare", "ought",
            "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
            "as", "into", "through", "during", "before", "after", "above", "below",
            "between", "out", "off", "over", "under", "again", "further", "then",
            "once", "here", "there", "when", "where", "why", "how", "all", "both",
            "each", "few", "more", "most", "other", "some", "such", "no", "nor",
            "not", "only", "own", "same", "so", "than", "too", "very", "and",
            "but", "or", "if", "while", "that", "this", "these", "those", "it",
            "its", "he", "she", "they", "them", "his", "her", "their", "we",
            "you", "your", "i", "me", "my", "what", "which", "who", "whom",
            "also", "just", "about", "many", "much", "well", "like", "however",
            "therefore", "although", "because", "since", "often", "usually",
            "sometimes", "always", "never", "already", "still", "even");

    // ================================================================
    // PUBLIC API
    // ================================================================

    public List<Question> generateQuestions(Quiz quiz, String text, int count, String difficulty, String questionType) {
        List<String> sentences = splitIntoSentences(text);
        if (sentences.isEmpty())
            return new ArrayList<>();

        sentences = deduplicateSentences(sentences);

        // Extract factual content from each sentence
        List<ContentFact> facts = extractFacts(sentences);
        if (facts.isEmpty())
            return new ArrayList<>();

        // Rank facts by importance using TF-IDF on keywords
        Map<String, Double> keywordScores = computeKeywordScores(sentences);
        rankFacts(facts, keywordScores);

        // Filter by difficulty
        facts = filterByDifficulty(facts, difficulty);
        if (facts.isEmpty())
            return new ArrayList<>();

        List<Question> questions = new ArrayList<>();
        Set<String> usedSubjects = new HashSet<>();

        for (ContentFact fact : facts) {
            if (questions.size() >= count)
                break;

            // Skip if we already made a question about this subject
            String subjectKey = fact.subject.toLowerCase().trim();
            if (usedSubjects.stream().anyMatch(u -> similarity(u, subjectKey) > 0.6))
                continue;

            String type = resolveType(questionType, questions.size());
            Question q;

            if ("MCQ".equals(type)) {
                q = generateContentMCQ(quiz, fact, facts, questions.size() + 1);
            } else {
                q = generateContentTheory(quiz, fact, questions.size() + 1);
            }

            if (q != null) {
                questions.add(q);
                usedSubjects.add(subjectKey);
            }
        }

        return questions;
    }

    // ================================================================
    // FACT EXTRACTION — The core innovation
    // ================================================================

    /**
     * A ContentFact represents a single piece of knowledge extracted from text:
     * "Subject" — "is/does/has" — "Predicate"
     *
     * Examples:
     * "Photosynthesis" — "is" — "the process by which plants convert sunlight into
     * energy"
     * "The mitochondria" — "is" — "the powerhouse of the cell"
     * "DNA" — "contains" — "the genetic instructions for all living things"
     */
    private record ContentFact(String subject, String verb, String predicate, String originalSentence, double score) {
        ContentFact withScore(double newScore) {
            return new ContentFact(subject, verb, predicate, originalSentence, newScore);
        }
    }

    /**
     * Extract structured facts from sentences using multiple patterns.
     * Only keeps facts where both subject and predicate are substantial.
     */
    private List<ContentFact> extractFacts(List<String> sentences) {
        List<ContentFact> facts = new ArrayList<>();

        for (String sentence : sentences) {
            ContentFact fact = tryExtractFact(sentence);
            if (fact != null) {
                facts.add(fact);
            }
        }

        return facts;
    }

    private ContentFact tryExtractFact(String sentence) {
        String cleaned = sentence.trim();
        if (cleaned.endsWith("."))
            cleaned = cleaned.substring(0, cleaned.length() - 1);

        // Try multiple patterns in order of specificity

        // Pattern 1: "X is defined as / known as / referred to as Y"
        Matcher m = Pattern.compile(
                "^(.{3,60})\\s+(?:is|are)\\s+(?:defined as|known as|referred to as|described as|called)\\s+(.{10,})$",
                Pattern.CASE_INSENSITIVE).matcher(cleaned);
        if (m.matches()) {
            return makeFact(m.group(1), "is defined as", m.group(2), sentence);
        }

        // Pattern 2: "X is/are used to/for Y"
        m = Pattern.compile(
                "^(.{3,60})\\s+(?:is|are)\\s+used\\s+(?:to|for|in)\\s+(.{10,})$",
                Pattern.CASE_INSENSITIVE).matcher(cleaned);
        if (m.matches()) {
            return makeFact(m.group(1), "is used for", m.group(2), sentence);
        }

        // Pattern 3: "X consists of / contains / includes Y"
        m = Pattern.compile(
                "^(.{3,60})\\s+(?:consists?\\s+of|contains?|includes?|comprises?)\\s+(.{10,})$",
                Pattern.CASE_INSENSITIVE).matcher(cleaned);
        if (m.matches()) {
            return makeFact(m.group(1), "consists of", m.group(2), sentence);
        }

        // Pattern 4: "X provides / enables / allows / helps / causes / produces Y"
        m = Pattern.compile(
                "^(.{3,60})\\s+(?:provides?|enables?|allows?|helps?|causes?|produces?|creates?|generates?)\\s+(.{10,})$",
                Pattern.CASE_INSENSITIVE).matcher(cleaned);
        if (m.matches()) {
            return makeFact(m.group(1), "provides", m.group(2), sentence);
        }

        // Pattern 5: "X plays a/an ... role in Y"
        m = Pattern.compile(
                "^(.{3,60})\\s+plays?\\s+(?:a|an)\\s+(.+?)\\s+role\\s+in\\s+(.{5,})$",
                Pattern.CASE_INSENSITIVE).matcher(cleaned);
        if (m.matches()) {
            String predicate = "plays a " + m.group(2).trim() + " role in " + m.group(3).trim();
            return makeFact(m.group(1), "plays a role in", predicate, sentence);
        }

        // Pattern 6: "X is/are [substantial predicate]" — general definitional
        m = Pattern.compile(
                "^(.{3,50})\\s+(?:is|are)\\s+(.{15,})$",
                Pattern.CASE_INSENSITIVE).matcher(cleaned);
        if (m.matches()) {
            String subject = m.group(1).trim();
            String predicate = m.group(2).trim();
            // The predicate must be substantial (not just an adjective)
            if (predicate.split("\\s+").length >= 3) {
                return makeFact(subject, "is", predicate, sentence);
            }
        }

        // Pattern 7: "X was/were [substantial predicate]" — historical facts
        m = Pattern.compile(
                "^(.{3,50})\\s+(?:was|were)\\s+(.{15,})$",
                Pattern.CASE_INSENSITIVE).matcher(cleaned);
        if (m.matches()) {
            String predicate = m.group(2).trim();
            if (predicate.split("\\s+").length >= 3) {
                return makeFact(m.group(1), "was", predicate, sentence);
            }
        }

        // Pattern 8: "X has/have [substantial predicate]"
        m = Pattern.compile(
                "^(.{3,50})\\s+(?:has|have)\\s+(.{15,})$",
                Pattern.CASE_INSENSITIVE).matcher(cleaned);
        if (m.matches()) {
            String predicate = m.group(2).trim();
            if (predicate.split("\\s+").length >= 3) {
                return makeFact(m.group(1), "has", predicate, sentence);
            }
        }

        // Pattern 9: "X can/could [verb phrase]"
        m = Pattern.compile(
                "^(.{3,50})\\s+(?:can|could)\\s+(.{10,})$",
                Pattern.CASE_INSENSITIVE).matcher(cleaned);
        if (m.matches()) {
            return makeFact(m.group(1), "can", m.group(2), sentence);
        }

        return null;
    }

    private ContentFact makeFact(String subject, String verb, String predicate, String sentence) {
        subject = subject.trim();
        predicate = predicate.trim();

        // Reject if subject is too generic or starts with a lowercase pronoun
        String subjectLower = subject.toLowerCase();
        if (subjectLower.matches("^(it|this|that|these|those|they|he|she|we|there|here)\\b.*")) {
            return null;
        }

        // Reject if predicate is too short or subject is too long
        if (predicate.split("\\s+").length < 2)
            return null;
        if (subject.split("\\s+").length > 10)
            return null;

        return new ContentFact(subject, verb, predicate, sentence, 0);
    }

    // ================================================================
    // MCQ GENERATION — Content-based
    // ================================================================

    private Question generateContentMCQ(Quiz quiz, ContentFact fact, List<ContentFact> allFacts, int order) {
        // The question asks about the subject, the answer is the predicate
        String questionText = buildMCQQuestion(fact, order);
        String correctAnswer = truncateOption(capitalizeFirst(fact.predicate.trim()));

        // Distractors: predicates from OTHER facts (content from the same document, but
        // about different topics)
        final String answer = correctAnswer;
        List<String> distractors = allFacts.stream()
                .filter(f -> !f.subject.equalsIgnoreCase(fact.subject))
                .filter(f -> similarity(f.predicate.toLowerCase(), fact.predicate.toLowerCase()) < 0.5)
                .map(f -> truncateOption(capitalizeFirst(f.predicate.trim())))
                .filter(d -> !d.equalsIgnoreCase(answer))
                .distinct()
                .collect(Collectors.toList());

        Collections.shuffle(distractors, random);

        List<String> options = new ArrayList<>();
        options.add(correctAnswer);
        for (String d : distractors) {
            if (options.size() >= 4)
                break;
            if (options.stream().noneMatch(o -> o.equalsIgnoreCase(d))) {
                options.add(d);
            }
        }

        if (options.size() < 4)
            return null; // Not enough content for good distractors

        Collections.shuffle(options, random);

        try {
            String optionsJson = objectMapper.writeValueAsString(options);
            return new Question(quiz, questionText, "MCQ", optionsJson, correctAnswer, order);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private String truncateOption(String text) {
        if (text.length() > 120) {
            int cutoff = text.lastIndexOf(' ', 115);
            if (cutoff > 50)
                return text.substring(0, cutoff) + "...";
        }
        return text;
    }

    /**
     * Build a natural-sounding MCQ question based on the fact type.
     * Uses the order number to rotate through diverse phrasings.
     */
    private String buildMCQQuestion(ContentFact fact, int order) {
        String s = fact.subject.trim();

        List<String> templates = switch (fact.verb) {
            case "is defined as" -> List.of(
                    "How is " + s + " defined?",
                    "What is the definition of " + s + "?",
                    "Which statement correctly defines " + s + "?",
                    "According to the text, how would you define " + s + "?");
            case "is used for" -> List.of(
                    "What is " + s + " used for?",
                    "What is the primary purpose of " + s + "?",
                    "How is " + s + " utilized?",
                    "Which statement describes the use of " + s + "?");
            case "consists of" -> List.of(
                    "What does " + s + " consist of?",
                    "What are the components of " + s + "?",
                    "Which of the following describes the composition of " + s + "?",
                    "What is " + s + " made up of?");
            case "provides" -> List.of(
                    "What does " + s + " provide or enable?",
                    "What is the function of " + s + "?",
                    "Which of the following is provided by " + s + "?",
                    "What outcome does " + s + " produce?");
            case "plays a role in" -> List.of(
                    "What role does " + s + " play?",
                    "How does " + s + " contribute?",
                    "What is the significance of " + s + "?",
                    "Which statement describes the role of " + s + "?");
            case "is" -> List.of(
                    "Which of the following best describes " + s + "?",
                    "What is " + s + "?",
                    "According to the text, what is true about " + s + "?",
                    "How would you describe " + s + "?",
                    "Which statement about " + s + " is correct?",
                    "What do we know about " + s + " from the text?");
            case "was" -> List.of(
                    "What was " + s + "?",
                    "Which statement correctly describes what " + s + " was?",
                    "According to the text, what was " + s + "?",
                    "How would you describe " + s + " historically?");
            case "has" -> List.of(
                    "What does " + s + " have?",
                    "Which characteristic belongs to " + s + "?",
                    "What property of " + s + " is described in the text?",
                    "Which of the following is a feature of " + s + "?");
            case "can" -> List.of(
                    "What can " + s + " do?",
                    "Which capability is associated with " + s + "?",
                    "What ability does " + s + " possess?",
                    "According to the text, what is " + s + " capable of?");
            default -> List.of(
                    "Which of the following is true about " + s + "?",
                    "What can be said about " + s + "?",
                    "Which statement about " + s + " is accurate?",
                    "What does the text say about " + s + "?");
        };

        return templates.get((order - 1) % templates.size());
    }

    // ================================================================
    // THEORY GENERATION — Content-based
    // ================================================================

    private Question generateContentTheory(Quiz quiz, ContentFact fact, int order) {
        String questionText = buildTheoryQuestion(fact, order);
        // The correct answer is the full original sentence
        String answer = fact.originalSentence.trim();

        return new Question(quiz, questionText, "THEORY", null, answer, order);
    }

    private String buildTheoryQuestion(ContentFact fact, int order) {
        String s = fact.subject.trim();

        List<String> templates = switch (fact.verb) {
            case "is defined as" -> List.of(
                    "Define " + s + " and explain its significance.",
                    "What is meant by " + s + "? Provide a detailed explanation.",
                    "In your own words, explain how " + s + " is defined.");
            case "is used for" -> List.of(
                    "Explain what " + s + " is used for and why it is important.",
                    "Describe the purpose and applications of " + s + ".",
                    "Why is " + s + " used? Explain with details from the text.");
            case "consists of" -> List.of(
                    "Describe what " + s + " consists of.",
                    "List and explain the components of " + s + ".",
                    "What makes up " + s + "? Describe its composition.");
            case "provides" -> List.of(
                    "Explain what " + s + " provides or enables.",
                    "Describe the contributions or outputs of " + s + ".",
                    "What results from " + s + "? Explain in detail.");
            case "plays a role in" -> List.of(
                    "Describe the role that " + s + " plays and its importance.",
                    "Explain how " + s + " contributes and why it matters.",
                    "What is the significance of " + s + "?");
            case "is" -> List.of(
                    "Explain what " + s + " is in your own words.",
                    "Describe " + s + " based on the text.",
                    "Provide a detailed explanation of " + s + ".",
                    "What is " + s + "? Explain with relevant details.",
                    "Summarize what the text says about " + s + ".");
            case "was" -> List.of(
                    "Describe what " + s + " was and its historical context.",
                    "Explain the significance of " + s + " in its historical setting.",
                    "What was " + s + "? Provide a detailed account.");
            case "has" -> List.of(
                    "Describe what " + s + " has and why it matters.",
                    "What are the key properties of " + s + "? Explain.",
                    "Discuss the characteristics of " + s + " mentioned in the text.");
            case "can" -> List.of(
                    "Explain what " + s + " can do and its implications.",
                    "Describe the capabilities of " + s + ".",
                    "What is " + s + " able to accomplish? Explain.");
            default -> List.of(
                    "Explain the following concept: " + s + ".",
                    "Describe " + s + " in detail.",
                    "What do you know about " + s + " from the text?");
        };

        return templates.get((order - 1) % templates.size());
    }

    // ================================================================
    // RANKING & FILTERING
    // ================================================================

    private void rankFacts(List<ContentFact> facts, Map<String, Double> keywordScores) {
        for (int i = 0; i < facts.size(); i++) {
            ContentFact f = facts.get(i);
            List<String> words = tokenize(f.originalSentence);
            double score = words.stream()
                    .mapToDouble(w -> keywordScores.getOrDefault(w, 0.0))
                    .sum() / Math.max(words.size(), 1);

            // Bonus for definitional facts (more likely to be important)
            if (f.verb.contains("defined") || f.verb.equals("is"))
                score += 0.3;
            // Bonus for subjects that start with capital letter (proper nouns / key terms)
            if (Character.isUpperCase(f.subject.charAt(0)))
                score += 0.2;
            // Bonus for longer predicates (more informative)
            if (f.predicate.split("\\s+").length >= 5)
                score += 0.1;

            facts.set(i, f.withScore(score));
        }
        facts.sort(Comparator.comparingDouble(ContentFact::score).reversed());
    }

    private List<ContentFact> filterByDifficulty(List<ContentFact> facts, String difficulty) {
        if (facts.isEmpty())
            return facts;
        return switch (difficulty.toUpperCase()) {
            case "EASY" -> facts.stream()
                    .filter(f -> f.predicate.split("\\s+").length <= 20)
                    .collect(Collectors.toList());
            case "HARD" -> facts.stream()
                    .filter(f -> f.predicate.split("\\s+").length >= 5)
                    .collect(Collectors.toList());
            default -> facts;
        };
    }

    private String resolveType(String questionType, int index) {
        if ("MCQ".equals(questionType))
            return "MCQ";
        if ("THEORY".equals(questionType))
            return "THEORY";
        return index % 2 == 0 ? "MCQ" : "THEORY";
    }

    // ================================================================
    // NLP UTILITIES
    // ================================================================

    private List<String> splitIntoSentences(String text) {
        text = text.replaceAll("[\\r\\n]+", " ")
                .replaceAll("\\s+", " ")
                .replaceAll("\\s*\\.\\s*\\.\\s*\\.\\s*", "... ")
                .trim();

        String[] parts = text.split("(?<=[.!?])\\s+");

        return Arrays.stream(parts)
                .map(String::trim)
                .filter(s -> s.length() >= 25)
                .filter(s -> s.split("\\s+").length >= 5)
                .filter(s -> s.split("\\s+").length <= 50)
                .filter(s -> countLetters(s) > s.length() * 0.6)
                .filter(s -> !s.toLowerCase().startsWith("http"))
                .filter(s -> !s.contains("|"))
                .filter(s -> !s.matches(".*\\d{4,}.*")) // Skip IDs/numbers-heavy
                .filter(s -> !s.matches("^\\d+\\.?\\s+.*")) // Skip numbered lists markers
                .filter(s -> !s.toLowerCase().startsWith("figure"))
                .filter(s -> !s.toLowerCase().startsWith("table"))
                .filter(s -> !s.toLowerCase().startsWith("source"))
                .filter(s -> !s.toLowerCase().startsWith("reference"))
                .collect(Collectors.toList());
    }

    private long countLetters(String s) {
        return s.chars().filter(Character::isLetter).count();
    }

    private List<String> deduplicateSentences(List<String> sentences) {
        List<String> result = new ArrayList<>();
        for (String s : sentences) {
            boolean isDup = false;
            Set<String> sWords = new HashSet<>(tokenize(s));
            for (String existing : result) {
                Set<String> eWords = new HashSet<>(tokenize(existing));
                if (similarity(sWords, eWords) > 0.7) {
                    isDup = true;
                    break;
                }
            }
            if (!isDup)
                result.add(s);
        }
        return result;
    }

    private Map<String, Double> computeKeywordScores(List<String> sentences) {
        Map<String, Integer> termFreq = new HashMap<>();
        Map<String, Integer> docFreq = new HashMap<>();
        int totalDocs = sentences.size();

        for (String sentence : sentences) {
            List<String> words = tokenize(sentence);
            Set<String> uniqueWords = new HashSet<>(words);
            for (String word : words) {
                termFreq.merge(word, 1, Integer::sum);
            }
            for (String word : uniqueWords) {
                docFreq.merge(word, 1, Integer::sum);
            }
        }

        Map<String, Double> scores = new HashMap<>();
        for (Map.Entry<String, Integer> entry : termFreq.entrySet()) {
            String word = entry.getKey();
            double tf = Math.log(1 + entry.getValue());
            double idf = Math.log((double) totalDocs / (1 + docFreq.getOrDefault(word, 0)));
            double score = tf * idf;
            if (word.length() >= 6)
                score *= 1.3;
            scores.put(word, score);
        }

        return scores;
    }

    private List<String> tokenize(String text) {
        return Arrays.stream(text.toLowerCase().split("[^a-zA-Z0-9]+"))
                .filter(w -> w.length() > 2)
                .filter(w -> !STOP_WORDS.contains(w))
                .collect(Collectors.toList());
    }

    /**
     * Jaccard similarity between two sets of words.
     */
    private double similarity(Set<String> a, Set<String> b) {
        Set<String> intersection = new HashSet<>(a);
        intersection.retainAll(b);
        Set<String> union = new HashSet<>(a);
        union.addAll(b);
        return union.isEmpty() ? 0 : (double) intersection.size() / union.size();
    }

    /**
     * Simple word-overlap similarity between two strings.
     */
    private double similarity(String a, String b) {
        Set<String> aWords = new HashSet<>(tokenize(a));
        Set<String> bWords = new HashSet<>(tokenize(b));
        return similarity(aWords, bWords);
    }

    private String capitalizeFirst(String s) {
        if (s == null || s.isEmpty())
            return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}
