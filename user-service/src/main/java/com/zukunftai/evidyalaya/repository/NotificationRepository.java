package com.zukunftai.evidyalaya.repository;
import com.zukunftai.evidyalaya.database.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findTop100ByUserOrderByCreatedAtDesc(User user);
    long countByUserAndReadAtIsNull(User user);
    Optional<Notification> findByIdAndUser(Long id, User user);
    List<Notification> findByUserAndReadAtIsNull(User user);
}
