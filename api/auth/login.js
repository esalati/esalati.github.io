import crypto from "node:crypto";
function secret(){return process.env.SESSION_SECRET||"CHANGE_ME_IN_VERCEL_ENV";}
function sign(value){return crypto.createHmac("sha256",secret()).update(value).digest("base64url");}
function makeState(payload){const body=Buffer.from(JSON.stringify(payload)).toString("base64url");return body+"."+sign(body)}
function appBase(req){
  const env=process.env.VERCEL_ENV||"";
  if(env==="preview")return ("https://"+req.headers.host).replace(/\/$/,"");
  return (process.env.APP_URL||("https://"+req.headers.host)).replace(/\/$/,"");
}
export default async function handler(req,res){
  const client=process.env.GITHUB_CLIENT_ID;
  if(!client)return res.status(500).json({error:"GITHUB_CLIENT_ID در Vercel ثبت نشده است."});
  const base=appBase(req);
  const redirectUri=base+"/api/auth/callback";
  const now=Math.floor(Date.now()/1000);
  const state=makeState({iat:now,exp:now+600,redirectUri});
  const p=new URLSearchParams({client_id:client,redirect_uri:redirectUri,scope:"public_repo",state});
  res.redirect("https://github.com/login/oauth/authorize?"+p.toString());
}
