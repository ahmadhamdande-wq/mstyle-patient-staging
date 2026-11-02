import {database} from '../../../../db/raw';
import {digest} from '../../../../lib/session-crypto';
import {json,sameOrigin,limited,passwordError,passwordValues} from '../../../../lib/account-security';
export async function POST(req:Request){
 if(!sameOrigin(req))return json({error:'Invalid origin.'},403);const b:any=await req.json().catch(()=>null),db=database();const username=typeof b?.username==='string'?b.username.trim().toLowerCase().slice(0,150):'';
 if(await limited(db,req,'recovery-use',username))return json({error:'Too many attempts. Try again in 15 minutes.'},429);
 const error=passwordError(b?.password);if(error)return json({error},400);
 const code=typeof b?.code==='string'?b.code.replace(/[-\s]/g,'').toLowerCase():'';if(!/^[a-f0-9]{32}$/.test(code))return json({error:'The username or recovery code is invalid, expired or already used.'},400);
 const codeHash=await digest('mstyle-recovery:'+code),row=await db.prepare('SELECT s.id,s.owner,s.auth_version,r.id AS code_id FROM clinic_staff s JOIN clinic_recovery_codes r ON s.id=r.staff_id WHERE s.username=? AND s.is_owner=1 AND s.active=1 AND r.code_hash=? AND r.used_at IS NULL').bind(username,codeHash).first<any>();
 if(!row)return json({error:'The username or recovery code is invalid, expired or already used.'},400);
 const {salt,hash}=await passwordValues(b.password),at=new Date().toISOString();
 const result=await db.batch([
 db.prepare('UPDATE clinic_staff SET password_hash=?,salt=?,must_change_password=0,auth_version=auth_version+1 WHERE id=? AND active=1 AND is_owner=1 AND auth_version=? AND EXISTS(SELECT 1 FROM clinic_recovery_codes WHERE id=? AND staff_id=? AND used_at IS NULL)').bind(hash,salt,row.id,row.auth_version,row.code_id,row.id),
 db.prepare('UPDATE clinic_recovery_codes SET used_at=? WHERE id=? AND used_at IS NULL AND EXISTS(SELECT 1 FROM clinic_staff WHERE id=? AND password_hash=?)').bind(at,row.code_id,row.id,hash),
 db.prepare('DELETE FROM clinic_sessions WHERE staff_id=? AND EXISTS(SELECT 1 FROM clinic_staff WHERE id=? AND password_hash=?)').bind(row.id,row.id,hash),
 db.prepare('INSERT INTO clinic_audit(id,staff_id,owner,action,created) SELECT ?,id,owner,?,? FROM clinic_staff WHERE id=? AND password_hash=?').bind(crypto.randomUUID(),'owner-password-recovered',at,row.id,hash)]);
 if(!result[0].meta.changes)return json({error:'The code was used or the account changed. Try another unused recovery code.'},409);
 return json({ok:true});
}
