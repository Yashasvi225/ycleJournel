const days=Array.from({length:35},(_,i)=>i<3?'':i-2)
export default function MiniCalendar(){
 return <div className="mini-calendar card p-5">
  <div className="mini-calendar-heading flex justify-between"><h3 className="font-bold text-[#000000]">October 2026</h3><span className="text-xs text-slate-400">Preview</span></div>
  <div className="mini-calendar-weekdays mt-5 grid grid-cols-7 text-center text-xs text-slate-400">{['S','M','T','W','T','F','S'].map((d,i)=><span key={i}>{d}</span>)}</div>
  <div className="mini-calendar-days mt-3 grid grid-cols-7 gap-1 text-center text-sm">{days.map((d,i)=><span key={i} className={`mini-calendar-day grid aspect-square place-items-center rounded-lg ${d===7?'mini-calendar-highlight bg-[#000000] font-bold text-white':'text-slate-600'}`}>{d}</span>)}</div>
 </div>
}
