export type ClinicalAccess='none'|'read'|'write';
export type AccessUser={role:string;isOwner?:boolean;clinicalAccess?:ClinicalAccess;canExport?:boolean;mustChangePassword?:boolean};
export function clinicalAccess(row:any):ClinicalAccess {
 if(row.is_owner===1||row.isOwner||row.role==='admin')return 'write';
 if(row.role==='reception')return 'none';
 const configured=row.clinical_access||row.clinicalAccess;
 if(['none','read','write'].includes(configured))return configured;
 return row.role==='nurse'?'read':['doctor','admin'].includes(row.role)?'write':'none';
}
export function managesUsers(u:AccessUser){return !!u.isOwner||u.role==='admin';}
export function exportsRecords(u:AccessUser){return !!u.isOwner||u.role==='admin'||!!u.canExport&&clinicalAccess(u)!=='none';}
export function accessDecision(u:AccessUser,path:string,method:string):boolean {
 const read=['GET','HEAD'].includes(method);
 if(path==='/api/auth/logout'||path==='/logout')return true;
 if(path==='/api/account'||path==='/api/account/password'||path==='/account/password')return true;
 if(u.mustChangePassword)return false;
 if(path==='/api/account/recovery')return !!u.isOwner;
 if(path.startsWith('/api/staff')||path==='/settings/users')return managesUsers(u);
 if(path==='/'||path==='/appointments'||path==='/api/appointments')return read;
 if(path==='/api/patients')return read||method==='POST'&&(u.role==='reception'||clinicalAccess(u)==='write');
 if(path==='/api/backup')return exportsRecords(u)&&['GET','HEAD','POST'].includes(method);
 if(path==='/backups'||path.startsWith('/api/backup')||path==='/api/restore'||/^\/api\/patients\/[^/]+\/summary$/.test(path))return exportsRecords(u)&& (read||clinicalAccess(u)==='write');
 if(clinicalAccess(u)==='none')return false;
 if(path==='/api/auth/procedure-unlock')return managesUsers(u)||!!u.isOwner;
 return read||clinicalAccess(u)==='write';
}
