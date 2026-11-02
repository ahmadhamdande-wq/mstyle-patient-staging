import {requireChatGPTUser} from '../../chatgpt-auth';
import {managesUsers} from '../../../lib/access-policy';
import UsersPanel from './users-panel';
import '../../account.css';
export const dynamic='force-dynamic';
export default async function Users(){const u=await requireChatGPTUser('/settings/users');if(!managesUsers(u))return <main className="access-shell"><h1>Administrator access required</h1><a href="/">Return to patient list</a></main>;return <UsersPanel/>;}
