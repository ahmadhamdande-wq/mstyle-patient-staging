import {requireChatGPTUser} from '../chatgpt-auth';import BackupPanel from './panel';
export const dynamic='force-dynamic';export default async function Backups(){const u=await requireChatGPTUser('/backups');if(!['doctor','admin'].includes(u.role))return <p>Doctor authorization required.</p>;return <BackupPanel/>;}
