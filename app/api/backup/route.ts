import {exportsRecords,clinicalAccess} from '../../../lib/access-policy';
import {getChatGPTUser} from '../../chatgpt-auth';import {collectBackup,seal} from '../../../lib/backup';
export async function GET(req:Request){return Response.redirect(new URL('/backups',req.url));}
export async function POST(req:Request){const u=await getChatGPTUser();if(!u)return Response.json({error:'Sign in required'},{status:401});if(!exportsRecords(u))return Response.json({error:'Export authorization required'},{status:403});try{const b:any=await req.json();const data=await collectBackup(u.userId,b.patient||undefined);return Response.json(await seal(data,b.password),{headers:{'Cache-Control':'no-store','Content-Disposition':'attachment; filename="mstyle-backup-'+new Date().toISOString().slice(0,10)+'.json"'}});}catch(e){return Response.json({error:e instanceof Error?e.message:'Backup failed'},{status:400});}}

