const days=Array.from({length:35},(_,i)=>i<3?'':i-2)
export default function MiniCalendar(){
 return <div className="card p-5">
  <div className="flex justify-between"><h3 className="font-bold text-[#000000]">October 2026</h3><span className="text-xs text-slate-400">Preview</span></div>
  <div className="mt-5 grid grid-cols-7 text-center text-xs text-slate-400">{['S','M','T','W','T','F','S'].map((d,i)=><span key={i}>{d}</span>)}</div>
  <div className="mt-3 grid grid-cols-7 gap-1 text-center text-sm">{days.map((d,i)=><span key={i} className={`grid aspect-square place-items-center rounded-lg ${d===7?'bg-[#000000] font-bold text-white':'text-slate-600'}`}>{d}</span>)}</div>
 </div>
}
