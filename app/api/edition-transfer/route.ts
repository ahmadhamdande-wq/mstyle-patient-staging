// The authorized one-time edition copy is complete. No transfer access remains.
export async function GET(){return Response.json({error:'Edition transfer is complete and disabled.'},{status:403,headers:{'Cache-Control':'no-store'}});}
export async function POST(){return GET();}
