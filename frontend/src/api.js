const API = "http://127.0.0.1:5000/api";

export const getToken = () => localStorage.getItem("cj_token");
export const setSession = (token,user) => { localStorage.setItem("cj_token",token); localStorage.setItem("cj_user",JSON.stringify(user)); };
export const clearSession = () => { localStorage.removeItem("cj_token"); localStorage.removeItem("cj_user"); };

export async function api(path, options={}) {
  const headers = {"Content-Type":"application/json", ...(options.headers||{})};
  const token=getToken(); if(token) headers.Authorization=`Bearer ${token}`;
  const res=await fetch(`${API}${path}`,{...options,headers});
  const data=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

export function getPrivacySummary() {
  return api("/privacy/summary");
}

export function deleteCycleHistory() {
  return api("/privacy/cycles", {
    method: "DELETE"
  });
}

export function deleteSymptomHistory() {
  return api("/privacy/symptoms", {
    method: "DELETE"
  });
}

export function deleteJournalHistory() {
  return api("/privacy/notes", {
    method: "DELETE"
  });
}

export function deleteAllData() {
  return api("/privacy/all-data", {
    method: "DELETE"
  });
}

export function deleteAccount() {
  return api("/privacy/account", {
    method: "DELETE"
  });
}
export function getSettings() {
  return api("/settings");
}

export function updateSettings(data) {
  return api("/settings", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}