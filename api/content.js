import {getSession} from "./_lib/auth.js";
import {getContent,putFile,deleteFile,getFile} from "./_lib/github.js";

const fallback={version:2,updatedAt:null,settings:{siteTitle:"اکبر اصالتی | ایمنی، آتش‌نشانی و مدیریت بحران",description:"وب‌سایت تخصصی اکبر اصالتی",email:"",phone:"",social:{},hero:{title:"اکبر اصالتی",subtitle:"متخصص ایمنی، آتش‌نشانی و مدیریت بحران",description:""}},articles:[],courses:[],experiences:[],library:[],tools:[],media:[],research:[]};

const MAP={
  articles:{path:"articles",label:"مقالات",schema:"Article"},
  courses:{path:"courses",label:"آموزش‌ها",schema:"Course"},
  library:{path:"library",label:"کتابخانه",schema:"CreativeWork"},
  tools:{path:"tools",label:"ابزارها",schema:"WebPage"},
  research:{path:"research",label:"پژوهش‌ها",schema:"WebPage"}
};

const esc=v=>String(v??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const plain=v=>String(v??"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
const published=a=>(Array.isArray(a)?a:[]).filter(x=>x&&x.status==="published"&&x.id);
const idOf=x=>String(x.id).replace(/[^a-zA-Z0-9_-]/g,"-");
const abs=(type,id)=>"https://esalati.github.io/"+MAP[type].path+"/"+id+"/";

function shell(title,description,body,canonical,schema){
  const json=JSON.stringify(schema).replace(/</g,"\\u003c");
  return `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><link rel="stylesheet" href="/assets/content-pages.css"><script type="application/ld+json">${json}</script></head><body><header><div class="wrap"><a class="brand" href="/">اکبر اصالتی</a><nav><a href="/">خانه</a><a href="/articles/">مقالات</a><a href="/courses/">آموزش</a><a href="/library/">کتابخانه</a><a href="/tools/">ابزارها</a><a href="/research/">پژوهش</a></nav></div></header><main class="wrap">${body}</main><footer><a href="/">بازگشت به پایگاه اصلی</a></footer></body></html>`;
}

function breadcrumb(type,title,id){
  const m=MAP[type];
  return {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"خانه","item":"https://esalati.github.io/"},{"@type":"ListItem","position":2,"name":m.label,"item:"+"https://esalati.github.io/"+m.path+"/"},{"@type":"ListItem","position":3,"name":title,"item":abs(type,id)}]};
}

function detail(type,x,settings){
  const m=MAP[type], id=idOf(x), title=x.title||m.label, desc=plain(x.summary||x.body||"").slice(0,160)||settings.description||"";
  const main=plain(x.body||x.summary||"");
  const schema={"@context":"https://schema.org","@type":m.schema,"name":title,"description":desc,"url":abs(type,id),"author":{"@type":"Person","name":"اکبر اصالتی"},"inLanguage":"fa"};
  if(m.schema==="Article"&&x.date)schema.datePublished=x.date;
  if(m.schema==="Course"){schema.provider={"@type":"Person","name":"اکبر اصالتی"};if(x.category)schema.courseCode=x.category;}
  schema.breadcrumb=breadcrumb(type,title,id);
  const link=x.file?'<p><a class="download" href="'+esc(x.file)+'" target="_blank" rel="noopener">مشاهده فایل یا منبع مرتبط ←</a></p>':"";
  return shell(title,desc,'<div class="crumb"><a href="/">خانه</a> ← <a href="/'+m.path+'/">'+m.label+'</a> ← '+esc(title)+'</div><article><span class="eyebrow">'+esc(x.category||x.type||m.label)+'</span><h1>'+esc(title)+'</h1>'+(x.date?'<div class="date">'+esc(x.date)+'</div>':"")+'<p class="lead">'+esc(x.summary||"")+'</p><div class="body">'+esc(main).replace(/\n/g,"<br>")+'</div>'+link+'</article>',abs(type,id),schema);
}

function listing(type,items,settings){
  const m=MAP[type], title=m.label+" | اکبر اصالتی", desc="مجموعه "+m.label+" تخصصی در پایگاه اکبر اصالتی در حوزه ایمنی، آتش‌نشانی و مدیریت بحران.";
  const cards=items.map(x=>{const id=idOf(x),url="/"+m.path+"/"+id+"/";return '<article class="card"><span class="eyebrow">'+esc(x.category||x.type||m.label)+'</span><h2><a href="'+url+'">'+esc(x.title||m.label)+'</a></h2><p>'+esc(plain(x.summary||x.body||"").slice(0,260))+'</p><a class="more" href="'+url+'">مشاهده کامل ←</a></article>';}).join("");
  const schema={"@context":"https://schema.org","@type":"CollectionPage","name":title,"description":desc,"url":"https://esalati.github.io/"+m.path+"/","inLanguage":"fa"};
  return shell(title,desc,'<div class="crumb"><a href="/">خانه</a> ← '+esc(m.label)+'</div><section class="intro"><h1>'+esc(m.label)+'</h1><p>'+esc(desc)+'</p></section><div class="grid">'+(cards||'<div class="empty">هنوز محتوای منتشرشده‌ای در این بخش وجود ندارد.</div>')+'</div>',"https://esalati.github.io/"+m.path+"/",schema);
}

async function putGenerated(path,html,token,branch,message){
  let sha=null; try{const f=await getFile(path,token,branch);sha=f.sha}catch(_e){}
  return putFile(path,html,token,message,sha,branch);
}
async function delGenerated(path,token,branch){
  try{const f=await getFile(path,token,branch);await deleteFile(path,f.sha,token,"Remove unpublished CMS page",branch)}catch(_e){}
}

async function syncPages(content,previous,token,branch){
  const settings=content.settings||fallback.settings;
  for(const type of Object.keys(MAP)){
    const items=published(content[type]);
    await putGenerated(MAP[type].path+"/index.html",listing(type,items,settings),token,branch,"Generate "+MAP[type].label+" index");
    const old=published(previous?.[type]);
    const currentIds=new Set(items.map(x=>idOf(x)));
    for(const x of items) await putGenerated(MAP[type].path+"/"+idOf(x)+"/index.html",detail(type,x,settings),token,branch,"Generate "+MAP[type].label+" page");
    for(const x of old) if(!currentIds.has(idOf(x))) await delGenerated(MAP[type].path+"/"+idOf(x)+"/index.html",token,branch);
  }
}

export default async function handler(req,res){try{
  if(req.method==="GET"){const s=getSession(req);const d=await getContent(s?.token||process.env.GITHUB_READ_TOKEN);return res.status(200).json({content:d.content||fallback,branch:process.env.CMS_BRANCH||"cms-v2"})}
  const s=getSession(req);if(!s?.token)return res.status(401).json({error:"احراز هویت لازم است"});
  const incoming=req.body?.content;if(!incoming||typeof incoming!=="object")return res.status(400).json({error:"محتوای نامعتبر"});
  const d=await getContent(s.token);
  const result=await putFile("admin/data/data/content.json",JSON.stringify(incoming,null,2)+"\n",s.token,req.body.message||"Update CMS content",d.sha,"cms-v2");
  const pub=await getContent(s.token,"gh-pages");
  await putFile("admin/data/data/content.json",JSON.stringify(incoming,null,2)+"\n",s.token,"Sync public content",pub.sha,"gh-pages");
  await syncPages(incoming,d.content||fallback,s.token,"cms-v2");
  await syncPages(incoming,pub.content||fallback,s.token,"gh-pages");
  res.json({ok:true,sha:result.content?.sha||null,publicSync:true,pagesGenerated:true})
}catch(e){res.status(e.status||500).json({error:String(e.message||e)})}}
