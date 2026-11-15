import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { getNotifications, getUnreadNotificationCount, markAllNotificationsRead, markNotificationRead } from "../../features/notifications/services/notificationService";
import type { NotificationItem } from "../../features/notifications/services/notificationService";

export default function NotificationBell(){
 const [open,setOpen]=useState(false),[items,setItems]=useState<NotificationItem[]>([]),[unread,setUnread]=useState(0);
 const navigate=useNavigate();
 const {hasRole}=useAuth();
 const containerRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const handlePointerDown=(event:PointerEvent)=>{
   if(containerRef.current&&!containerRef.current.contains(event.target as Node))setOpen(false);
  };
  const handleKeyDown=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false);};
  document.addEventListener("pointerdown",handlePointerDown);
  document.addEventListener("keydown",handleKeyDown);
  return ()=>{
   document.removeEventListener("pointerdown",handlePointerDown);
   document.removeEventListener("keydown",handleKeyDown);
  };
 },[]);
 const refresh=async()=>{try{const [list,count]=await Promise.all([getNotifications(),getUnreadNotificationCount()]);setItems(list.slice(0,6));setUnread(count);}catch{/* Keep the header usable if notifications are temporarily unavailable. */}};
 useEffect(()=>{void refresh();const timer=window.setInterval(()=>void refresh(),45000);return()=>window.clearInterval(timer);},[]);
 const targetForNotification=(n:NotificationItem)=>{
  const isStudent=hasRole("ROLE_STUDENT"),isFaculty=hasRole("ROLE_FACULTY");
  switch(n.sourceType){
   case "ANNOUNCEMENT": return "/announcements";
   case "ASSIGNMENT": return isStudent?"/my-assignments":isFaculty?"/faculty-assignments":"/assignments";
   case "ASSESSMENT": return isStudent?"/my-assessments":isFaculty?"/faculty-assessments":"/admin-assessments";
   case "RESULT": return isStudent?"/my-assessments":isFaculty?"/faculty-assessments":"/admin-assessments";
   case "TIMETABLE": return isStudent?"/my-timetable":isFaculty?"/my-classes":"/timetable";
   case "CLASS_SESSION": return isStudent?"/my-timetable":isFaculty?"/my-classes":"/timetable";
   case "ATTENDANCE": return "/attendance";
   case "SUBJECT": return isStudent?"/my-subjects":"/courses";
   default: return n.targetUrl;
  }
 };
 const openNotification=async(n:NotificationItem)=>{
  if(!n.read){
   try{
    await markNotificationRead(n.id);
    setUnread(v=>Math.max(0,v-1));
    setItems(prev=>prev.map(item=>item.id===n.id?{...item,read:true}:item));
   }catch{
    toast.error("Could not update notification.");
    return;
   }
  }
  setOpen(false);
  const target=targetForNotification(n);
  if(!target){navigate("/notifications");return;}
  if(target.startsWith("/")){navigate(target);return;}
  if(/^https?:\/\//i.test(target)){window.location.assign(target);return;}
  toast.error("This notification has an unsupported destination.");
 };
 const markAll=async()=>{try{await markAllNotificationsRead();setItems(prev=>prev.map(n=>({...n,read:true})));setUnread(0);}catch{toast.error("Could not mark notifications as read.");}};
 return <div ref={containerRef} className="relative"><button type="button" aria-label={`Notifications, ${unread} unread`} onClick={()=>{setOpen(v=>!v);if(!open)void refresh();}} className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-indigo-600"><Bell size={22}/>{unread>0&&<span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{unread>99?"99+":unread}</span>}</button>
 {open&&<div className="absolute right-0 z-[90] mt-3 w-[min(92vw,380px)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"><div className="flex items-center justify-between border-b px-4 py-3"><div><p className="font-semibold text-slate-900">Notifications</p><p className="text-xs text-slate-500">{unread} unread</p></div><div className="flex items-center gap-3"><button onClick={()=>void markAll()} disabled={!unread} className="text-xs font-semibold text-indigo-600 disabled:text-slate-300"><CheckCheck size={14} className="mr-1 inline"/>Mark all read</button><button type="button" onClick={()=>setOpen(false)} aria-label="Close notifications" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={16}/></button></div></div><div className="max-h-[390px] overflow-y-auto">{items.length===0?<p className="p-8 text-center text-sm text-slate-500">You're all caught up.</p>:items.map(n=><button key={n.id} onClick={()=>void openNotification(n)} className={`block w-full border-b px-4 py-3 text-left transition hover:bg-slate-50 ${n.read?"bg-white":"bg-indigo-50/50"}`}><div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold text-slate-800">{n.title}</p>{!n.read&&<span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-600"/>}</div><p className="mt-1 line-clamp-2 text-xs text-slate-600">{n.message}</p><p className="mt-2 text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleString()}</p></button>)}</div><Link to="/notifications" onClick={()=>setOpen(false)} className="block bg-slate-50 px-4 py-3 text-center text-xs font-semibold text-indigo-700 hover:bg-slate-100">View all notifications</Link></div>}
 </div>;
}
