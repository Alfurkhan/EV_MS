import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Download, Eye, File, FileImage, FileSpreadsheet, FileText, Paperclip, Presentation, Trash2, UploadCloud, X } from "lucide-react";
import {
  downloadAnnouncementAttachment,
  previewAnnouncementAttachment,
  type AnnouncementAttachment,
} from "../services/announcementService";

const MAX_FILE_SIZE=25*1024*1024;
const MAX_FILES=5;
const ACCEPTED_EXTENSIONS=[".pdf",".jpg",".jpeg",".png",".docx",".xlsx",".pptx",".txt"];
const ACCEPTED_LABEL="PDF, JPG, PNG, DOCX, XLSX, PPTX or TXT";

interface Props {
  attachments:AnnouncementAttachment[];
  selectedFiles:File[];
  onSelectedFilesChange:(files:File[])=>void;
  editable?:boolean;
  onRemoveAttachment?:(id:number)=>void;
  removingAttachmentId?:number|null;
}

function formatSize(bytes:number){
  if(bytes<1024)return bytes+" B";
  if(bytes<1024*1024)return (bytes/1024).toFixed(0)+" KB";
  return (bytes/(1024*1024)).toFixed(1)+" MB";
}
function extension(name:string){return name.slice(name.lastIndexOf(".")).toLowerCase();}
function fileIcon(name:string){
  const ext=extension(name);
  if([".jpg",".jpeg",".png"].includes(ext))return FileImage;
  if(ext===".xlsx")return FileSpreadsheet;
  if(ext===".pptx")return Presentation;
  if([".pdf",".docx",".txt"].includes(ext))return FileText;
  return File;
}
function canPreview(attachment:AnnouncementAttachment){
  return attachment.contentType==="application/pdf"||attachment.contentType.startsWith("image/");
}

export default function AnnouncementAttachments({
  attachments,selectedFiles,onSelectedFilesChange,editable=false,onRemoveAttachment,removingAttachmentId=null
}:Props){
  const inputRef=useRef<HTMLInputElement>(null);
  const [dragging,setDragging]=useState(false);
  const remaining=Math.max(0,MAX_FILES-attachments.length-selectedFiles.length);

  const addFiles=(incoming:FileList|File[])=>{
    const files=Array.from(incoming);
    if(!files.length)return;
    const accepted:File[]=[];
    for(const file of files){
      const ext=extension(file.name);
      if(!ACCEPTED_EXTENSIONS.includes(ext)){
        toast.error(`${file.name}: unsupported file type.`);
        continue;
      }
      if(file.size===0){
        toast.error(`${file.name}: empty files cannot be uploaded.`);
        continue;
      }
      if(file.size>MAX_FILE_SIZE){
        toast.error(`${file.name}: exceeds the 25 MB limit.`);
        continue;
      }
      if(attachments.length+selectedFiles.length+accepted.length>=MAX_FILES){
        toast.error("An announcement can have at most 5 attachments.");
        break;
      }
      if([...attachments.map(a=>a.fileName),...selectedFiles.map(f=>f.name),...accepted.map(f=>f.name)].some(n=>n.toLowerCase()===file.name.toLowerCase())){
        toast.error(`${file.name}: a file with this name is already attached.`);
        continue;
      }
      accepted.push(file);
    }
    if(accepted.length)onSelectedFilesChange([...selectedFiles,...accepted]);
    if(inputRef.current)inputRef.current.value="";
  };

  const action=async(kind:"preview"|"download",attachment:AnnouncementAttachment)=>{
    try{
      if(kind==="preview")await previewAnnouncementAttachment(attachment);
      else await downloadAnnouncementAttachment(attachment);
    }catch(error){
      toast.error(error instanceof Error?error.message:"Could not open this attachment.");
    }
  };

  return <section className="space-y-3" aria-label="Announcement attachments">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <Paperclip size={16} className="text-indigo-600"/>Attachments
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{attachments.length+selectedFiles.length}/5</span>
      </div>
      {editable&&<span className="text-[11px] text-slate-500">Up to 25 MB per file</span>}
    </div>

    {editable&&<div
      onDragEnter={event=>{event.preventDefault();setDragging(true);}}
      onDragOver={event=>{event.preventDefault();setDragging(true);}}
      onDragLeave={event=>{event.preventDefault();if(!event.currentTarget.contains(event.relatedTarget as Node|null))setDragging(false);}}
      onDrop={event=>{event.preventDefault();setDragging(false);addFiles(event.dataTransfer.files);}}
      className={`rounded-xl border-2 border-dashed p-5 text-center transition-colors ${dragging?"border-indigo-500 bg-indigo-50":"border-slate-300 bg-slate-50/70 hover:border-indigo-300 hover:bg-indigo-50/40"} `}
    >
      <input ref={inputRef} type="file" multiple accept={ACCEPTED_EXTENSIONS.join(",")} className="hidden" onChange={event=>event.target.files&&addFiles(event.target.files)}/>
      <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm"><UploadCloud size={21}/></span>
      <p className="mt-2 text-sm font-semibold text-slate-800">Drop files here, or <button type="button" disabled={remaining===0} onClick={()=>inputRef.current?.click()} className="text-indigo-600 underline underline-offset-2 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40">browse files</button></p>
      <p className="mt-1 text-xs text-slate-500">{ACCEPTED_LABEL} · 25 MB maximum per file · {remaining} {remaining===1?"slot":"slots"} remaining</p>
      <p className="mt-1 text-[11px] text-slate-400">Files are uploaded securely when you save the announcement.</p>
    </div>}

    {attachments.length===0&&selectedFiles.length===0&&!editable&&<p className="rounded-lg bg-slate-50 px-3 py-3 text-xs text-slate-500">No attachments were added to this announcement.</p>}

    {(attachments.length>0||selectedFiles.length>0)&&<div className="grid gap-2 sm:grid-cols-2">
      {attachments.map(attachment=>{
        const Icon=fileIcon(attachment.fileName);
        return <div key={attachment.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Icon size={20}/></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800" title={attachment.fileName}>{attachment.fileName}</p>
            <p className="mt-0.5 text-xs text-slate-500">{formatSize(attachment.fileSize)} · Uploaded</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {canPreview(attachment)&&<button type="button" onClick={()=>void action("preview",attachment)} title="Preview attachment" aria-label={`Preview ${attachment.fileName}`} className="rounded-lg p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"><Eye size={16}/></button>}
            <button type="button" onClick={()=>void action("download",attachment)} title="Download attachment" aria-label={`Download ${attachment.fileName}`} className="rounded-lg p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"><Download size={16}/></button>
            {editable&&onRemoveAttachment&&<button type="button" disabled={removingAttachmentId===attachment.id} onClick={()=>onRemoveAttachment(attachment.id)} title="Remove attachment" aria-label={`Remove ${attachment.fileName}`} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 disabled:opacity-40"><Trash2 size={16}/></button>}
          </div>
        </div>;
      })}
      {selectedFiles.map((file,index)=>{
        const Icon=fileIcon(file.name);
        return <div key={`${file.name}-${file.lastModified}-${index}`} className="flex min-w-0 items-center gap-3 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600"><Icon size={20}/></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800" title={file.name}>{file.name}</p>
            <p className="mt-0.5 text-xs text-slate-500">{formatSize(file.size)} · Ready to upload</p>
          </div>
          {editable&&<button type="button" onClick={()=>onSelectedFilesChange(selectedFiles.filter((_,i)=>i!==index))} title="Remove selected file" aria-label={`Remove selected ${file.name}`} className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-white hover:text-rose-600"><X size={16}/></button>}
        </div>;
      })}
    </div>}
  </section>;
}
