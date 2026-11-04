package com.zukunftai.evidyalaya.repository;
import com.zukunftai.evidyalaya.database.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findByCreatedByOrderByCreatedAtDesc(User createdBy);
    List<Announcement> findByStatusAndScheduledAtLessThanEqual(AnnouncementStatus status, java.time.LocalDateTime now);
    List<Announcement> findByStatusAndExpiresAtLessThanEqual(AnnouncementStatus status, java.time.LocalDateTime now);
}
