// Content version for non-clinical static files. Patient HTML remains no-store.
// Only static source strings are cached; never patient HTML or snapshot data.
const versionCache=new Map<string,string>();
export function assetVersion(content:string){const cached=versionCache.get(content);if(cached!==undefined)return cached;let hash=2166136261;for(let i=0;i<content.length;i++){hash^=content.charCodeAt(i);hash=Math.imul(hash,16777619);}const version=(hash>>>0).toString(36);if(versionCache.size>=256)versionCache.clear();versionCache.set(content,version);return version;}
export function versionAssetLinks(html:string,assets:Record<string,string>){return html.replace(/\b(src|href)=(["'])([^"'?#]+\.(?:js|css))\2/g,(match,attribute,quote,path)=>{const name=path.split('/').at(-1);return name&&assets[name]!==undefined?attribute+'='+quote+path+'?v='+assetVersion(assets[name])+quote:match;});}

