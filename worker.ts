import handler from 'vinext/server/fetch-handler';
import {sessionUser} from './lib/session';
export default {async fetch(request:Request,env:Cloudflare.Env,ctx:ExecutionContext){
 const url=new URL(request.url),path=url.pathname;
 const protectedPath=path.startsWith('/api/')||path.startsWith('/record/')||path.startsWith('/settings/');
 if(protectedPath&&!['/api/auth/login','/api/auth/logout'].includes(path)){
  let user;try{user=env.DB?await sessionUser(request.headers.get('cookie')||'',env.DB):null;}catch{return Response.json({error:'Database setup is incomplete'},{status:503});}
  if(!user)return Response.json({error:'Sign in required'},{status:401});
  if(!['GET','HEAD','OPTIONS'].includes(request.method)&&request.headers.get('origin')!==url.origin)return Response.json({error:'Invalid origin'},{status:403});
  if(user.role==='nurse'&&!['GET','HEAD'].includes(request.method))return Response.json({error:'Doctor authorization required for clinical changes'},{status:403});
  if(user.role==='nurse'&&(path.includes('backup')||path.includes('restore')||path.startsWith('/api/staff')))return Response.json({error:'Doctor authorization required'},{status:403});
  if(user.role==='reception'&&!(path==='/api/patients'&&['GET','POST'].includes(request.method)))return Response.json({error:'Clinical access is restricted'},{status:403});
 }
 const response=await handler.fetch(request,env,ctx);const out=new Response(response.body,response);
 const versionedStatic=['GET','HEAD'].includes(request.method)&&/^\/record\/[a-f0-9-]{36}\/[^/]+\.(?:js|css)$/.test(path)&&url.searchParams.has('v')&&response.status===200&&response.headers.get('Cache-Control')==='private, max-age=86400, immutable';if(!versionedStatic)out.headers.set('Cache-Control','no-store');out.headers.set('X-Content-Type-Options','nosniff');out.headers.set('Referrer-Policy','same-origin');out.headers.set('X-Frame-Options','SAMEORIGIN');out.headers.set('Strict-Transport-Security','max-age=31536000');return out;
}};
