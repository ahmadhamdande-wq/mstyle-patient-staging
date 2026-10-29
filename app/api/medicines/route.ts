import {getChatGPTUser} from '../../chatgpt-auth';
import {database} from '../../../db/raw';

export async function GET(){
 const user=await getChatGPTUser();
 if(!user)return Response.json({error:'Sign in required'},{status:401});
 try{
  const rows=await database().prepare(`SELECT json_extract(snapshot, '$."clinic-medicine-catalogue-v1".json') AS names FROM patients WHERE owner=?`).bind(user.userId).all();
  const names=new Set<string>();
  for(const row of rows.results as {names:string|null}[]){
   if(!row.names)continue;
   const values=JSON.parse(row.names);
   if(Array.isArray(values))for(const name of values)if(typeof name==='string'&&name.trim())names.add(name.trim());
  }
  return Response.json([...names].sort((a,b)=>a.localeCompare(b)),{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Saved medicine choices are unavailable. You can still type a medicine.'},{status:503});}
}
