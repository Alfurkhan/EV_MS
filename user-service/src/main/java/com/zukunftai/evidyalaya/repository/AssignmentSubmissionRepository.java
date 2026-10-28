package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.Assignment;
import com.zukunftai.evidyalaya.database.AssignmentSubmission;
import com.zukunftai.evidyalaya.database.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AssignmentSubmissionRepository extends JpaRepository<AssignmentSubmission, Long> {
    Optional<AssignmentSubmission> findByAssignmentAndStudent(Assignment assignment, User student);
    List<AssignmentSubmission> findByAssignmentOrderBySubmittedAtDesc(Assignment assignment);
    List<AssignmentSubmission> findByStudentOrderByUpdatedAtDesc(User student);
    Optional<AssignmentSubmission> findByIdAndStudent(Long id, User student);
}
