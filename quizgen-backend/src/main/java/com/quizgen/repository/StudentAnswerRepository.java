package com.quizgen.repository;

import com.quizgen.model.StudentAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StudentAnswerRepository extends JpaRepository<StudentAnswer, Long> {
    List<StudentAnswer> findByAttemptId(Long attemptId);

    List<StudentAnswer> findByQuestionId(Long questionId);
}
