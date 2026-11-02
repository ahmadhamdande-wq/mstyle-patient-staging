import {getChatGPTUser} from '../../../chatgpt-auth';
import {database} from '../../../../db/raw';
import {digest,token,SESSION_SECONDS} from '../../../../lib/session-crypto';
import {json,sameOrigin,limited,passwordError,passwordValues,verifiesPassword,audit,sessionCookie,noStore} from '../../../../lib/account-security';
export async function POST(req:Request){
 if(!sameOrigin(req))return json({error:'Invalid origin.'},403);const u=await getChatGPTUser();if(!u)return json({error:'Sign in required.'},401);const db=database(),b:any=await req.json().catch(()=>null);
 if(await limited(db,req,'password-change',u.staffId))return json({error:'Too many attempts. Try again in 15 minutes.'},429);
 const row=await db.prepare('SELECT * FROM clinic_staff WHERE id=? AND owner=? AND active=1').bind(u.staffId,u.userId).first<any>();
 if(!row||!await verifiesPassword(row,b?.currentPassword))return json({error:'The current password is incorrect.'},401);
 const error=passwordError(b?.password);if(error)return json({error},400);if(b.password===b.currentPassword)return json({error:'Choose a different password.'},400);
 const {salt,hash}=await passwordValues(b.password),raw=token(),version=Number(row.auth_version)+1;
 const result=await db.batch([
 db.prepare('UPDATE clinic_staff SET password_hash=?,salt=?,must_change_password=0,auth_version=auth_version+1 WHERE id=? AND auth_version=?').bind(hash,salt,row.id,row.auth_version),
 db.prepare('DELETE FROM clinic_sessions WHERE staff_id=? AND EXISTS(SELECT 1 FROM clinic_staff WHERE id=? AND password_hash=?)').bind(row.id,row.id,hash),
 db.prepare('INSERT INTO clinic_sessions(token_hash,staff_id,expires,auth_version) SELECT ?,id,?,auth_version FROM clinic_staff WHERE id=? AND auth_version=? AND password_hash=? AND active=1').bind(await digest(raw),Date.now()+SESSION_SECONDS*1000,row.id,version,hash),
 audit(db,u.staffId,u.userId,'password-change-attempt')]);
 if(!result[0].meta.changes||!result[2].meta.changes)return json({error:'The account changed during this request. Sign in again.'},409);
 return Response.json({ok:true},{headers:{...noStore,'Set-Cookie':sessionCookie(raw)}});
}
