import {requireChatGPTUser} from '../../chatgpt-auth';
import PasswordPanel from './password-panel';
import '../../account.css';
export const dynamic='force-dynamic';
export default async function Password(){const u=await requireChatGPTUser('/account/password');return <PasswordPanel owner={!!u.isOwner} requiredChange={!!u.mustChangePassword}/>;}
