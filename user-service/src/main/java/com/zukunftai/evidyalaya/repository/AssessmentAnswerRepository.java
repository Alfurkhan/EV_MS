package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.AssessmentAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AssessmentAnswerRepository extends JpaRepository<AssessmentAnswer, Long> {
    List<AssessmentAnswer> findByAttemptIdOrderByQuestionPositionAsc(Long attemptId);
    void deleteByAttemptId(Long attemptId);
    Optional<AssessmentAnswer> findByAttemptIdAndQuestionId(Long attemptId, Long questionId);
}
