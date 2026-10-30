import './workspace-studio.css';
import {requireChatGPTUser} from './chatgpt-auth';import Workspace from './workspace';
export const dynamic='force-dynamic';export default async function Page(){const u=await requireChatGPTUser('/');return <>{u.role==='nurse'&&<p className="studio-role-note">Clinical records are read-only in this release.</p>}{u.role==='reception'&&<p className="studio-role-note">Registration only in this release.</p>}<Workspace staffName={u.displayName} role={u.role}/></>;}
