import './workspace-studio.css';
import {clinicalAccess,managesUsers,exportsRecords} from '../lib/access-policy';
import {requireChatGPTUser} from './chatgpt-auth';import Workspace from './workspace';
export const dynamic='force-dynamic';export default async function Page(){const u=await requireChatGPTUser('/');return <>{clinicalAccess(u)==='read'&&<p className="studio-role-note">Your clinical access is read-only. Changes cannot be saved.</p>}{clinicalAccess(u)==='none'&&<p className="studio-role-note">Registration and appointment lists only. Clinical records are restricted.</p>}<Workspace staffName={u.displayName} role={u.role} clinical={clinicalAccess(u)} manageUsers={managesUsers(u)} allowExport={exportsRecords(u)}/></>;}

