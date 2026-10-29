import {getChatGPTUser} from '../../chatgpt-auth';
import {database} from '../../../db/raw';
import {encodeSnapshot} from '../../../lib/records';
import {buildClinicDemo,DEMO_VERSION} from '../../../lib/demo-clinic';
export async function POST(req:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in required'},{status:401});
 if(req.headers.get('x-clinic-request')!=='1'||req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Invalid request'},{status:403});
 try{const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(user.userId+':'+DEMO_VERSION)))).map(n=>n.toString(16).padStart(2,'0')).join('');const id=digest.slice(0,8)+'-'+digest.slice(8,12)+'-4'+digest.slice(13,16)+'-a'+digest.slice(17,20)+'-'+digest.slice(20,32);
 const existing=await database().prepare('SELECT id FROM patients WHERE id=? AND owner=?').bind(id,user.userId).first();if(existing)return Response.json({id,created:false});
 const demo=buildClinicDemo(),snapshot=await encodeSnapshot(demo.values,user.userId,id);await database().prepare('INSERT OR IGNORE INTO patients(id,owner,name,dob,husband,snapshot,revision,updated) VALUES(?,?,?,?,?,?,0,?)').bind(id,user.userId,demo.name,demo.dob,demo.husband,snapshot,new Date().toISOString()).run();return Response.json({id,created:true},{status:201});
 }catch{return Response.json({error:'Could not prepare the demo patient. Please refresh and retry.'},{status:503});}
}
