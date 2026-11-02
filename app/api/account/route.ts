import {getChatGPTUser} from '../../chatgpt-auth';
import {database} from '../../../db/raw';
import {json} from '../../../lib/account-security';
export async function GET(){const u=await getChatGPTUser();if(!u)return json({error:'Sign in required.'},401);let remaining=0;if(u.isOwner){const row=await database().prepare('SELECT COUNT(*) AS count FROM clinic_recovery_codes WHERE staff_id=? AND used_at IS NULL').bind(u.staffId).first<any>();remaining=Number(row?.count||0);}return json({...u,recoveryCodesRemaining:remaining});}
