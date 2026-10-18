package com.quizgen.repository;

import com.quizgen.model.StudentAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StudentAttemptRepository extends JpaRepository<StudentAttempt, Long> {
    List<StudentAttempt> findByQuizId(Long quizId);

    List<StudentAttempt> findByQuizSessionId(String sessionId);
}
