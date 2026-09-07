package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.Subject;
import com.zukunftai.evidyalaya.database.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SubjectRepository
        extends JpaRepository<Subject, Long> {

    Optional<Subject> findByName(String name);

    Optional<Subject> findByCode(String code);

    boolean existsByName(String name);

    boolean existsByCode(String code);

    List<Subject> findByActiveTrue();

    List<Subject> findByFacultiesContaining(User faculty);

    /*
     * ============================================================
     * FIND SUBJECTS BY GRADE
     * ============================================================
     */

    List<Subject> findByGradesId(Long gradeId);

    @Query("""
        SELECT DISTINCT s
        FROM Subject s
        LEFT JOIN FETCH s.faculties
        """)
    List<Subject> findAllWithFaculties();

    @Query("""
        SELECT DISTINCT s
        FROM Subject s
        LEFT JOIN FETCH s.faculties
        WHERE s.id = :id
        """)
    Optional<Subject> findByIdWithFaculties(
            @Param("id") Long id
    );
}