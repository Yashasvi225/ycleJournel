import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Logo from '../components/Logo'
import { api,setSession } from '../api'
export function Field({label,type='text',value,onChange,name}){return <label className="block text-sm font-semibold text-slate-700">{label}<input required name={name} value={value} onChange={onChange} type={type} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#7A9278]"/></label>}
export function AuthWrap({title,subtitle,children}){return <div className="grid min-h-screen lg:grid-cols-2"><div className="hidden flex-col justify-between bg-[#000000] p-12 text-white lg:flex"><Logo light/><p className="text-5xl font-black leading-tight">Your cycle.<br/>Your context.<br/><span className="text-[#A8B7A0]">Your control.</span></p><p className="text-sm text-slate-300">Health journaling without false certainty.</p></div><div className="flex items-center justify-center bg-[#FFFFF8] p-6"><div className="w-full max-w-md"><div className="mb-10 lg:hidden"><Logo/></div><h1 className="text-3xl font-black text-[#000000]">{title}</h1><p className="mb-8 mt-2 text-slate-500">{subtitle}</p>{children}</div></div></div>}
export default function Login(){
 const nav=useNavigate(); const [form,setForm]=useState({email:"",password:""}); const [msg,setMsg]=useState("");
 const change=e=>setForm({...form,[e.target.name]:e.target.value});
 const submit=async e=>{e.preventDefault();setMsg("");try{const d=await api("/auth/login",{method:"POST",body:JSON.stringify(form)});setSession(d.token,d.user);nav("/dashboard")}catch(e){setMsg(e.message)}}
 return <AuthWrap title="Welcome back" subtitle="Your private journal is waiting."><form onSubmit={submit} className="space-y-4">{msg&&<p className="rounded-xl bg-[#FFF0F2] p-3 text-sm text-[#9F1239]">{msg}</p>}<Field name="email" label="Email" type="email" value={form.email} onChange={change}/><Field name="password" label="Password" type="password" value={form.password} onChange={change}/><button className="w-full rounded-xl bg-[#000000] py-3 font-bold text-white">Log in</button><p className="text-center text-sm text-slate-500">New here? <Link to="/register" className="font-bold text-[#7A9278]">Create account</Link></p></form></AuthWrap>
}
