// Compatibility exports keep existing clinical routes intact. Identity comes only from our session DB.
import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {database} from '../db/raw';
import type {ClinicalAccess} from '../lib/access-policy';
export type Role='doctor'|'admin'|'nurse'|'reception';
export type ChatGPTUser={userId:string;staffId:string;role:Role;displayName:string;email:string;fullName:string|null;isOwner?:boolean;clinicalAccess?:ClinicalAccess;canExport?:boolean;mustChangePassword?:boolean};
import {sessionUser} from '../lib/session';
export async function getChatGPTUser():Promise<ChatGPTUser|null>{const h=await headers();return sessionUser(h.get('cookie')||'',database());}
export async function requireChatGPTUser(returnTo:string){const user=await getChatGPTUser();if(user){if(user.mustChangePassword&&returnTo!=='/account/password')redirect('/account/password');return user;}redirect(chatGPTSignInPath(returnTo));}
export function chatGPTSignInPath(returnTo='/'){return '/login?return_to='+encodeURIComponent(safeReturn(returnTo));}
export function chatGPTSignOutPath(){return '/logout';}
export function safeReturn(p:string){return p.startsWith('/')&&!p.startsWith('//')&&!p.includes('\\')&&!/[\r\n]/.test(p)?p:'/';}

