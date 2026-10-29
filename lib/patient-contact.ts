export function patientContactCore(){
 const clean=(v:any,n=500)=>String(v??'').trim().slice(0,n);
 function read(values:any,key:string,fallback:any={}){const v=values?.[key];if(v?.json!==undefined)return v.json;try{return typeof v==='string'?JSON.parse(v):v||fallback;}catch{return fallback;}}
 function profile(values:any,person='wife'){return read(values,'profile-'+person,null)||read(values,person==='husband'?'hamdan-husband-demo-m001-v1':'ivf-medical-history-demo-001-v1',{}).data?.profile||{};}
 function contact(p:any={},id=''){return {fileNumber:clean(p.fileNumber||id.slice(0,8).toUpperCase(),40),mobile:clean(p.mobile||p.phone,40),city:clean(p.city,100),area:clean(p.area,150),address:clean(p.address,500),email:clean(p.email,200),addressLine:[p.city,p.area,p.address].map(x=>clean(x)).filter(Boolean).join(' · ')};}
 function fields(b:any,id=''){const p=contact(b,id);return {fileNumber:p.fileNumber,mobile:p.mobile,city:p.city,area:p.area,address:p.address,email:p.email,reminderPreferences:{channel:['WhatsApp','SMS','Email'].includes(b.reminderPreferences?.channel)?b.reminderPreferences.channel:'WhatsApp',appointments:b.reminderPreferences?.appointments===true,procedures:b.reminderPreferences?.procedures===true,results:b.reminderPreferences?.results===true,consent:b.reminderPreferences?.consent===true}};}
 return {clean,read,profile,contact,fields};
}
