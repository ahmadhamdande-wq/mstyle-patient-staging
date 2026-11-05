import {emailAddress} from '../../../../lib/email-access';
import {getChatGPTUser} from '../../../chatgpt-auth';
import {database} from '../../../../db/raw';
import {json,sameOrigin,administrator,passwordError,passwordValues,audit} from '../../../../lib/account-security';
export async function PATCH(req:Request,{params}:any){
 if(!sameOrigin(req))return json({error:'Invalid origin.'},403);const u=await getChatGPTUser();if(!u)return json({error:'Sign in required.'},401);
 const b:any=await req.json().catch(()=>null),db=database(),denied=await administrator(db,u,req,b);if(denied)return denied;
 const {id}=await params,row=await db.prepare('SELECT * FROM clinic_staff WHERE id=? AND owner=?').bind(id,u.userId).first<any>();if(!row)return json({error:'User not found.'},404);
 if(b.action==='identity'){if(!u.isOwner)return json({error:'Only the owner may register recovery emails or change usernames.'},403);const username=String(b.username||'').trim().toLowerCase(),email=String(b.recoveryEmail||'').trim().toLowerCase();if(!/^[a-z0-9][a-z0-9._@+-]{2,149}$/.test(username)||email&&!emailAddress(email))return json({error:'Enter a valid username and recovery email.'},400);const taken=await db.prepare('SELECT id FROM clinic_staff WHERE username=? AND id<>?').bind(username,id).first();if(taken)return json({error:'Username already in use. Choose another.'},409);if(email&&await db.prepare('SELECT id FROM clinic_staff WHERE recovery_email=? AND id<>?').bind(email,id).first())return json({error:'Recovery email already belongs to another staff account.'},409);await db.batch([db.prepare('UPDATE clinic_staff SET username=?,recovery_email=?,auth_version=auth_version+1 WHERE id=? AND owner=?').bind(username,email,id,u.userId),db.prepare('DELETE FROM clinic_sessions WHERE staff_id=?').bind(id),audit(db,u.staffId,u.userId,'staff-identity:'+id)]);return json({ok:true});}
 if(row.is_owner||row.id===u.staffId)return json({error:'Use My password for your own password. Your owner/administrator access cannot be removed here.'},403);
 if(row.role==='admin'&&!u.isOwner)return json({error:'Only the clinic owner may change administrator accounts.'},403);
 const ops:D1PreparedStatement[]=[];
 if(b.action==='reset-password'){
 const error=passwordError(b.password);if(error)return json({error},400);const {salt,hash}=await passwordValues(b.password);
 ops.push(db.prepare('UPDATE clinic_staff SET password_hash=?,salt=?,must_change_password=1,auth_version=auth_version+1 WHERE id=? AND owner=?').bind(hash,salt,id,u.userId));
 }else if(b.action==='sign-out'){
 ops.push(db.prepare('UPDATE clinic_staff SET auth_version=auth_version+1 WHERE id=? AND owner=?').bind(id,u.userId));
 }else if(b.action==='update'){
 if(!['doctor','nurse','reception','hormone_lab','embryology_lab',...(u.isOwner?['admin']:[])].includes(b.role)||typeof b.active!=='boolean'||typeof b.displayName!=='string'||!b.displayName.trim()||b.displayName.length>150)return json({error:'Enter a name, role and account status.'},400);
 const department=b.role==='hormone_lab'?'hormonal':b.role==='embryology_lab'?'embryology':'';
 const access=department?'none':b.role==='reception'?'none':b.role==='admin'?'write':b.clinicalAccess;if(!['none','read','write'].includes(access))return json({error:'Choose clinical access.'},400);
 ops.push(db.prepare('UPDATE clinic_staff SET display_name=?,role=?,active=?,clinical_access=?,can_export=?,lab_department=?,auth_version=auth_version+1 WHERE id=? AND owner=?').bind(b.displayName.trim(),department?'nurse':b.role,b.active?1:0,access,b.canExport===true&&access!=='none'?1:0,department,id,u.userId));
 }else return json({error:'Unknown action.'},400);
 ops.push(db.prepare('DELETE FROM clinic_sessions WHERE staff_id=?').bind(id),audit(db,u.staffId,u.userId,'staff-'+b.action+':'+id));await db.batch(ops);return json({ok:true});
}
