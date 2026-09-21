package com.zukunftai.evidyalaya.service;

import com.zukunftai.evidyalaya.database.Subject;
import com.zukunftai.evidyalaya.model.StudentSubjectResponse;

import java.util.List;

public interface SubjectService {

    Subject createSubject(
            String name,
            String code,
            String description
    );

    List<Subject> getAllSubjects();

    Subject getSubjectById(Long id);

    Subject updateSubject(
            Long id,
            String name,
            String code,
            String description,
            boolean active
    );

    void deleteSubject(Long id);

    void assignFacultyToSubject(
            Long subjectId,
            Long facultyId
    );

    void removeFacultyFromSubject(
            Long subjectId,
            Long facultyId
    );

    void assignSubjectToGrade(
            Long subjectId,
            Long gradeId
    );

    void removeSubjectFromGrade(
            Long subjectId,
            Long gradeId
    );

    List<Subject> getSubjectsForFaculty(
            Long facultyId
    );

    List<Subject> getSubjectsForGrade(
            Long gradeId
    );

    List<Subject> getMySubjects();

    List<StudentSubjectResponse> getMyStudentSubjects();
}