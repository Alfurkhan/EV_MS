import api from "../../../api/axios";
export interface NotificationItem {
  id:number; sourceType:string; sourceId:number|null; title:string; message:string;
  category:string; priority:"NORMAL"|"IMPORTANT"|"URGENT"; targetUrl:string|null;
  read:boolean; readAt:string|null; createdAt:string;
}
export async function getNotifications(){return (await api.get<NotificationItem[]>("/notifications")).data;}
export async function getUnreadNotificationCount(){return (await api.get<number>("/notifications/unread-count")).data;}
export async function markNotificationRead(id:number){return (await api.post<NotificationItem>(`/notifications/${id}/read`)).data;}
export async function markAllNotificationsRead(){await api.post("/notifications/read-all");}

export interface ManualNotificationRequest { userId:number; title:string; message:string; category:string; priority:"NORMAL"|"IMPORTANT"|"URGENT"; targetUrl:string|null; }
export async function createManualNotification(data:ManualNotificationRequest){return (await api.post<NotificationItem>("/notifications/admin",data)).data;}
export async function updateManualNotification(id:number,data:ManualNotificationRequest){return (await api.put<NotificationItem>(`/notifications/admin/${id}`,data)).data;}
