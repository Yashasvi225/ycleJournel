import { useEffect,useMemo,useState } from "react";
import { api } from "../api";
import { LineChart,Line,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid } from "recharts";
import { CalendarDays,Clock3,ArrowDownUp,Layers3 } from "lucide-react";

const parse=s=>{const[y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)};
const diff=(a,b)=>Math.round((parse(b)-parse(a))/86400000);
const avg=a=>a.length?Math.round((a.reduce((x,y)=>x+y,0)/a.length)*10)/10:null;

export default function History(){
 const [cycles,setCycles]=useState([]),[symptoms,setSymptoms]=useState([]),[error,setError]=useState("");
 useEffect(()=>{Promise.all([api("/cycles"),api("/symptoms")]).then(([a,b])=>{setCycles(a);setSymptoms(b)}).catch(e=>setError(e.message))},[]);
 const data=useMemo(()=>{
  const ordered=[...cycles].sort((a,b)=>a.start_date.localeCompare(b.start_date));
  return ordered.map((c,i)=>{const next=ordered[i+1];return {...c,periodDuration:c.end_date?diff(c.start_date,c.end_date)+1:null,cycleLength:next?diff(c.start_date,next.start_date):null,symptoms:symptoms.filter(s=>s.date>=c.start_date&&(!next||s.date<next.start_date))}})
 },[cycles,symptoms]);
 const completed=data.filter(x=>x.end_date), lengths=data.map(x=>x.cycleLength).filter(x=>x&&x>=15&&x<=60),durations=completed.map(x=>x.periodDuration).filter(Boolean);
 const chart=data.filter(x=>x.cycleLength).map((x,i)=>({name:`Cycle ${i+1}`,days:x.cycleLength,date:x.start_date}));
 const enough=lengths.length>=2;
 return <div className="journal-page history-page">
  <p className="journal-eyebrow text-sm font-bold uppercase tracking-widest text-[#7A9278]">History</p><h1 className="mt-2 text-4xl font-black text-[#000000]">Cycle history</h1><p className="mt-2 text-slate-500">Statistics are descriptive summaries of your own records, not medical interpretations.</p>
  {error&&<p className="journal-message journal-message-error mt-5 rounded-xl bg-[#FFF0F2] p-3 text-sm text-[#9F1239]">{error}</p>}
  <div className="history-stats mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
   <Stat icon={CalendarDays} label="Average cycle" value={enough?`${avg(lengths)} days`:"—"}/><Stat icon={ArrowDownUp} label="Shortest cycle" value={enough?`${Math.min(...lengths)} days`:"—"}/><Stat icon={ArrowDownUp} label="Longest cycle" value={enough?`${Math.max(...lengths)} days`:"—"}/><Stat icon={Clock3} label="Avg. period duration" value={durations.length?`${avg(durations)} days`:"—"}/><Stat icon={Layers3} label="Recorded cycles" value={cycles.length}/>
  </div>
  {!enough&&<div className="history-insufficient mt-5 rounded-2xl bg-[#F2EEFF] p-4 text-sm font-semibold text-[#000000]">More cycle history is needed to calculate this insight.</div>}
  <section className="history-chart-card card mt-6 p-6"><h2 className="text-xl font-black text-[#000000]">Cycle-length trend</h2><p className="mt-1 text-sm text-slate-500">Days between consecutive recorded cycle starts.</p>
   <div className="history-chart mt-5 h-72">{chart.length?<ResponsiveContainer width="100%" height="100%"><LineChart data={chart} margin={{top:10,right:20,left:-15,bottom:5}}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/><XAxis dataKey="name" tick={{fontSize:12,fill:"var(--text-muted)"}} tickLine={false} axisLine={false}/><YAxis domain={["dataMin - 2","dataMax + 2"]} tick={{fontSize:12,fill:"var(--text-muted)"}} tickLine={false} axisLine={false}/><Tooltip formatter={v=>[`${v} days`,"Cycle length"]} contentStyle={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,color:"var(--text)",boxShadow:"var(--shadow)"}} labelStyle={{color:"var(--text)",fontWeight:600}} cursor={{stroke:"#d9cefa"}}/><Line type="monotone" dataKey="days" stroke="#9c86ca" strokeWidth={3} dot={{r:5,fill:"#f5a9c0",stroke:"var(--surface)",strokeWidth:2}} activeDot={{r:7,fill:"#bd4c74",stroke:"var(--surface)",strokeWidth:2}}/></LineChart></ResponsiveContainer>:<div className="grid h-full place-items-center text-sm text-slate-500">More cycle history is needed to calculate this insight.</div>}</div>
  </section>
  <section className="history-records mt-6 space-y-4"><h2 className="text-xl font-black text-[#000000]">Recorded cycles</h2>{data.length?[...data].reverse().map((c,i)=><article key={c.id} className="history-record card p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="history-record-eyebrow text-xs font-bold uppercase tracking-widest text-[#7A9278]">Cycle</p><h3 className="mt-1 text-lg font-black text-[#000000]">{c.start_date} {c.end_date?`→ ${c.end_date}`:"→ End date not recorded"}</h3></div><span className="history-period-badge rounded-full bg-[#FFF0F2] px-3 py-1 text-xs font-bold text-[#9F1239]">{c.periodDuration?`${c.periodDuration} period days`:"Incomplete"}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><Detail label="Cycle length" value={c.cycleLength?`${c.cycleLength} days`:"Needs next cycle"}/><Detail label="Period duration" value={c.periodDuration?`${c.periodDuration} days`:"Not complete"}/><Detail label="Symptoms" value={c.symptoms.length?c.symptoms.map(s=>s.symptom_type).join(", "):"None recorded"}/></div></article>):<div className="history-empty card p-8 text-center text-slate-500">No cycle records yet. Add your first period entry to begin your history.</div>}</section>
 </div>
}
function Stat({icon:Icon,label,value}){return <div className="history-stat card p-5"><span className="history-stat-icon inline-flex rounded-xl bg-[#E8F7F4] p-2.5 text-[#7A9278]"><Icon size={18}/></span><p className="mt-3 text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-xl font-black text-[#000000]">{value}</p></div>}
function Detail({label,value}){return <div className="history-detail rounded-xl bg-[#F7F2E8] p-3"><p className="text-xs font-bold text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold text-slate-700">{value}</p></div>}
