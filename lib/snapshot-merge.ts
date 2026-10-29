export function mergeSnapshots(base:Record<string,string>,local:Record<string,string>,remote:Record<string,string>){
 const conflicts:string[]=[];const equal=(a:any,b:any)=>JSON.stringify(a)===JSON.stringify(b);
 function merge(b:any,l:any,r:any,path:string):any{if(equal(l,b))return r;if(equal(r,b)||equal(l,r))return l;
 if([b,l,r].every(x=>x&&typeof x==='object'&&!Array.isArray(x))){const out:any={};for(const k of new Set([...Object.keys(b),...Object.keys(l),...Object.keys(r)])){const v=merge(b[k],l[k],r[k],path+'.'+k);if(v!==undefined)out[k]=v;}return out;}
 if([b,l,r].every(x=>Array.isArray(x)&&x.every(y=>y&&typeof y==='object'&&typeof y.id==='string'))){const out=[];for(const id of new Set([...r.map((x:any)=>x.id),...l.map((x:any)=>x.id),...b.map((x:any)=>x.id)])){const v=merge(b.find((x:any)=>x.id===id),l.find((x:any)=>x.id===id),r.find((x:any)=>x.id===id),path+'.'+id);if(v!==undefined)out.push(v);}return out;}
 conflicts.push(path);return l;}
 const out:Record<string,string>={};for(const k of new Set([...Object.keys(base),...Object.keys(local),...Object.keys(remote)])){let result;try{const parse=(v:string|undefined)=>v===undefined?undefined:JSON.parse(v);result=merge(parse(base[k]),parse(local[k]),parse(remote[k]),k);if(result!==undefined)out[k]=JSON.stringify(result);}catch{result=merge(base[k],local[k],remote[k],k);if(result!==undefined)out[k]=result;}}return {values:out,conflicts};
}
