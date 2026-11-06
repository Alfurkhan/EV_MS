package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.Assessment;
import com.zukunftai.evidyalaya.database.AssessmentAttempt;
import com.zukunftai.evidyalaya.database.AssessmentAttemptStatus;
import com.zukunftai.evidyalaya.database.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AssessmentAttemptRepository extends JpaRepository<AssessmentAttempt, Long> {
    Optional<AssessmentAttempt> findByAssessmentAndStudent(Assessment assessment, User student);
    List<AssessmentAttempt> findByAssessment(Assessment assessment);
    long countByAssessmentId(Long assessmentId);
    Optional<AssessmentAttempt> findByIdAndStudent(Long id, User student);
    List<AssessmentAttempt> findByStudentOrderByCreatedAtDesc(User student);
    List<AssessmentAttempt> findByStatusAndDeadlineAtLessThanEqual(AssessmentAttemptStatus status, java.time.Instant deadlineAt);
}
