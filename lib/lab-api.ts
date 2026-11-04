import {getChatGPTUser} from '../app/chatgpt-auth';
import {labDepartment,clinicalAccess} from './access-policy';
import type {Department} from './lab-records';
export async function laboratoryUser(req:Request,write=false){
 const user=await getChatGPTUser();if(!user||user.mustChangePassword)return null;
 const requested=new URL(req.url).searchParams.get('department'),own=labDepartment(user);
 if(own&&requested&&requested!==own)return null;
 const department=own||(['hormonal','embryology'].includes(requested||'')?requested as Department:null);
 if(!department||!own&&(write?clinicalAccess(user)!=='write':clinicalAccess(user)==='none'))return null;
 return {user,department};
}
