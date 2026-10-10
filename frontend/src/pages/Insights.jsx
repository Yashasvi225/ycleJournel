import { useEffect,useState } from "react";
import { api } from "../api";
import EstimateCard from "../components/EstimateCard";
export default function Insights(){
 const[e,setE]=useState(null),[err,setErr]=useState("");
 useEffect(()=>{api("/estimate").then(setE).catch(x=>setErr(x.message))},[]);
 return <div className="journal-page insights-page"><p className="journal-eyebrow text-sm font-bold uppercase tracking-widest text-[#7A9278]">Insights</p><h1 className="mt-2 text-4xl font-black text-black">Uncertainty-aware estimate</h1><p className="mt-2 max-w-2xl text-black/55">A transparent summary of your recorded history. CycleJournal intentionally uses a range instead of pretending one future date is certain.</p>{err&&<p className="journal-message journal-message-error mt-5 text-sm text-red-800">{err}</p>}<div className="insights-estimate mt-8 max-w-4xl"><EstimateCard estimate={e}/></div>{e?.status==="ok"&&<section className="insights-range-info mt-6 max-w-4xl rounded-3xl bg-[#E7EBDD] p-6"><h2 className="text-xl font-black text-black">How the range is formed</h2><p className="mt-2 text-sm leading-6 text-black/65">Cycle length is the number of days between consecutive recorded period start dates. CycleJournal uses recent valid lengths, calculates their average, median and variability, then widens or narrows the future window according to that variability. More variation means a wider range.</p></section>}</div>
}
