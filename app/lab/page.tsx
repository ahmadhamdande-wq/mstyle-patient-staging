import {requireChatGPTUser} from '../chatgpt-auth';
import {clinicalAccess,labDepartment} from '../../lib/access-policy';
import LabPanel from './panel';
import './lab.css';
export const dynamic='force-dynamic';
export default async function Lab(){const user=await requireChatGPTUser('/lab');const department=labDepartment(user);if(!department&&clinicalAccess(user)==='none')return <main><h1>Laboratory access required</h1><a href="/">Patient list</a></main>;return <LabPanel department={department} staffName={user.displayName} canWrite={!!department||clinicalAccess(user)==='write'}/>;}
