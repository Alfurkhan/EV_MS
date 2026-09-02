package com.zukunftai.evidyalaya.service;

import com.zukunftai.evidyalaya.database.Section;

import java.util.List;

public interface SectionService {

    Section createSection(
            Long gradeId,
            String name,
            String description
    );

    List<Section> getAllSections();

    List<Section> getSectionsByGrade(
            Long gradeId
    );

    Section getSectionById(
            Long id
    );

    Section updateSection(
            Long id,
            String name,
            String description,
            boolean active
    );

    void deleteSection(
            Long id
    );
}