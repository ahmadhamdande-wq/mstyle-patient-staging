import handler from 'vinext/server/fetch-handler';
import {sessionUser} from './lib/session';
import {accessDecision} from './lib/access-policy';
export default {async fetch(request:Request,env:Cloudflare.Env,ctx:ExecutionContext){
 const url=new URL(request.url),path=url.pathname;
 const protectedPath=path.startsWith('/api/')||path.startsWith('/record/')||path.startsWith('/settings/')||path.startsWith('/account/')||['/','/appointments','/backups'].includes(path);
 if(protectedPath&&!['/api/auth/login','/api/auth/logout','/api/auth/recover'].includes(path)){
  let user;try{user=env.DB?await sessionUser(request.headers.get('cookie')||'',env.DB):null;}catch{return Response.json({error:'Database setup is incomplete'},{status:503});}
  if(!user){if(['GET','HEAD'].includes(request.method)&&!path.startsWith('/api/'))return Response.redirect(new URL('/login?return_to='+encodeURIComponent(path+url.search),url),303);return Response.json({error:'Sign in required'},{status:401,headers:{'Cache-Control':'no-store'}});}
  if(!['GET','HEAD','OPTIONS'].includes(request.method)&&request.headers.get('origin')!==url.origin)return Response.json({error:'Invalid origin'},{status:403});
  if(!accessDecision(user,path,request.method)){if(user.mustChangePassword&&['GET','HEAD'].includes(request.method)&&!path.startsWith('/api/'))return Response.redirect(new URL('/account/password',url),303);return Response.json({error:user.mustChangePassword?'Change your temporary password before continuing.':'Your account does not have permission for this action.'},{status:403,headers:{'Cache-Control':'no-store'}});}
 }
 const response=await handler.fetch(request,env,ctx);const out=new Response(response.body,response);
 const versionedStatic=['GET','HEAD'].includes(request.method)&&/^\/record\/[a-f0-9-]{36}\/[^/]+\.(?:js|css)$/.test(path)&&url.searchParams.has('v')&&response.status===200&&response.headers.get('Cache-Control')==='private, max-age=86400, immutable';if(!versionedStatic)out.headers.set('Cache-Control','no-store');out.headers.set('X-Content-Type-Options','nosniff');out.headers.set('Referrer-Policy','same-origin');out.headers.set('X-Frame-Options','SAMEORIGIN');out.headers.set('Strict-Transport-Security','max-age=31536000');return out;
}};

