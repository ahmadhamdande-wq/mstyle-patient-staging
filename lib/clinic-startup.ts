const clinicalScreens=new Set(['index.html','husband.html','anc.html','oi.html','oi-simple.html','ivf-stage.html','encounter.html','care.html','lab.html']);

// Runs before patient markup can paint; it never reads or writes clinical data.
function installClinicStartup(){
 const root=document.documentElement;
 root.setAttribute('data-clinic-loading','pending');root.setAttribute('aria-busy','true');
 let finished=false,frame=0,retryPanel:HTMLDivElement|null=null;
 const timeout=setTimeout(()=>{
  if(finished)return;
  root.setAttribute('data-clinic-loading','slow');
  retryPanel=document.createElement('div');retryPanel.id='clinicStartup';retryPanel.setAttribute('role','status');
  const title=document.createElement('strong');title.textContent='MStyle';
  const message=document.createElement('p');message.textContent='The workspace is still loading.';
  const retry=document.createElement('button');retry.type='button';retry.textContent='Reload workspace';retry.onclick=()=>location.reload();
  const back=document.createElement('a');back.href='/';back.textContent='Return to patient list';
  for(const child of [title,message,retry,back])retryPanel.appendChild(child);document.body?.appendChild(retryPanel);
 },10000);
 function reveal(){
  if(finished)return;
  // Layout installers run at DOMContentLoaded and schedule their own first-frame updates.
  const ready=document.body?.classList.contains('patient-file-face')&&document.body.classList.contains('clinic-compact')&&document.getElementById('mstyleRibbon');
  if(!ready){frame=requestAnimationFrame(reveal);return;}
  finished=true;clearTimeout(timeout);root.removeAttribute('data-clinic-loading');root.removeAttribute('aria-busy');retryPanel?.remove();
 }
 function parsed(){frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(reveal);});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',parsed,{once:true});else parsed();
 window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);clearTimeout(timeout);});
 window.addEventListener('pageshow',event=>{if(event.persisted&&!finished)parsed();});
}

const startupStyle=`
html[data-clinic-loading] body,html[data-clinic-loading] body *{visibility:hidden!important}
html[data-clinic-loading]::before{content:'';position:fixed;inset:0;background:#f3f6f8;z-index:2147483646}
html[data-clinic-loading]::after{content:'Loading MStyle…';position:fixed;inset:0;display:grid;place-items:center;z-index:2147483647;font:600 16px/1.5 system-ui,sans-serif;color:#173e50}
html[data-clinic-loading='slow']::after{content:none}
html[data-clinic-loading] #clinicStartup,html[data-clinic-loading] #clinicStartup *{visibility:visible!important}
#clinicStartup{position:fixed;z-index:2147483647;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:#f3f6f8;color:#173e50;font:15px/1.5 system-ui,sans-serif}
#clinicStartup strong{font-size:22px}#clinicStartup p{margin:0}#clinicStartup button{padding:10px 16px;background:#087e88;color:white;border:0;border-radius:6px;font:inherit;cursor:pointer}#clinicStartup a{color:#126574}
@media print{html[data-clinic-loading]::before,html[data-clinic-loading]::after,#clinicStartup{display:none!important}}
`;

export function withClinicStartup(html:string,file:string,assets:Record<string,string>){
 if(!clinicalScreens.has(file))return html;
 // Warm the existing versioned styles without moving them or changing their cascade order.
 const styles=new Set<string>();
 for(const match of html.matchAll(/<link\b[^>]*>/gi)){
  const tag=match[0];if(!/\brel\s*=\s*(["'])stylesheet\1/i.test(tag))continue;
  const href=tag.match(/\bhref\s*=\s*(["'])([^"']+)\1/i)?.[2];
  if(href&&assets[href]!==undefined&&href.endsWith('.css'))styles.add(href);
 }
 const preload=[...styles].map(href=>'<link rel="preload" as="style" href="'+href+'">').join('');
 const boot=preload+'<style id="clinicStartupStyle">'+startupStyle+'</style><script>('+installClinicStartup.toString()+')();</script>';
 const doctype=html.match(/^\s*<!doctype html[^>]*>/i)?.[0]||'';
 return doctype+boot+html.slice(doctype.length);
}
