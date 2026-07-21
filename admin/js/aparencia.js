(() => {
  const db = window.misarteSupabase;
  const clientId = new URLSearchParams(location.search).get("id");
  const BUCKET = "clientes";
  const MAX_SIZE = 5 * 1024 * 1024;
  const allowed = ["image/png","image/jpeg","image/webp"];
  const $ = s => document.querySelector(s);
  const el = {
    loader:$("#pageLoader"), app:$("#dashboardApp"), email:$("#userEmail"), logout:$("#logoutButton"),
    menu:$("#menuButton"), sidebar:$(".sidebar"), name:$("#clientName"), warning:$("#setupWarning"),
    form:$("#appearanceForm"), save:$("#saveButton"), preview:$("#previewFrame"), previewTop:$("#previewTop"),
    identity:$("#identityTab"), catalogs:$("#catalogsTab"), back:$("#backLink"), toast:$("#toast"),
    tema:$("#tema"), fonte:$("#fonte"), destaque:$("#catalogoDestaque"),
    bannerInput:$("#bannerInput"), faviconInput:$("#faviconInput"),
    bannerPreview:$("#bannerPreview"), faviconPreview:$("#faviconPreview"),
    removeBanner:$("#removeBanner"), removeFavicon:$("#removeFavicon")
  };
  const colors = [
    ["corPrimaria","corPrimariaText","cor_primaria"],
    ["corSecundaria","corSecundariaText","cor_secundaria"],
    ["corTexto","corTextoText","cor_texto"],
    ["corBotao","corBotaoText","cor_botao"]
  ];
  let current = {};

  function toast(message,type="success"){
    el.toast.textContent=message; el.toast.className=`toast ${type}`; el.toast.hidden=false;
    clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.toast.hidden=true,3000);
  }
  function isHex(v){ return /^#[0-9a-f]{6}$/i.test(v); }
  function syncColors(){
    colors.forEach(([picker,text])=>{
      const p=$("#"+picker), t=$("#"+text);
      p.addEventListener("input",()=>t.value=p.value.toUpperCase());
      t.addEventListener("input",()=>{ if(isHex(t.value)) p.value=t.value; });
    });
  }
  function renderImage(node,url,label){
    node.innerHTML=url?`<img src="${url}" alt="${label}">`:`<span>Sem ${label}</span>`;
  }
  function extension(file){ return {"image/png":"png","image/jpeg":"jpg","image/webp":"webp"}[file.type]; }
  function validate(file){
    if(!allowed.includes(file.type)) throw new Error("Use PNG, JPG ou WEBP.");
    if(file.size>MAX_SIZE) throw new Error("A imagem deve ter no máximo 5 MB.");
  }
  async function upload(kind,file){
    validate(file);
    const path=`${clientId}/${kind}.${extension(file)}`;
    const {error}=await db.storage.from(BUCKET).upload(path,file,{upsert:true,contentType:file.type,cacheControl:"3600"});
    if(error) throw error;
    const {data}=db.storage.from(BUCKET).getPublicUrl(path);
    const url=`${data.publicUrl}?v=${Date.now()}`;
    const field=kind==="banner"?"banner_url":"favicon_url";
    const {error:updateError}=await db.from("clientes").update({[field]:url}).eq("id",clientId);
    if(updateError) throw updateError;
    current[field]=url;
    renderImage(kind==="banner"?el.bannerPreview:el.faviconPreview,url,kind);
    (kind==="banner"?el.removeBanner:el.removeFavicon).hidden=false;
    refreshPreview();
    toast(`${kind==="banner"?"Banner":"Favicon"} atualizado.`);
  }
  async function remove(kind){
    const field=kind==="banner"?"banner_url":"favicon_url";
    const url=current[field];
    if(url){
      const marker=`/storage/v1/object/public/${BUCKET}/`;
      const relative=url.split("?")[0].split(marker)[1];
      if(relative) await db.storage.from(BUCKET).remove([decodeURIComponent(relative)]);
    }
    const {error}=await db.from("clientes").update({[field]:null}).eq("id",clientId);
    if(error) throw error;
    current[field]=null;
    renderImage(kind==="banner"?el.bannerPreview:el.faviconPreview,null,kind);
    (kind==="banner"?el.removeBanner:el.removeFavicon).hidden=true;
    refreshPreview();
    toast("Imagem removida.");
  }
  function refreshPreview(){
    el.preview.src=`../publico.html?cliente=${encodeURIComponent(clientId)}&preview=${Date.now()}`;
  }
  async function load(){
    if(!clientId){ location.replace("./clientes.html"); return; }
    const {data:sessionData}=await db.auth.getSession();
    if(!sessionData.session){ location.replace("./login.html"); return; }
    el.email.textContent=sessionData.session.user.email||"Usuária autenticada";
    const {data,error}=await db.from("clientes")
      .select("id,nome,empresa,cor_primaria,cor_secundaria,cor_texto,cor_botao,tema,fonte,banner_url,favicon_url,catalogo_destaque")
      .eq("id",clientId).single();
    if(error){
      el.warning.hidden=false; el.loader.hidden=true; el.app.hidden=false;
      throw error;
    }
    current=data;
    el.name.textContent=data.nome||data.empresa||"Cliente";
    el.tema.value=data.tema||"escuro"; el.fonte.value=data.fonte||"DM Sans";
    colors.forEach(([picker,text,field])=>{
      const value=data[field]||({cor_primaria:"#B8DBC3",cor_secundaria:"#173C2C",cor_texto:"#F5F4ED",cor_botao:"#B8DBC3"}[field]);
      $("#"+picker).value=value; $("#"+text).value=value.toUpperCase();
    });
    const {data:catalogs}=await db.from("catalogos").select("id,nome,status").eq("cliente_id",clientId).order("ordem");
    (catalogs||[]).filter(c=>c.status==="publicado").forEach(c=>{
      const o=document.createElement("option"); o.value=c.id; o.textContent=c.nome; el.destaque.append(o);
    });
    el.destaque.value=data.catalogo_destaque||"";
    renderImage(el.bannerPreview,data.banner_url,"banner");
    renderImage(el.faviconPreview,data.favicon_url,"favicon");
    el.removeBanner.hidden=!data.banner_url; el.removeFavicon.hidden=!data.favicon_url;
    const publicUrl=`../publico.html?cliente=${encodeURIComponent(clientId)}`;
    el.previewTop.href=publicUrl; el.identity.href=`./cliente.html?id=${encodeURIComponent(clientId)}`;
    el.catalogs.href=`./catalogos.html?id=${encodeURIComponent(clientId)}`;
    el.back.href=`./cliente.html?id=${encodeURIComponent(clientId)}`;
    refreshPreview();
    el.loader.hidden=true; el.app.hidden=false;
  }
  el.form.addEventListener("submit",async e=>{
    e.preventDefault();
    try{
      const payload={tema:el.tema.value,fonte:el.fonte.value,catalogo_destaque:el.destaque.value||null};
      colors.forEach(([,text,field])=>{ const v=$("#"+text).value.trim(); if(!isHex(v)) throw new Error("Use cores no formato #RRGGBB."); payload[field]=v.toUpperCase(); });
      el.save.disabled=true; el.save.textContent="Salvando...";
      const {error}=await db.from("clientes").update(payload).eq("id",clientId);
      if(error) throw error;
      Object.assign(current,payload); refreshPreview(); toast("Aparência salva com sucesso.");
    }catch(error){ console.error(error); el.warning.hidden=/column|schema/i.test(error.message||""); toast(error.message||"Não foi possível salvar.","error"); }
    finally{ el.save.disabled=false; el.save.textContent="Salvar aparência"; }
  });
  el.bannerInput.addEventListener("change",async()=>{ const f=el.bannerInput.files[0]; if(f) try{await upload("banner",f)}catch(e){toast(e.message,"error")} el.bannerInput.value=""; });
  el.faviconInput.addEventListener("change",async()=>{ const f=el.faviconInput.files[0]; if(f) try{await upload("favicon",f)}catch(e){toast(e.message,"error")} el.faviconInput.value=""; });
  el.removeBanner.addEventListener("click",()=>remove("banner").catch(e=>toast(e.message,"error")));
  el.removeFavicon.addEventListener("click",()=>remove("favicon").catch(e=>toast(e.message,"error")));
  $("#refreshPreview").addEventListener("click",refreshPreview);
  el.menu.addEventListener("click",()=>el.sidebar.classList.toggle("is-open"));
  el.logout.addEventListener("click",async()=>{await db.auth.signOut();location.replace("./login.html")});
  syncColors();
  load().catch(e=>{console.error(e);toast(e.message||"Erro ao carregar.","error")});
})();
