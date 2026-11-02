package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.AssessmentQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AssessmentQuestionRepository extends JpaRepository<AssessmentQuestion, Long> {
    List<AssessmentQuestion> findByAssessmentIdOrderByPositionAsc(Long assessmentId);
    void deleteByAssessmentId(Long assessmentId);
}
