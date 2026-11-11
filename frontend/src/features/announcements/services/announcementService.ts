import api from "../../../api/axios";

export type Priority = "NORMAL" | "IMPORTANT" | "URGENT";
export type Audience = "ALL" | "STUDENTS" | "FACULTY" | "CLASS" | "GRADE";
export type AnnouncementTargetScope = "CLASS" | "SUBJECT";
export type AnnouncementStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
export interface AnnouncementAttachment {
  id:number;
  fileName:string;
  contentType:string;
  fileSize:number;
  uploadedAt:string;
  downloadUrl:string;
}
export interface Announcement {
  id:number; title:string; message:string; audienceType:Audience;
  academicYearId:number|null; gradeId:number|null; sectionId:number|null; gradeIds:number[]; targetGradeLabels:string[];
  targetScope:AnnouncementTargetScope; subjectName:string|null; timetableAssignmentIds:number[]; targetClassLabels:string[];
  priority:Priority; status:AnnouncementStatus; authorName:string;
  scheduledAt:string|null; expiresAt:string|null; publishedAt:string|null;
  readCount:number; unreadCount:number; readAt:string|null; canManage:boolean; createdAt:string; updatedAt:string;
  attachments:AnnouncementAttachment[];
}
export interface AnnouncementRequest {
  title:string; message:string; audienceType:Audience; academicYearId:number|null;
  gradeId:number|null; sectionId:number|null; gradeIds:number[]; targetScope:AnnouncementTargetScope; timetableAssignmentIds:number[]; priority:Priority;
  scheduledAt:string|null; expiresAt:string|null;
}
export async function getAnnouncements(){return (await api.get<Announcement[]>("/announcements")).data;}
export async function createAnnouncement(data:AnnouncementRequest){return (await api.post<Announcement>("/announcements",data)).data;}
export async function updateAnnouncement(id:number,data:AnnouncementRequest){return (await api.put<Announcement>(`/announcements/${id}`,data)).data;}

export async function updateAnnouncementWithAttachments(id:number,data:AnnouncementRequest,files:File[]):Promise<Announcement>{
  const form=new FormData();
  form.append("request",new Blob([JSON.stringify(data)],{type:"application/json"}));
  files.forEach(file=>form.append("files",file));
  return (await api.put<Announcement>(`/announcements/${id}/edit`,form,{headers:{"Content-Type":"multipart/form-data"}})).data;
}
export async function publishAnnouncement(id:number){return (await api.post<Announcement>(`/announcements/${id}/publish`)).data;}
export async function archiveAnnouncement(id:number){await api.post(`/announcements/${id}/archive`);}
export async function markAnnouncementRead(id:number){await api.post(`/announcements/${id}/read`);}

export async function markAllAnnouncementsRead(){await api.post("/announcements/read-all");}
export async function deleteAnnouncement(id:number){await api.delete(`/announcements/${id}`);}


export async function uploadAnnouncementAttachments(id:number, files:File[]):Promise<Announcement>{
  const form=new FormData();
  files.forEach(file=>form.append("files",file));
  return (await api.post<Announcement>(`/announcements/${id}/attachments`,form,{headers:{"Content-Type":"multipart/form-data"}})).data;
}

export async function deleteAnnouncementAttachment(id:number,attachmentId:number):Promise<void>{
  await api.delete(`/announcements/${id}/attachments/${attachmentId}`);
}

async function fetchAnnouncementAttachment(url:string,inline=false):Promise<Blob>{
  const separator=url.includes("?")?"&":"?";
  return (await api.get<Blob>(`${url}${inline?separator+"inline=true":""}`,{responseType:"blob"})).data;
}

function saveBlob(blob:Blob,filename:string){
  const objectUrl=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=objectUrl;
  link.download=filename||"announcement-attachment";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(objectUrl),1000);
}

export async function downloadAnnouncementAttachment(attachment:AnnouncementAttachment):Promise<void>{
  const blob=await fetchAnnouncementAttachment(attachment.downloadUrl);
  saveBlob(blob,attachment.fileName);
}

export async function previewAnnouncementAttachment(attachment:AnnouncementAttachment):Promise<void>{
  if(attachment.contentType!=="application/pdf"&&!attachment.contentType.startsWith("image/")){
    throw new Error("Preview is available for PDF and image files only.");
  }
  const previewWindow=window.open("about:blank","_blank");
  if(!previewWindow) throw new Error("Your browser blocked the preview window. Allow pop-ups and try again.");
  try{
    const blob=await fetchAnnouncementAttachment(attachment.downloadUrl,true);
    const objectUrl=URL.createObjectURL(blob);
    previewWindow.location.href=objectUrl;
    window.setTimeout(()=>URL.revokeObjectURL(objectUrl),60000);
  }catch(error){
    previewWindow.close();
    throw error;
  }
}
