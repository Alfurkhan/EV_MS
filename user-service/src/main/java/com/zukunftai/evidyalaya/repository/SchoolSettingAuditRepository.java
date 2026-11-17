package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.SchoolSettingAudit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SchoolSettingAuditRepository extends JpaRepository<SchoolSettingAudit, Long> {
    List<SchoolSettingAudit> findTop100ByOrderByChangedAtDesc();
}
