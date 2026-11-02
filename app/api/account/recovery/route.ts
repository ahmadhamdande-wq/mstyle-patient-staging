import {getChatGPTUser} from '../../../chatgpt-auth';
import {database} from '../../../../db/raw';
import {token,digest} from '../../../../lib/session-crypto';
import {json,sameOrigin,limited,verifiesPassword,audit} from '../../../../lib/account-security';
export async function POST(req:Request){
 if(!sameOrigin(req))return json({error:'Invalid origin.'},403);const u=await getChatGPTUser();if(!u)return json({error:'Sign in required.'},401);if(!u.isOwner)return json({error:'Recovery codes are for the clinic owner. Staff can ask an administrator for a reset.'},403);
 const db=database(),b:any=await req.json().catch(()=>null);if(await limited(db,req,'recovery-generate',u.staffId,5))return json({error:'Too many attempts. Try again in 15 minutes.'},429);
 const row=await db.prepare('SELECT * FROM clinic_staff WHERE id=? AND active=1 AND is_owner=1').bind(u.staffId).first<any>();if(!row||!await verifiesPassword(row,b?.currentPassword))return json({error:'Enter your current password to generate recovery codes.'},401);
 const codes=Array.from({length:8},()=>token().slice(0,32).toUpperCase().match(/.{4}/g)!.join('-'));
 const ops:D1PreparedStatement[]=[db.prepare('DELETE FROM clinic_recovery_codes WHERE staff_id=?').bind(u.staffId)];
 for(const code of codes)ops.push(db.prepare('INSERT INTO clinic_recovery_codes(id,staff_id,code_hash,created) VALUES(?,?,?,?)').bind(crypto.randomUUID(),u.staffId,await digest('mstyle-recovery:'+code.replaceAll('-','').toLowerCase()),new Date().toISOString()));
 ops.push(audit(db,u.staffId,u.userId,'recovery-codes-generated'));await db.batch(ops);return json({codes});
}
