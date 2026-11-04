import api from "../../../api/axios";

export type Priority = "NORMAL" | "IMPORTANT" | "URGENT";
export type Audience = "ALL" | "STUDENTS" | "FACULTY" | "CLASS";
export type AnnouncementStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
export interface Announcement {
  id:number; title:string; message:string; audienceType:Audience;
  academicYearId:number|null; gradeId:number|null; sectionId:number|null;
  priority:Priority; status:AnnouncementStatus; authorName:string;
  scheduledAt:string|null; expiresAt:string|null; publishedAt:string|null;
  readCount:number; unreadCount:number; readAt:string|null; createdAt:string; updatedAt:string;
}
export interface AnnouncementRequest {
  title:string; message:string; audienceType:Audience; academicYearId:number|null;
  gradeId:number|null; sectionId:number|null; priority:Priority;
  scheduledAt:string|null; expiresAt:string|null;
}
export async function getAnnouncements(){return (await api.get<Announcement[]>("/announcements")).data;}
export async function createAnnouncement(data:AnnouncementRequest){return (await api.post<Announcement>("/announcements",data)).data;}
export async function updateAnnouncement(id:number,data:AnnouncementRequest){return (await api.put<Announcement>(`/announcements/${id}`,data)).data;}
export async function publishAnnouncement(id:number){return (await api.post<Announcement>(`/announcements/${id}/publish`)).data;}
export async function archiveAnnouncement(id:number){await api.post(`/announcements/${id}/archive`);}
export async function markAnnouncementRead(id:number){await api.post(`/announcements/${id}/read`);}
