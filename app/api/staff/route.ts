import {getChatGPTUser} from '../../chatgpt-auth';
import {database} from '../../../db/raw';
import {managesUsers} from '../../../lib/access-policy';
import {json,sameOrigin,publicStaff,administrator,passwordError,passwordValues,audit} from '../../../lib/account-security';
export async function GET(){const u=await getChatGPTUser();if(!u)return json({error:'Sign in required.'},401);if(!managesUsers(u))return json({error:'Administrator access required.'},403);const rows=await database().prepare('SELECT id,username,display_name,role,active,is_owner,clinical_access,can_export,must_change_password,lab_department,created FROM clinic_staff WHERE owner=? ORDER BY is_owner DESC,created,id').bind(u.userId).all();return json({users:rows.results.map(publicStaff),currentId:u.staffId,isOwner:!!u.isOwner});}
export async function POST(req:Request){
 if(!sameOrigin(req))return json({error:'Invalid origin.'},403);const u=await getChatGPTUser();if(!u)return json({error:'Sign in required.'},401);
 const b:any=await req.json().catch(()=>null),db=database();const denied=await administrator(db,u,req,b);if(denied)return denied;
 const username=typeof b?.username==='string'?b.username.trim().toLowerCase():'';
 if(!/^[a-z0-9][a-z0-9._@+-]{2,149}$/.test(username))return json({error:'Username must be 3–150 characters: English letters, numbers, dots, @, +, - or underscores.'},400);
 if(typeof b?.displayName!=='string'||!b.displayName.trim()||b.displayName.length>150)return json({error:'Enter the staff member’s name.'},400);
 if(!['doctor','nurse','reception','hormone_lab','embryology_lab',...(u.isOwner?['admin']:[])].includes(b.role))return json({error:'Choose an allowed role.'},400);
 const department=b.role==='hormone_lab'?'hormonal':b.role==='embryology_lab'?'embryology':'';
 const access=department?'none':b.role==='reception'?'none':b.role==='admin'?'write':b.clinicalAccess;
 if(!['none','read','write'].includes(access))return json({error:'Choose clinical access.'},400);
 const error=passwordError(b.password);if(error)return json({error},400);
 const existing=await db.prepare('SELECT id FROM clinic_staff WHERE username=?').bind(username).first();if(existing)return json({error:'This username is unavailable. Choose another.'},409);
 const id=crypto.randomUUID(),{salt,hash}=await passwordValues(b.password);
 try{await db.batch([db.prepare('INSERT INTO clinic_staff(id,owner,username,password_hash,salt,role,active,created,display_name,clinical_access,can_export,must_change_password,lab_department) VALUES(?,?,?,?,?,?,1,?,?,?,?,1,?)').bind(id,u.userId,username,hash,salt,department?'nurse':b.role,new Date().toISOString(),b.displayName.trim(),access,b.canExport===true&&access!=='none'?1:0,department),audit(db,u.staffId,u.userId,'staff-created:'+id)]);}catch{return json({error:'Could not create the account. Refresh the list before retrying.'},409);}
 return json({ok:true,id},201);
}

