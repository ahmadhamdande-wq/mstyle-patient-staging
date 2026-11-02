import {exportsRecords,clinicalAccess} from '../../lib/access-policy';
import {requireChatGPTUser} from '../chatgpt-auth';import BackupPanel from './panel';
export const dynamic='force-dynamic';export default async function Backups(){const u=await requireChatGPTUser('/backups');if(!exportsRecords(u))return <p>Export authorization required.</p>;return <BackupPanel canRestore={clinicalAccess(u)==='write'}/>;}

