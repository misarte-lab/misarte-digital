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
    fontPickerButton:$("#fontPickerButton"), fontLibrary:$("#fontLibrary"), fontSearch:$("#fontSearch"),
    fontCategories:$("#fontCategories"), fontGrid:$("#fontGrid"), fontEmpty:$("#fontEmpty"),
    fontResultCount:$("#fontResultCount"), selectedFontName:$("#selectedFontName"), closeFontLibrary:$("#closeFontLibrary"),
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

  const FONT_LIBRARY = [
    {name:"DM Sans",category:"Modernas"},{name:"Inter",category:"Modernas"},{name:"Poppins",category:"Modernas"},
    {name:"Montserrat",category:"Modernas"},{name:"Manrope",category:"Modernas"},{name:"Plus Jakarta Sans",category:"Modernas"},
    {name:"Urbanist",category:"Modernas"},{name:"Outfit",category:"Modernas"},{name:"Sora",category:"Modernas"},
    {name:"Rubik",category:"Modernas"},{name:"Nunito Sans",category:"Modernas"},{name:"Work Sans",category:"Modernas"},
    {name:"Playfair Display",category:"Elegantes"},{name:"Cormorant Garamond",category:"Elegantes"},
    {name:"Libre Baskerville",category:"Elegantes"},{name:"Bodoni Moda",category:"Elegantes"},
    {name:"Prata",category:"Elegantes"},{name:"Cinzel",category:"Elegantes"},{name:"Italiana",category:"Elegantes"},
    {name:"Marcellus",category:"Elegantes"},{name:"DM Serif Display",category:"Elegantes"},
    {name:"Lora",category:"Clássicas"},{name:"Merriweather",category:"Clássicas"},{name:"Crimson Text",category:"Clássicas"},
    {name:"EB Garamond",category:"Clássicas"},{name:"Source Serif 4",category:"Clássicas"},{name:"Noto Serif",category:"Clássicas"},
    {name:"Spectral",category:"Clássicas"},{name:"Alegreya",category:"Clássicas"},{name:"Cardo",category:"Clássicas"},
    {name:"Bebas Neue",category:"Fortes"},{name:"Oswald",category:"Fortes"},{name:"Anton",category:"Fortes"},
    {name:"Archivo Black",category:"Fortes"},{name:"League Spartan",category:"Fortes"},{name:"Barlow Condensed",category:"Fortes"},
    {name:"Roboto Condensed",category:"Fortes"},{name:"Teko",category:"Fortes"},{name:"Fjalla One",category:"Fortes"},
    {name:"Righteous",category:"Criativas"},{name:"Comfortaa",category:"Criativas"},{name:"Fredoka",category:"Criativas"},
    {name:"Baloo 2",category:"Criativas"},{name:"Pacifico",category:"Criativas"},{name:"Lobster",category:"Criativas"},
    {name:"Caveat",category:"Criativas"},{name:"Dancing Script",category:"Criativas"},{name:"Satisfy",category:"Criativas"},
    {name:"Bangers",category:"Criativas"},{name:"Permanent Marker",category:"Criativas"},
    {name:"Roboto",category:"Neutras"},{name:"Open Sans",category:"Neutras"},{name:"Lato",category:"Neutras"},
    {name:"Source Sans 3",category:"Neutras"},{name:"Noto Sans",category:"Neutras"},{name:"Mulish",category:"Neutras"},
    {name:"Karla",category:"Neutras"},{name:"Cabin",category:"Neutras"},{name:"Figtree",category:"Neutras"},
    {name:"IBM Plex Sans",category:"Neutras"},{name:"Josefin Sans",category:"Neutras"},{name:"Quicksand",category:"Neutras"}
  ];
  const FONT_CATEGORIES = ["Todas","Modernas","Elegantes","Clássicas","Fortes","Criativas","Neutras"];
  let activeFontCategory = "Todas";
  const loadedFonts = new Set();

  function fontCssUrl(names){
    const families=names.map(name=>`family=${encodeURIComponent(name).replace(/%20/g,"+")}`).join("&");
    return `https://fonts.googleapis.com/css2?${families}&display=swap`;
  }
  function loadFonts(names){
    const pending=[...new Set(names)].filter(name=>!loadedFonts.has(name));
    if(!pending.length) return;
    pending.forEach(name=>loadedFonts.add(name));
    const link=document.createElement("link");
    link.rel="stylesheet";
    link.href=fontCssUrl(pending);
    document.head.append(link);
  }
  function setSelectedFont(name){
    const font=FONT_LIBRARY.find(item=>item.name===name)||FONT_LIBRARY[0];
    el.fonte.value=font.name;
    el.selectedFontName.textContent=font.name;
    el.selectedFontName.style.fontFamily=`"${font.name}", sans-serif`;
    loadFonts([font.name]);
    el.fontGrid.querySelectorAll(".font-option").forEach(button=>{
      const selected=button.dataset.font===font.name;
      button.classList.toggle("is-selected",selected);
      button.setAttribute("aria-selected",String(selected));
    });
  }
  function renderFontCategories(){
    el.fontCategories.innerHTML="";
    FONT_CATEGORIES.forEach(category=>{
      const button=document.createElement("button");
      button.type="button";
      button.className=`font-category${category===activeFontCategory?" is-active":""}`;
      button.textContent=category;
      button.setAttribute("role","tab");
      button.setAttribute("aria-selected",String(category===activeFontCategory));
      button.addEventListener("click",(event)=>{
        // Evita que o clique chegue ao listener global e feche a biblioteca
        // depois que os botões de categoria forem renderizados novamente.
        event.stopPropagation();
        activeFontCategory=category;
        renderFontCategories();
        renderFonts();
      });
      el.fontCategories.append(button);
    });
  }
  function renderFonts(){
    const query=el.fontSearch.value.trim().toLocaleLowerCase("pt-BR");
    const fonts=FONT_LIBRARY.filter(font=>{
      const categoryMatches=activeFontCategory==="Todas"||font.category===activeFontCategory;
      const searchMatches=!query||font.name.toLocaleLowerCase("pt-BR").includes(query);
      return categoryMatches&&searchMatches;
    });
    el.fontGrid.innerHTML="";
    el.fontEmpty.hidden=fonts.length!==0;
    el.fontResultCount.textContent=`${fonts.length} ${fonts.length===1?"fonte encontrada":"fontes encontradas"}`;
    loadFonts(fonts.map(font=>font.name));
    fonts.forEach(font=>{
      const button=document.createElement("button");
      button.type="button";
      button.className=`font-option${el.fonte.value===font.name?" is-selected":""}`;
      button.dataset.font=font.name;
      button.setAttribute("role","option");
      button.setAttribute("aria-selected",String(el.fonte.value===font.name));
      button.innerHTML=`<span class="font-option-preview" style="font-family:'${font.name}',sans-serif">Aa</span><span><strong style="font-family:'${font.name}',sans-serif">${font.name}</strong><small>${font.category}</small></span><span class="font-option-check" aria-hidden="true">✓</span>`;
      button.addEventListener("click",()=>{
        setSelectedFont(font.name);
        closeFontLibrary();
      });
      el.fontGrid.append(button);
    });
  }
  function openFontLibrary(){
    el.fontLibrary.hidden=false;
    el.fontPickerButton.setAttribute("aria-expanded","true");
    renderFonts();
    setTimeout(()=>el.fontSearch.focus(),0);
  }
  function closeFontLibrary(){
    el.fontLibrary.hidden=true;
    el.fontPickerButton.setAttribute("aria-expanded","false");
  }
  function initFontLibrary(){
    renderFontCategories();
    renderFonts();
    el.fontPickerButton.addEventListener("click",()=>el.fontLibrary.hidden?openFontLibrary():closeFontLibrary());
    el.closeFontLibrary.addEventListener("click",closeFontLibrary);
    el.fontSearch.addEventListener("input",renderFonts);
    document.addEventListener("keydown",event=>{ if(event.key==="Escape"&&!el.fontLibrary.hidden) closeFontLibrary(); });
    document.addEventListener("click",event=>{
      if(!el.fontLibrary.hidden&&!el.fontLibrary.contains(event.target)&&!el.fontPickerButton.contains(event.target)) closeFontLibrary();
    });
  }

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
    el.tema.value=data.tema||"escuro"; setSelectedFont(data.fonte||"DM Sans");
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
  initFontLibrary();
  load().catch(e=>{console.error(e);toast(e.message||"Erro ao carregar.","error")});
})();
