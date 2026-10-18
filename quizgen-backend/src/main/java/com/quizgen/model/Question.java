package com.quizgen.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
@Table(name = "questions")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    @JsonBackReference("quiz-questions")
    private Quiz quiz;

    @Column(nullable = false, columnDefinition = "CLOB")
    private String questionText;

    @Column(nullable = false)
    private String type; // MCQ or THEORY

    @Column(columnDefinition = "CLOB")
    private String options; // JSON array for MCQ: ["opt1","opt2","opt3","opt4"]

    @Column(nullable = false, columnDefinition = "CLOB")
    private String correctAnswer;

    @Column(nullable = false)
    private int questionOrder;

    // Constructors
    public Question() {
    }

    public Question(Quiz quiz, String questionText, String type, String options, String correctAnswer,
            int questionOrder) {
        this.quiz = quiz;
        this.questionText = questionText;
        this.type = type;
        this.options = options;
        this.correctAnswer = correctAnswer;
        this.questionOrder = questionOrder;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Quiz getQuiz() {
        return quiz;
    }

    public void setQuiz(Quiz quiz) {
        this.quiz = quiz;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getOptions() {
        return options;
    }

    public void setOptions(String options) {
        this.options = options;
    }

    public String getCorrectAnswer() {
        return correctAnswer;
    }

    public void setCorrectAnswer(String correctAnswer) {
        this.correctAnswer = correctAnswer;
    }

    public int getQuestionOrder() {
        return questionOrder;
    }

    public void setQuestionOrder(int questionOrder) {
        this.questionOrder = questionOrder;
    }
}
