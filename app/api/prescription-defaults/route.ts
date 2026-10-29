import {getChatGPTUser} from '../../chatgpt-auth';
import {database} from '../../../db/raw';
export async function GET(){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in required'},{status:401});
 try{const rows=await database().prepare(`SELECT json_extract(snapshot, '$."clinic-prescription-defaults-v1".json') AS defaults FROM patients WHERE owner=?`).bind(user.userId).all();const result:Record<string,any>={};for(const row of rows.results as {defaults:string|null}[]){if(!row.defaults)continue;const d=JSON.parse(row.defaults);for(const [k,m]of Object.entries(d) as [string,any][]){if(!m||typeof m.drug!=='string'||typeof m.updatedAt!=='string')continue;if(!result[k]||m.updatedAt>result[k].updatedAt)result[k]=m;}}return Response.json(result,{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Medicine suggestions unavailable'},{status:503});}
}
