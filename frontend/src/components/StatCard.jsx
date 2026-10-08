export default function StatCard({icon:Icon,label,value,helper,tone='navy'}) {
 const tones={navy:'bg-[#000000] text-white',teal:'bg-[#7A9278] text-white',lav:'bg-[#F2EEFF] text-[#000000]',coral:'bg-[#FFF0F2] text-[#9F1239]'}
 return <article className="card p-5">
  <div className={`inline-flex rounded-xl p-2.5 ${tones[tone]}`}><Icon size={19}/></div>
  <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
  <p className="mt-1 text-2xl font-bold text-[#000000]">{value}</p>
  <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p>
 </article>
}
