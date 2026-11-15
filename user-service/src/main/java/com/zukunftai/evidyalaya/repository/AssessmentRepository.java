package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.Assessment;
import com.zukunftai.evidyalaya.database.AssessmentStatus;
import com.zukunftai.evidyalaya.database.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AssessmentRepository extends JpaRepository<Assessment, Long> {
    List<Assessment> findByFacultyOrderByCreatedAtDesc(User faculty);
    List<Assessment> findByFacultyAndStatusOrderByCreatedAtDesc(User faculty, AssessmentStatus status);
    Optional<Assessment> findByIdAndFaculty(Long id, User faculty);
}
