import {getChatGPTUser} from '../../chatgpt-auth';
import {database} from '../../../db/raw';
import {clinicalAccess} from '../../../lib/access-policy';
import {json,sameOrigin} from '../../../lib/account-security';
import {workflow} from '../../../lib/clinic-workflow';
import {saveWorkflow} from '../../../lib/workflow-api';
export async function POST(req:Request){
 const user=await getChatGPTUser();if(!sameOrigin(req)||!user||clinicalAccess(user)!=='write')return json({error:'Clinical write access required.'},403);
 const raw=await req.text();if(raw.length>20000)return json({error:'Request too large.'},413);let b:any;try{b=JSON.parse(raw);if(!b||typeof b!=='object'||Array.isArray(b))throw Error('Invalid entry.');}catch{return json({error:'Invalid request.'},400);}
 if(['next-visit','cancel-next-visit'].includes(b.action)&&!user.isOwner&&!['doctor','admin'].includes(user.role))return json({error:'A doctor must approve the date.'},403);
 const row=await database().prepare('SELECT * FROM patients WHERE id=? AND owner=?').bind(String(b.patientId||''),user.userId).first<any>();if(!row)return json({error:'Patient not found.'},404);
 if(row.revision!==b.revision)return json({error:'Patient changed. Refresh and review before retrying.'},409);
 try{const snapshot=workflow(row.snapshot,b,{staffId:user.staffId,name:user.displayName});if(!await saveWorkflow(row,snapshot,user,b.action))return json({error:'Concurrent change. Refresh before retrying.'},409);return json({saved:true,revision:row.revision+1});}catch(e){return json({error:(e as Error).message},400);}
}
export async function GET(req:Request){const user=await getChatGPTUser();if(!user||clinicalAccess(user)==='none')return json({error:'Clinical access required.'},403);const id=new URL(req.url).searchParams.get('patientId');const row=await database().prepare('SELECT * FROM patients WHERE id=? AND owner=?').bind(id,user.userId).first<any>();if(!row)return json({error:'Not found.'},404);const s=JSON.parse(row.snapshot);return json({id:row.id,name:row.name,husband:row.husband,revision:row.revision,visits:(s['hamdan-couple-encounters-v1']?.json||[]).map((v:any)=>({id:v.id,person:v.person||'wife',date:v.fields?.visitDate,cycleId:v.careLinks?.cycle||'',planned:!!v.planned,cancelledAt:v.cancelledAt||'',nextAppointment:(s['hamdan-linked-care-v1']?.json||[]).find((c:any)=>c.id===v.careLinks?.cycle)?.oiAppointments?.[v.id]||null})),canApproveDate:user.isOwner||['doctor','admin'].includes(user.role)});}
