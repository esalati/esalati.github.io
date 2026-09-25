import crypto from "node:crypto";
import {setSession} from "../_lib/auth.js";
import {user} from "../_lib/github.js";
function secret(){return process.env.SESSION_SECRET||"CHANGE_ME_IN_VERCEL_ENV";}
function sign(value){return crypto.createHmac("sha256",secret()).update(value).digest("base64url");}
function verifyState(state){
  const [body,sig]=String(state||"").split(".");
  if(!body||!sig)return null;
  const expected=sign(body);
  const a=Buffer.from(sig);const b=Buffer.from(expected);
  if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return null;
  try{const p=JSON.parse(Buffer.from(body,"base64url").toString("utf8"));if(!p?.iat||!p?.exp||!p?.redirectUri)return null;if(p.exp<Math.floor(Date.now()/1000))return null;return p;}catch{return null;}
}
function appBase(req){
  const env=process.env.VERCEL_ENV||"";
  if(env==="preview")return "https://esalati-cms-git-cms-v2-13521352.vercel.app";
  return (process.env.APP_URL||("https://"+req.headers.host)).replace(/\/$/,"");
}
export default async function handler(req,res){
  try{
    const q=new URL("https://local"+(req.url||"")).searchParams;
    const state=verifyState(q.get("state"));
    if(!state)throw Error("درخواست ورود معتبر نیست یا منقضی شده است.");
    const code=q.get("code");
    if(!code)throw Error("کد ورود دریافت نشد.");
    const base=appBase(req);
    const redirectUri=base+"/api/auth/callback";
    if(state.redirectUri!==redirectUri)throw Error("نشانی بازگشت ورود با درخواست اولیه مطابقت ندارد.");
    const rr=await fetch("https://github.com/login/oauth/access_token",{method:"POST",headers:{"Accept":"application/json","Content-Type":"application/json"},body:JSON.stringify({client_id:process.env.GITHUB_CLIENT_ID,client_secret:process.env.GITHUB_CLIENT_SECRET,code,redirect_uri:redirectUri})});
    const tok=await rr.json();
    if(!tok.access_token)throw Error(tok.error_description||"توکن GitHub دریافت نشد.");
    const u=await user(tok.access_token);
    const allowed=(process.env.ALLOWED_GITHUB_LOGIN||"esalati").toLowerCase();
    if(String(u.login).toLowerCase()!==allowed)return res.status(403).send("این حساب اجازه مدیریت سایت را ندارد.");
    setSession(res,{token:tok.access_token,login:u.login,name:u.name||u.login});
    res.redirect("/admin/");
  }catch(e){res.status(400).send("خطا در ورود: "+String(e.message||e))}
}
