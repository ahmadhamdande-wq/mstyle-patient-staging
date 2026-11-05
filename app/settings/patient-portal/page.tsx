'use client';
import {useEffect,useState} from 'react';
export default function PortalAccess(){
 const [patientId,setPatientId]=useState('');
 const [details,setDetails]=useState<any>(null);
 const [password,setPassword]=useState('');
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 useEffect(()=>{setPatientId(new URLSearchParams(window.location.search).get('patientId')||'');},[]);
 useEffect(()=>{if(!patientId)return;fetch('/api/portal/enrollment?patientId='+encodeURIComponent(patientId),{cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||'Unable to load');setDetails(d);}).catch(e=>setMessage(e.message));},[patientId]);
 async function invite(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage('');try{
  const r=await fetch('/api/portal/enrollment?patientId='+encodeURIComponent(patientId),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({administratorPassword:password})});
  const d=await r.json();if(!r.ok)throw Error(d.error||'Unable to send invitation');setMessage(d.message);setPassword('');
 }catch(e){setMessage((e as Error).message)}finally{setBusy(false)}}
 return <main style={{maxWidth:650,margin:'48px auto',padding:24,fontFamily:'system-ui'}}>
 <a href="/">← Patient list</a><h1>Patient Portal Access</h1>
 <p>Clinic administrator registration and invitation. Only approved patient results are released to the portal.</p>
 {!patientId?<p>Open this page with a patientId query parameter from the selected patient file.</p>:details?<section style={{border:'1px solid #ccd',borderRadius:12,padding:20}}>
 <p><strong>Patient:</strong> {details.patientName}</p>
 <p><strong>Contact email:</strong> {details.contactEmail||'Not recorded'}</p>
 <p><strong>Portal:</strong> {details.registered?(details.active?'Registered':'Disabled'):'Not registered'} {details.verified?'· Verified':''}</p>
 <form onSubmit={invite}><label>Confirm with your administrator password<input style={{display:'block',width:'100%',padding:10,margin:'10px 0'}} type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"/></label>
 <button type="submit" disabled={busy||!details.contactEmail} style={{padding:12}}>{busy?'Sending…':details.registered?'Resend invitation':'Register and send invitation'}</button></form>
 </section>:<p>Loading patient portal status…</p>}
 {message&&<p role="status">{message}</p>}
 </main>;
}
