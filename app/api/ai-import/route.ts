import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {record,validId} from '../../../lib/records';
import {validateImportInput,importRequest,parseImportResponse} from '../../../lib/ai-import';
const configuration=()=>({key:(env as any).OPENAI_API_KEY as string|undefined,model:(env as any).OPENAI_IMPORT_MODEL as string|undefined});
const headers={'Cache-Control':'no-store'};
export async function GET(){if(!await getChatGPTUser())return Response.json({error:'Sign in required'},{status:401,headers});const c=configuration();return Response.json({configured:!!(c.key&&c.model),message:c.key&&c.model?'AI import ready · review before applying':'AI image import needs a separate API connection. It is not connected yet.'},{headers});}
export async function POST(req:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in required'},{status:401,headers});
 if(req.headers.get('X-Clinic-Request')!=='1'||req.headers.get('Origin')&&req.headers.get('Origin')!==new URL(req.url).origin)return Response.json({error:'Invalid request'},{status:403,headers});
 const c=configuration();if(!c.key||!c.model)return Response.json({error:'AI import is not connected yet. Configure the private API connection first.'},{status:503,headers});
 try{
  if(Number(req.headers.get('content-length')||0)>12500000)throw Error('Images are too large.');
  const text=await req.text();if(text.length>12500000)throw Error('Images are too large.');const body=JSON.parse(text),input=validateImportInput(body);
  if(body.patientId&&(!validId(body.patientId)||!await record(body.patientId,user.userId)))return Response.json({error:'Patient file not found'},{status:404,headers});
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+c.key,'Content-Type':'application/json'},body:JSON.stringify(importRequest(input.images,input.person,c.model)),signal:AbortSignal.timeout(45000)});
  if(!response.ok)return Response.json({error:'AI transcription is unavailable. Check the API connection or try again.'},{status:502,headers});
  return Response.json(parseImportResponse(await response.json()),{headers});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Image import failed.'},{status:400,headers});}
}
