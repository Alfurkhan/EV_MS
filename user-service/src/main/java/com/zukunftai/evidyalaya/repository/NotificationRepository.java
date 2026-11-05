package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserOrderByCreatedAtDesc(User user);
    long countByUserAndReadAtIsNull(User user);
    Optional<Notification> findByIdAndUser(Long id, User user);
    List<Notification> findByUserAndReadAtIsNull(User user);
    boolean existsByDeduplicationKey(String deduplicationKey);
    List<Notification> findBySourceTypeAndSourceId(String sourceType, Long sourceId);
}
