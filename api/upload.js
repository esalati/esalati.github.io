import {getSession} from "./_lib/auth.js";
import {handleUpload} from "@vercel/blob/client";

export default async function handler(req,res){
  const s=getSession(req);
  if(!s?.token)return res.status(401).json({error:"احراز هویت لازم است"});
  if(req.method!=="POST")return res.status(405).end();
  try{
    // Vercel's Node.js function runtime parses the JSON request body into req.body.
    // handleUpload expects the parsed HandleUploadBody object.
    const body=req.body;
    if(!body||typeof body!=="object")return res.status(400).json({error:"بدنه درخواست آپلود نامعتبر است"});
    const result=await handleUpload({
      body,
      request:req,
      onBeforeGenerateToken:async(pathname)=>{
        const clean=String(pathname||"").replace(/^\/+/, "");
        if(!/^uploads\/[a-zA-Z0-9._\/-]+$/.test(clean))throw new Error("مسیر فایل نامعتبر است");
        return {
          allowedContentTypes:["image/*","video/*","audio/*","application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","application/vnd.ms-powerpoint","application/vnd.openxmlformats-officedocument.presentationml.presentation","text/*"],
          addRandomSuffix:true,
          tokenPayload:JSON.stringify({login:s.login||"esalati"})
        };
      },
      onUploadCompleted:async()=>{}
    });
    return res.status(200).json(result);
  }catch(e){
    console.error("Blob upload handler error:",e);
    return res.status(400).json({error:String(e.message||e)});
  }
}
