import {getSession} from "./_lib/auth.js";

export default async function handler(req,res){
  try{
    const s=getSession(req);
    if(!s?.token)return res.status(401).json({error:"احراز هویت لازم است"});
    const blobToken=process.env.BLOB_READ_WRITE_TOKEN;

    if(req.method==="GET"){
      return res.status(200).json({
        ok:true,
        authenticated:true,
        blobConfigured:Boolean(blobToken),
        environment:process.env.VERCEL_ENV||"unknown"
      });
    }

    if(req.method!=="POST")return res.status(405).end();
    if(!blobToken)throw new Error("BLOB_READ_WRITE_TOKEN در Vercel تنظیم نشده است.");

    const body=req.body;
    if(!body||typeof body!=="object")throw new Error("بدنه درخواست آپلود نامعتبر است.");

    const {handleUpload}=await import("@vercel/blob/client");
    const result=await handleUpload({
      body,
      request:req,
      token:blobToken,
      onBeforeGenerateToken:async(pathname)=>{
        const clean=String(pathname||"").replace(/^\/+/, "");
        if(!/^uploads\/[a-zA-Z0-9._\/-]+$/.test(clean))throw new Error("مسیر فایل نامعتبر است");
        return {
          allowedContentTypes:[
            "image/jpeg","image/png","image/gif","image/webp","image/svg+xml",
            "video/mp4","video/webm","audio/mpeg","audio/mp4","audio/wav",
            "application/pdf","application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/plain","text/csv"
          ],
          addRandomSuffix:true,
          tokenPayload:JSON.stringify({login:s.login||"esalati"})
        };
      },
      onUploadCompleted:async()=>{}
    });
    return res.status(200).json(result);
  }catch(e){
    console.error("Blob upload handler error:",e);
    return res.status(500).json({error:String(e.message||e)});
  }
}
