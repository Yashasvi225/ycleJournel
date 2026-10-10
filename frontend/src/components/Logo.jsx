import { MoonStar } from 'lucide-react'
export default function Logo({light=false}) {
 return <div className={`cj-logo ${light?"cj-logo-light":""} flex items-center gap-2 text-xl font-bold tracking-tight`}>
  <span className={`cj-logo-icon grid h-9 w-9 place-items-center rounded-xl ${light?'bg-white/10 text-white':'bg-[#000000] text-white'}`}><MoonStar size={19}/></span>
  <span className={`cj-logo-text ${light?'text-white':'text-[#000000]'}`}>CycleJournal</span>
 </div>
}
