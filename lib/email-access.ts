import {env} from 'cloudflare:workers';
import {digest,token} from './session-crypto';
export const emailAddress=(v:any)=>typeof v==='string'&&v.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export async function accessEmail(db:D1Database,req:Request,kind:string,subject:any,email:string,version:number){
 const config=env as any;if(!config.RESEND_API_KEY||!config.EMAIL_FROM)throw Error('Email delivery is not configured. Ask the owner to use the temporary-password recovery option.');
 const raw=token(),hash=await digest(raw),expires=Date.now()+30*60000;
 const url=new URL(kind==='staff-username'?'/login':kind==='staff-password'?'/access/reset':'/portal/access',req.url);if(kind!=='staff-username')url.searchParams.set('token',raw);
 // Never return or log recovery tokens. Email contains no clinical information.
 const text=kind==='staff-username'?`Your MStyle staff username is: ${subject.username}\nSign in: ${url}`:`Use this single-use link within 30 minutes to set your MStyle password:\n${url}\nIf you did not request this, ignore this email.`;
 if(kind!=='staff-username'){await db.prepare('DELETE FROM clinic_access_tokens WHERE subject_id=? AND kind=? OR expires<?').bind(subject.id,kind,Date.now()).run();}if(kind!=='staff-username')await db.prepare('INSERT INTO clinic_access_tokens(token_hash,kind,subject_id,email,version,expires) VALUES(?,?,?,?,?,?)').bind(hash,kind,subject.id,email,version,expires).run();
 const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+config.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:config.EMAIL_FROM,to:[email],subject:'MStyle account access',text})});
 if(!response.ok){if(kind!=='staff-username')await db.prepare('DELETE FROM clinic_access_tokens WHERE token_hash=?').bind(hash).run();throw Error('Email delivery unavailable. Retry later or contact the clinic owner.');}
}
