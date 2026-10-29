import {digest} from './session-crypto';
import type {ChatGPTUser} from '../app/chatgpt-auth';
export async function sessionUser(cookie:string,db:D1Database):Promise<ChatGPTUser|null>{
 const raw=cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('__Host-mstyle='))?.slice(14);
 if(!raw||!/^[a-f0-9]{64}$/.test(raw))return null;
 const row=await db.prepare(`SELECT s.id,s.owner,s.username,s.role FROM clinic_sessions c JOIN clinic_staff s ON s.id=c.staff_id WHERE c.token_hash=? AND c.expires>? AND s.active=1`).bind(await digest(raw),Date.now()).first<any>();
 if(!row)return null;return {userId:row.owner,staffId:row.id,role:row.role,displayName:row.username,email:row.username,fullName:row.username};
}
