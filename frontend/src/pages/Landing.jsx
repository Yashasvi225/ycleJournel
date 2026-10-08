import { Link } from 'react-router-dom'
import { ArrowRight, CalendarRange, Eye, ShieldCheck, NotebookPen, DatabaseZap } from 'lucide-react'
import Logo from '../components/Logo'

const features=[
 [CalendarRange,'Range-based estimates','Estimated windows instead of false-precision single dates.','#F2EEFF'],
 [Eye,'Explainable predictions','Understand what history an estimate is based on.','#E8F7F4'],
 [ShieldCheck,'Privacy by design','Clear controls and minimal collection of personal information.','#FFF0F2'],
 [NotebookPen,'Symptom journaling','Keep cycle dates, symptoms and notes together.','#F7F2E8'],
 [DatabaseZap,'User-controlled data','Export and deletion controls are part of the product plan.','#EEF2FF']
]
export default function Landing(){
 return <div className="min-h-screen bg-[#FFFFF8]">
  <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6"><Logo/><div className="flex gap-2"><Link to="/login" className="rounded-xl px-4 py-2 text-sm font-semibold text-[#000000]">Log in</Link><Link to="/register" className="rounded-xl bg-[#000000] px-4 py-2 text-sm font-semibold text-white">Create account</Link></div></nav>
  <section className="soft-grid mx-auto max-w-7xl rounded-[2.5rem] px-6 py-20 md:px-14 md:py-28"><div className="max-w-3xl">
   <span className="rounded-full bg-[#E8F7F4] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#7A9278]">Private • Transparent • Personal</span>
   <h1 className="mt-7 text-5xl font-black leading-[1.05] tracking-tight text-[#000000] md:text-7xl">Understand your cycle <span className="text-[#7A9278]">without pretending</span> it is perfectly predictable.</h1>
   <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">Record dates, symptoms and private notes in one calm journal with transparent, range-based estimates.</p>
   <div className="mt-9 flex gap-3"><Link to="/register" className="flex items-center gap-2 rounded-2xl bg-[#000000] px-6 py-3.5 font-bold text-white">Start journaling <ArrowRight size={18}/></Link><Link to="/dashboard" className="rounded-2xl border bg-white px-6 py-3.5 font-bold text-[#000000]">UI preview</Link></div>
  </div></section>
  <section className="mx-auto max-w-7xl px-6 py-20"><h2 className="text-3xl font-black text-[#000000]">A journal first. An estimate second.</h2><div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{features.map(([Icon,title,text,bg])=><article key={title} className="card p-6"><span className="inline-flex rounded-xl p-3 text-[#000000]" style={{background:bg}}><Icon/></span><h3 className="mt-5 text-lg font-bold text-[#000000]">{title}</h3><p className="mt-2 leading-7 text-slate-600">{text}</p></article>)}</div></section>
  <footer className="border-t px-6 py-8 text-center text-sm text-slate-500">CycleJournal provides estimates based on recorded history and does not provide medical diagnosis or fertility guarantees.</footer>
 </div>
}
