// Content version for non-clinical static files. Patient HTML remains no-store.
export function assetVersion(content:string){let hash=2166136261;for(let i=0;i<content.length;i++){hash^=content.charCodeAt(i);hash=Math.imul(hash,16777619);}return (hash>>>0).toString(36);}
export function versionAssetLinks(html:string,assets:Record<string,string>){return html.replace(/\b(src|href)=(["'])([^"'?#]+\.(?:js|css))\2/g,(match,attribute,quote,path)=>{const name=path.split('/').at(-1);return name&&assets[name]!==undefined?attribute+'='+quote+path+'?v='+assetVersion(assets[name])+quote:match;});}
