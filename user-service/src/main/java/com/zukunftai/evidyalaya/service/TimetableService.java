package com.zukunftai.evidyalaya.service;

import com.zukunftai.evidyalaya.database.Timetable;
import com.zukunftai.evidyalaya.model.TimetableRequest;

import java.util.List;

public interface TimetableService {

    Timetable createTimetable(TimetableRequest request);

    List<Timetable> getAllTimetables();

    Timetable getTimetableById(Long id);

    Timetable updateTimetable(Long id, TimetableRequest request);

    void deleteTimetable(Long id);

    void disableTimetable(Long id);

    void enableTimetable(Long id);

    List<Timetable> getTimetablesByAcademicYear(Long academicYearId);

    List<Timetable> getTimetablesByGrade(Long gradeId);

    List<Timetable> getTimetablesBySection(Long sectionId);

    List<Timetable> getTimetablesByFaculty(Long facultyId);

    List<Timetable> getMyTimetable();

    List<Timetable> getMyStudentTimetable();
}