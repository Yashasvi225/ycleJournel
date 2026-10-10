import { Link,useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { AuthWrap,Field } from './Login'
import { api,setSession } from '../api'
export default function Register(){
 const nav=useNavigate(); const [form,setForm]=useState({name:"",email:"",password:""}); const [msg,setMsg]=useState("");
 const change=e=>setForm({...form,[e.target.name]:e.target.value});
 const submit=async e=>{e.preventDefault();setMsg("");try{const d=await api("/auth/register",{method:"POST",body:JSON.stringify(form)});setSession(d.token,d.user);nav("/dashboard")}catch(e){setMsg(e.message)}}
 return <AuthWrap title="Create your journal" subtitle="Start with a private space for your cycle history."><form onSubmit={submit} className="auth-form space-y-4">{msg&&<p className="auth-error rounded-xl bg-[#FFF0F2] p-3 text-sm text-[#9F1239]">{msg}</p>}<Field name="name" label="Name" value={form.name} onChange={change}/><Field name="email" label="Email" type="email" value={form.email} onChange={change}/><Field name="password" label="Password" type="password" value={form.password} onChange={change}/><p className="text-xs text-slate-500">Use at least 8 characters.</p><button className="auth-submit auth-submit-register w-full rounded-xl bg-[#7A9278] py-3 font-bold text-white">Create account</button><p className="text-center text-sm text-slate-500">Already registered? <Link to="/login" className="font-bold text-[#7A9278]">Log in</Link></p></form></AuthWrap>
}
