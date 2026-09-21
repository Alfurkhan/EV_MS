package com.zukunftai.evidyalaya.service;

import com.zukunftai.evidyalaya.model.ClassSessionResponse;
import com.zukunftai.evidyalaya.model.FacultyMyClassResponse;

import java.time.LocalDate;
import java.util.List;

public interface ClassSessionService {

    ClassSessionResponse startClass(Long timetableId);

    ClassSessionResponse endClass(Long sessionId);

    ClassSessionResponse getSessionById(Long sessionId);

    List<ClassSessionResponse> getMySessions();

    List<ClassSessionResponse> getMySessionsByDate(LocalDate date);

    List<ClassSessionResponse> getSessionsByDate(LocalDate date);

    List<ClassSessionResponse> getSessionsByTimetable(Long timetableId);

    List<FacultyMyClassResponse> getMyClassesToday();
}