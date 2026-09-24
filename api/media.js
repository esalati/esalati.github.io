import {getSession} from "./_lib/auth.js";import {getFile,putBinary,deleteFile} from "./_lib/github.js";
export default async function handler(req,res){const s=getSession(req);if(!s?.token)return res.status(401).json({error:"احراز هویت لازم است"});try{
if(req.method==="POST"){const{path,contentBase64}=req.body||{};if(!path||!contentBase64)return res.status(400).json({error:"path و contentBase64 لازم است"});if(!/^uploads\/[a-zA-Z0-9._\/-]+$/.test(path))return res.status(400).json({error:"مسیر فایل نامعتبر است"});if(Buffer.byteLength(contentBase64,"base64")>50*1024*1024)return res.status(413).json({error:"حداکثر حجم 50MB است"});
let old=null;try{old=await getFile(path,s.token,"cms-v2")}catch{}const result=await putBinary(path,contentBase64,s.token,"CMS media upload: "+path,old?.sha,"cms-v2");
let publicOld=null;try{publicOld=await getFile(path,s.token,"gh-pages")}catch{}await putBinary(path,contentBase64,s.token,"Sync public media: "+path,publicOld?.sha,"gh-pages");
return res.json({ok:true,path,sha:result.content?.sha||null})}
if(req.method==="DELETE"){const{path,sha}=req.body||{};if(!path)return res.status(400).json({error:"path لازم است"});
const f=sha?{sha}:await getFile(path,s.token,"cms-v2");await deleteFile(path,f.sha,s.token,"CMS media delete: "+path,"cms-v2");
try{const pf=await getFile(path,s.token,"gh-pages");await deleteFile(path,pf.sha,s.token,"Sync public media delete: "+path,"gh-pages")}catch{}
return res.json({ok:true})}
res.status(405).end()}catch(e){res.status(500).json({error:String(e.message||e)})}}