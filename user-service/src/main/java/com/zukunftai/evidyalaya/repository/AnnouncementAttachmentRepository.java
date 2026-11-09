package com.zukunftai.evidyalaya.repository;

import com.zukunftai.evidyalaya.database.Announcement;
import com.zukunftai.evidyalaya.database.AnnouncementAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AnnouncementAttachmentRepository extends JpaRepository<AnnouncementAttachment, Long> {
    List<AnnouncementAttachment> findByAnnouncementOrderByCreatedAtAsc(Announcement announcement);
    Optional<AnnouncementAttachment> findByIdAndAnnouncement(Long id, Announcement announcement);
    long countByAnnouncement(Announcement announcement);
}
