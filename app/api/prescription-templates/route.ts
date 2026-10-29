import {getChatGPTUser} from '../../chatgpt-auth';
import {database} from '../../../db/raw';
export async function GET(){
 const user=await getChatGPTUser();
 if(!user)return Response.json({error:'Sign in required'},{status:401});
 try{
  const rows=await database().prepare(`SELECT json_extract(snapshot, '$."clinic-prescription-templates-v1".json') AS templates FROM patients WHERE owner=?`).bind(user.userId).all();
  const saved=new Map<string,{id:string;name:string;updatedAt:string;deleted?:boolean;medications:unknown[]}>();
  for(const row of rows.results as {templates:string|null}[]){
   if(!row.templates)continue;
   const list=JSON.parse(row.templates);if(!Array.isArray(list))continue;
   for(const t of list){if(!t||typeof t.id!=='string'||typeof t.name!=='string'||typeof t.updatedAt!=='string'||!Array.isArray(t.medications))continue;const old=saved.get(t.id);if(!old||t.updatedAt>old.updatedAt)saved.set(t.id,t);}
  }
  return Response.json([...saved.values()],{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Saved prescription groups are unavailable'},{status:503});}
}
