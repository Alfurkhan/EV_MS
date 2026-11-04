package com.zukunftai.evidyalaya.repository;
import com.zukunftai.evidyalaya.database.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface AnnouncementRecipientRepository extends JpaRepository<AnnouncementRecipient, Long> {
    List<AnnouncementRecipient> findByUserOrderByDeliveredAtDesc(User user);
    Optional<AnnouncementRecipient> findByAnnouncementAndUser(Announcement announcement, User user);
    long countByAnnouncementAndReadAtIsNotNull(Announcement announcement);
    long countByAnnouncementAndReadAtIsNull(Announcement announcement);
    List<AnnouncementRecipient> findByAnnouncement(Announcement announcement);
}
