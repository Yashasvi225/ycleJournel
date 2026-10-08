import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X, Plus, Trash2, Pencil } from "lucide-react";
import { api } from "../api";

const SYMPTOMS=["Cramps","Headache","Bloating","Fatigue","Mood changes","Back pain","Acne","Other"];
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const parse=s=>{const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const daysBetween=(a,b)=>Math.round((parse(b)-parse(a))/86400000);

function estimateRange(cycles){
 const starts=[...cycles].map(x=>x.start_date).sort();
 if(starts.length<3) return null;
 const lengths=[]; for(let i=1;i<starts.length;i++){const n=daysBetween(starts[i-1],starts[i]);if(n>=15&&n<=60)lengths.push(n)}
 if(lengths.length<2) return null;
 const recent=lengths.slice(-6), avg=recent.reduce((a,b)=>a+b,0)/recent.length;
 const variance=Math.max(1,Math.round(Math.sqrt(recent.reduce((s,x)=>s+(x-avg)**2,0)/recent.length)));
 const last=parse(starts.at(-1)), center=addDays(last,Math.round(avg));
 return {start:iso(addDays(center,-variance)),end:iso(addDays(center,variance))};
}

export default function CalendarPage(){
 const now=new Date(),[cursor,setCursor]=useState(new Date(now.getFullYear(),now.getMonth(),1));
 const [selected,setSelected]=useState(null),[cycles,setCycles]=useState([]),[symptoms,setSymptoms]=useState([]),[notes,setNotes]=useState([]),[estimate,setEstimate]=useState(null),[error,setError]=useState("");
 const [symForm,setSymForm]=useState({symptom_type:"Cramps",severity:3,optional_note:""}),[noteText,setNoteText]=useState("");
 const load=async()=>{try{const[a,b,c,d]=await Promise.all([api("/cycles"),api("/symptoms"),api("/notes"),api("/estimate")]);setCycles(a);setSymptoms(b);setNotes(c);setEstimate(d);setError("")}catch(e){setError(e.message)}};
 useEffect(()=>{load()},[]);

 const first=new Date(cursor.getFullYear(),cursor.getMonth(),1), last=new Date(cursor.getFullYear(),cursor.getMonth()+1,0);
 const cells=[]; for(let i=0;i<first.getDay();i++)cells.push(null); for(let d=1;d<=last.getDate();d++)cells.push(new Date(cursor.getFullYear(),cursor.getMonth(),d));
 while(cells.length%7)cells.push(null);
 const isPeriod=(s)=>cycles.some(c=>{const end=c.end_date||c.start_date;return s>=c.start_date&&s<=end});
 const isEstimate=s=>estimate?.status==="ok"&&s>=estimate.estimated_start&&s<=estimate.estimated_end;
 const daySymptoms=s=>symptoms.filter(x=>x.date===s),dayNotes=s=>notes.filter(x=>x.date===s);
 const savePeriod=async()=>{try{await api("/cycles",{method:"POST",body:JSON.stringify({start_date:selected,end_date:selected})});await load()}catch(e){setError(e.message)}};
 const saveSym=async e=>{e.preventDefault();try{await api("/symptoms",{method:"POST",body:JSON.stringify({...symForm,date:selected})});setSymForm({symptom_type:"Cramps",severity:3,optional_note:""});await load()}catch(e){setError(e.message)}};
 const saveNote=async e=>{e.preventDefault();try{await api("/notes",{method:"POST",body:JSON.stringify({date:selected,note:noteText})});setNoteText("");await load()}catch(e){setError(e.message)}};
 const remove=async path=>{if(!confirm("Delete this entry?"))return;try{await api(path,{method:"DELETE"});await load()}catch(e){setError(e.message)}};
 const editSym=async x=>{const note=prompt("Edit symptom note:",x.optional_note||"");if(note===null)return;try{await api(`/symptoms/${x.id}`,{method:"PUT",body:JSON.stringify({...x,optional_note:note})});await load()}catch(e){setError(e.message)}};
 const editNote=async x=>{const note=prompt("Edit private note:",x.note);if(note===null||!note.trim())return;try{await api(`/notes/${x.id}`,{method:"PUT",body:JSON.stringify({date:x.date,note})});await load()}catch(e){setError(e.message)}};
 const selectedCycles=selected?cycles.filter(c=>selected>=c.start_date&&selected<=(c.end_date||c.start_date)):[];
 return <div>
  <p className="text-sm font-bold uppercase tracking-widest text-[#7A9278]">Calendar</p>
  <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="mt-2 text-4xl font-black text-[#000000]">Your timeline</h1><p className="mt-2 text-slate-500">Recorded history and a simple history-based estimate in one view.</p></div></div>
  {error&&<p className="mt-5 rounded-xl bg-[#FFF0F2] p-3 text-sm text-[#9F1239]">{error}</p>}
  <div className="mt-7 flex flex-wrap gap-4 text-xs font-semibold text-slate-600">
   <Legend color="#D9B2B0" text="Recorded period"/><Legend color="#A8B7A0" text="Estimated range"/><Legend color="#7A9278" text="Symptom / record"/><Legend color="#000000" text="Selected date"/>
  </div>
  <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
   <section className="card overflow-hidden">
    <div className="flex items-center justify-between border-b border-slate-100 p-5"><button className="rounded-xl p-2 hover:bg-slate-100" onClick={()=>setCursor(new Date(cursor.getFullYear(),cursor.getMonth()-1,1))}><ChevronLeft/></button><div className="text-center"><h2 className="text-xl font-black text-[#000000]">{cursor.toLocaleString("en",{month:"long",year:"numeric"})}</h2><button onClick={()=>setCursor(new Date(now.getFullYear(),now.getMonth(),1))} className="mt-1 text-xs font-bold text-[#7A9278]">Current month</button></div><button className="rounded-xl p-2 hover:bg-slate-100" onClick={()=>setCursor(new Date(cursor.getFullYear(),cursor.getMonth()+1,1))}><ChevronRight/></button></div>
    <div className="grid grid-cols-7 bg-[#F7F2E8] py-3 text-center text-xs font-bold text-slate-500">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(x=><div key={x}>{x}</div>)}</div>
    <div className="grid grid-cols-7">{cells.map((d,i)=>{if(!d)return <div key={i} className="min-h-24 border-b border-r border-slate-100 bg-slate-50/40"/>;const s=iso(d),period=isPeriod(s),est=isEstimate(s),has=symptoms.some(x=>x.date===s)||notes.some(x=>x.date===s),sel=selected===s;return <button key={s} onClick={()=>setSelected(s)} className={`relative min-h-24 border-b border-r border-slate-100 p-2 text-left hover:bg-slate-50 ${est&&!period?"bg-[#A8B7A0]/25":""} ${period?"bg-[#D9B2B0]/20":""} ${sel?"ring-2 ring-inset ring-[#000000]":""}`}><span className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${sel?"bg-[#000000] text-white":period?"bg-[#D9B2B0] text-white":"text-slate-700"}`}>{d.getDate()}</span>{has&&<span className="absolute bottom-2 left-2 h-2.5 w-2.5 rounded-full bg-[#7A9278]"/>}</button>})}</div>
   </section>
   <aside className="card h-fit p-5 xl:sticky xl:top-6">
    {!selected?<div className="py-12 text-center text-sm text-slate-500">Select a date to view or add entries.</div>:<>
     <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-[#7A9278]">Selected date</p><h3 className="mt-1 text-xl font-black text-[#000000]">{parse(selected).toLocaleDateString("en",{day:"numeric",month:"long",year:"numeric"})}</h3></div><button onClick={()=>setSelected(null)}><X size={18}/></button></div>
     <div className="mt-5 rounded-xl bg-[#F7F2E8] p-4 text-sm"><b>Period status:</b> {selectedCycles.length?"Recorded period day":isEstimate(selected)?"Inside estimated future range":"No period recorded"}</div>
     {!selectedCycles.length&&<button onClick={savePeriod} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#D9B2B0] px-4 py-2.5 text-sm font-bold text-white"><Plus size={16}/>Mark as period day</button>}
     <Panel title="Symptoms">{daySymptoms(selected).map(x=><Item key={x.id} main={`${x.symptom_type} · ${x.severity}/5`} sub={x.optional_note} edit={()=>editSym(x)} del={()=>remove(`/symptoms/${x.id}`)}/>)}
      <form onSubmit={saveSym} className="mt-3 space-y-2"><select className="w-full rounded-lg border p-2 text-sm" value={symForm.symptom_type} onChange={e=>setSymForm({...symForm,symptom_type:e.target.value})}>{SYMPTOMS.map(x=><option key={x}>{x}</option>)}</select><select className="w-full rounded-lg border p-2 text-sm" value={symForm.severity} onChange={e=>setSymForm({...symForm,severity:Number(e.target.value)})}>{["Very Mild","Mild","Moderate","Strong","Severe"].map((x,i)=><option value={i+1} key={x}>{i+1} — {x}</option>)}</select><input className="w-full rounded-lg border p-2 text-sm" placeholder="Optional note" value={symForm.optional_note} onChange={e=>setSymForm({...symForm,optional_note:e.target.value})}/><button className="text-sm font-bold text-[#7A9278]">+ Add symptom</button></form>
     </Panel>
     <Panel title="Journal notes">{dayNotes(selected).map(x=><Item key={x.id} main={x.note} edit={()=>editNote(x)} del={()=>remove(`/notes/${x.id}`)}/>)}
      <form onSubmit={saveNote} className="mt-3"><textarea required className="w-full rounded-lg border p-2 text-sm" rows="3" placeholder="Private note" value={noteText} onChange={e=>setNoteText(e.target.value)}/><button className="mt-1 text-sm font-bold text-[#000000]">+ Save note</button></form>
     </Panel>
    </>}
   </aside>
  </div>
  <p className="mt-5 max-w-3xl text-xs leading-5 text-slate-500">{estimate?.status==="ok"?`Lavender dates use recent recorded cycle lengths to show an approximate range (${estimate.estimated_start} to ${estimate.estimated_end}). It is not a medical or fertility prediction.`:"More cycle history is needed before an estimated range can be shown."}</p>
 </div>
}
function Legend({color,text}){return <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-full" style={{background:color}}/>{text}</span>}
function Panel({title,children}){return <div className="mt-5 border-t border-slate-100 pt-4"><h4 className="font-bold text-[#000000]">{title}</h4>{children}</div>}
function Item({main,sub,edit,del}){return <div className="mt-2 rounded-xl bg-slate-50 p-3 text-sm"><div className="flex justify-between gap-2"><span className="font-semibold">{main}</span><span className="flex gap-2"><button onClick={edit} title="Edit"><Pencil size={14}/></button><button onClick={del} title="Delete" className="text-[#9F1239]"><Trash2 size={14}/></button></span></div>{sub&&<p className="mt-1 text-xs text-slate-500">{sub}</p>}</div>}
