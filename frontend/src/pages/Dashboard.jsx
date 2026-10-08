import { useEffect,useState } from "react";
import { api } from "../api";
import EstimateCard from "../components/EstimateCard";
import MiniCalendar from "../components/MiniCalendar";
export default function Dashboard(){
 const[e,setE]=useState(null),[cycles,setCycles]=useState([]),[symptoms,setSymptoms]=useState([]);
 useEffect(()=>{Promise.all([api("/estimate"),api("/cycles"),api("/symptoms")]).then(([a,b,c])=>{setE(a);setCycles(b);setSymptoms(c)}).catch(()=>{})},[]);
 return <div><p className="text-sm font-bold uppercase tracking-widest text-[#7A9278]">Dashboard</p><h1 className="mt-2 text-4xl font-black text-black">Your cycle, with context.</h1><p className="mt-2 text-black/55">Personal history presented as a range—not a promise.</p>
 <div className="mt-8 grid gap-5 xl:grid-cols-[1.4fr_.6fr]"><EstimateCard estimate={e}/><div className="rounded-3xl bg-[#E7EBDD] p-6"><p className="text-xs font-bold uppercase tracking-widest text-black/50">History snapshot</p><p className="mt-5 text-4xl font-black text-black">{cycles.length}</p><p className="text-sm text-black/55">recorded cycles</p><p className="mt-6 text-4xl font-black text-black">{symptoms.length}</p><p className="text-sm text-black/55">symptom records</p></div></div>
 <div className="mt-5 rounded-3xl bg-[#FFFFF8] p-6 shadow-sm"><h2 className="text-xl font-black text-black">Calendar preview</h2><div className="mt-4"><MiniCalendar/></div></div></div>
}
