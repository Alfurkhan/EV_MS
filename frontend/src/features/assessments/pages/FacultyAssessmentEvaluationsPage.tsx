import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, CheckCircle2, Clock3, RefreshCw, Save } from "lucide-react";
import { getAssessmentEvaluations, getAssessmentEvaluation, gradeAssessmentAnswer, publishAssessmentResults } from "../services/facultyEvaluationService";
import { downloadStudentAnswerSheet } from "../services/studentAssessmentService";
import type { FacultyEvaluationAttempt } from "../types/facultyEvaluation";

const field = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";
const pretty = (value: unknown) => value == null ? "No answer submitted" : typeof value === "string" ? value : JSON.stringify(value);

export default function FacultyAssessmentEvaluationsPage() {
  const { assessmentId } = useParams();
  const id = Number(assessmentId);
  const [items, setItems] = useState<FacultyEvaluationAttempt[]>([]);
  const [selected, setSelected] = useState<FacultyEvaluationAttempt | null>(null);
  const [marks, setMarks] = useState<Record<number,string>>({});
  const [feedback, setFeedback] = useState<Record<number,string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number|null>(null);
  const [publishing, setPublishing] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const rows = await getAssessmentEvaluations(id);
      setItems(rows);
      if (selected) {
        const current = rows.find(x => x.attemptId === selected.attemptId);
        if (current) setSelected(await getAssessmentEvaluation(id, current.attemptId));
      }
    } catch (e:any) { toast.error(e?.response?.data?.message ?? "Could not load submissions."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void refresh(); }, [id]);
  useEffect(() => {
    if (!selected) return;
    const m:Record<number,string>={}, f:Record<number,string>={};
    selected.answers.forEach(a => { m[a.questionId] = a.marksAwarded == null ? "" : String(a.marksAwarded); f[a.questionId] = a.feedback ?? ""; });
    setMarks(m); setFeedback(f);
  }, [selected?.attemptId, selected?.answers]);

  const open = async (attemptId:number) => {
    try { setSelected(await getAssessmentEvaluation(id, attemptId)); }
    catch(e:any) { toast.error(e?.response?.data?.message ?? "Could not open submission."); }
  };
  const publishResults = async () => {
    if (!window.confirm("Publish results for all submitted attempts? Students will be able to see their scores.")) return;
    setPublishing(true);
    try { await publishAssessmentResults(id); toast.success("Results published to students."); await refresh(); }
    catch(e:any) { toast.error(e?.response?.data?.message ?? "Results could not be published."); }
    finally { setPublishing(false); }
  };
  const save = async (questionId:number, maximum:number) => {
    const value = Number(marks[questionId]);
    if (marks[questionId] === "" || !Number.isFinite(value) || value < 0 || value > maximum) {
      toast.error(`Enter marks from 0 to ${maximum}.`); return;
    }
    setSaving(questionId);
    try {
      const updated = await gradeAssessmentAnswer(id, selected!.attemptId, questionId, value, feedback[questionId] ?? "");
      setSelected(updated);
      setItems(old => old.map(x => x.attemptId === updated.attemptId ? updated : x));
      toast.success("Evaluation saved.");
    } catch(e:any) { toast.error(e?.response?.data?.message ?? "Could not save evaluation."); }
    finally { setSaving(null); }
  };

  return <div className="mx-auto max-w-6xl space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><Link to="/faculty-assessments" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600"><ArrowLeft size={15}/> Back to Quiz &amp; Exams</Link><h1 className="mt-2 text-2xl font-bold text-slate-900">Assessment evaluations</h1><p className="mt-1 text-sm text-slate-500">Review submissions and grade short-answer or descriptive responses.</p></div>
      <div className="flex gap-2"><button onClick={()=>void refresh()} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"><RefreshCw size={15}/> Refresh</button><button disabled={publishing||items.length===0||items.some(x=>!x.evaluationComplete)} onClick={()=>void publishResults()} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">{publishing?"Publishing…":"Publish results"}</button></div>
    </header>
    <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-900">Submitted attempts</h2>
        {loading ? <p className="py-8 text-center text-sm text-slate-500">Loading…</p> : items.length===0 ? <p className="py-8 text-center text-sm text-slate-500">No submissions yet.</p> :
          <div className="mt-3 space-y-2">{items.map(a=><button key={a.attemptId} onClick={()=>void open(a.attemptId)} className={`w-full rounded-lg border p-3 text-left ${selected?.attemptId===a.attemptId?"border-indigo-400 bg-indigo-50":"border-slate-200 hover:bg-slate-50"}`}><div className="flex items-center justify-between gap-2"><span className="font-semibold text-slate-800">{a.studentName}</span><span className="text-[11px] text-slate-500">{a.status==="AUTO_SUBMITTED"?"Auto-submitted":"Submitted"}</span></div><p className="mt-1 text-xs text-slate-500">{a.studentUsername}</p><div className="mt-2 flex items-center justify-between text-xs"><span className={a.evaluationComplete?"text-emerald-700":"text-amber-700"}>{a.evaluationComplete?"Evaluation complete":"Pending evaluation"}</span><span className="font-semibold text-slate-700">{a.score??0}/{a.totalMarks}</span></div></button>)}</div>}
      </section>
      <section className="space-y-4">
        {!selected ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500"><Clock3 className="mx-auto mb-2 text-slate-300"/>Choose a submitted attempt to review.</div> :
          <><div className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-900">{selected.studentName}</h2><p className="text-sm text-slate-500">{selected.assessmentTitle} · {selected.status.replace("_"," ")}</p></div><div className="text-right"><p className="text-xs text-slate-500">Current score</p><p className="text-xl font-bold text-slate-900">{selected.score??0} / {selected.totalMarks}</p></div></div></div>
          {selected.answers.map((a,i)=><article key={a.questionId} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-slate-900">Q{i+1}. {a.questionText}</h3><span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{a.maximumMarks} marks</span></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Student answer</p><p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{pretty(a.submittedAnswer)}</p>{a.hasAttachment&&<button onClick={()=>void downloadStudentAnswerSheet(selected.attemptId,a.questionId,a.attachmentName??"answer-sheet").catch(()=>toast.error("Answer sheet download failed."))} className="mt-2 text-sm font-semibold text-indigo-600">Download answer sheet · {a.attachmentName}</button>}</div>
            {!a.manualEvaluation ? <div className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 size={16}/> Automatically graded · {a.marksAwarded??0}/{a.maximumMarks}</div> :
              <div className="grid gap-3 sm:grid-cols-[150px_minmax(0,1fr)]"><label className="text-sm font-medium text-slate-700">Marks awarded<input type="number" min="0" max={a.maximumMarks} step="0.01" className={field} value={marks[a.questionId]??""} onChange={e=>setMarks(old=>({...old,[a.questionId]:e.target.value}))}/></label><label className="text-sm font-medium text-slate-700">Feedback<textarea rows={2} className={field} value={feedback[a.questionId]??""} onChange={e=>setFeedback(old=>({...old,[a.questionId]:e.target.value}))} placeholder="Feedback for the student (optional)"/></label><div className="sm:col-span-2"><button disabled={saving===a.questionId} onClick={()=>void save(a.questionId,a.maximumMarks)} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"><Save size={15}/>{saving===a.questionId?"Saving…":"Save evaluation"}</button></div></div>}
          </article>)}</>}
      </section>
    </div>
  </div>;
}
