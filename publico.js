(() => {
  const db = window.misarteSupabase;
  const clientId = new URLSearchParams(location.search).get("cliente");
  const $ = s => document.querySelector(s);
  const el = {
    loader:$("#publicLoader"),app:$("#publicApp"),hero:$("#hero"),logo:$("#clientLogo"),
    clientName:$("#clientName"),clientMeta:$("#clientMeta"),chooser:$("#catalogChooser"),
    buttons:$("#catalogButtons"),catalogType:$("#catalogType"),catalogName:$("#catalogName"),
    catalogDescription:$("#catalogDescription"),empty:$("#emptyState"),categories:$("#categoriesContainer")
  };
  let catalogs=[], selectedCatalogId=null, client=null;
  const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  const money=v=>v===null||v===""?"":new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v));
  const typeLabel=v=>({cardapio:"Cardápio",cervejas:"Carta de cervejas",drinks:"Carta de drinks",vinhos:"Carta de vinhos",menu_executivo:"Menu executivo",promocoes:"Promoções",outro:"Catálogo"}[v]||"Catálogo");
  const safeColor=(v,fallback)=>/^#[0-9a-f]{6}$/i.test(v||"")?v:fallback;
  function applyTheme(data){
    const dark=data.tema!=="claro";
    const primary=safeColor(data.cor_primaria,"#B8DBC3");
    const secondary=safeColor(data.cor_secundaria,dark?"#173C2C":"#E8F1EB");
    const text=safeColor(data.cor_texto,dark?"#F5F4ED":"#18221D");
    const button=safeColor(data.cor_botao,primary);
    const root=document.documentElement;
    root.style.setProperty("--brand-primary",primary);
    root.style.setProperty("--brand-secondary",secondary);
    root.style.setProperty("--brand-text",text);
    root.style.setProperty("--brand-button",button);
    root.style.setProperty("--bg",dark?"#07140F":"#F7F7F3");
    root.style.setProperty("--panel",dark?"#0D2118":"#FFFFFF");
    root.style.setProperty("--panel-2",dark?"#10271D":"#F1F4F1");
    root.style.setProperty("--muted",dark?"#9EB7AA":"#617067");
    root.style.setProperty("--line",dark?"rgba(174,220,190,.16)":"rgba(20,50,35,.13)");
    const selectedFont=data.fonte||"DM Sans";
    const serifFonts=new Set(["Playfair Display","Cormorant Garamond","Libre Baskerville","Bodoni Moda","Prata","Cinzel","Italiana","Marcellus","DM Serif Display","Lora","Merriweather","Crimson Text","EB Garamond","Source Serif 4","Noto Serif","Spectral","Alegreya","Cardo"]);
    const fallback=serifFonts.has(selectedFont)?"serif":"sans-serif";
    const fontLink=document.createElement("link");
    fontLink.rel="stylesheet";
    fontLink.href=`https://fonts.googleapis.com/css2?family=${encodeURIComponent(selectedFont).replace(/%20/g,"+")}&display=swap`;
    document.head.append(fontLink);
    root.style.setProperty("--brand-font",`"${selectedFont}",${fallback}`);
    document.querySelector('meta[name="theme-color"]').setAttribute("content",dark?"#07140F":"#F7F7F3");
    if(data.favicon_url){
      let link=document.querySelector("link[rel='icon']")||document.createElement("link");
      link.rel="icon"; link.href=data.favicon_url; document.head.append(link);
    }
  }
  function showError(message){
    el.loader.hidden=true;el.app.hidden=false;el.clientName.textContent="Catálogo indisponível";
    el.clientMeta.textContent=message;el.chooser.hidden=true;el.empty.hidden=false;el.empty.textContent="Este catálogo não está disponível no momento.";
  }
  async function loadClient(){
    const {data,error}=await db.from("clientes")
      .select("id,nome,empresa,categoria,cidade,estado,status,logo_url,capa_url,cor_primaria,cor_secundaria,cor_texto,cor_botao,tema,fonte,banner_url,favicon_url,catalogo_destaque")
      .eq("id",clientId).eq("status","ativo").single();
    if(error||!data) throw new Error("Cliente não encontrado ou página ainda não publicada.");
    client=data; applyTheme(data);
    const name=data.nome||data.empresa||"Cliente";
    document.title=`${name} | Catálogo Digital`;el.clientName.textContent=name;
    el.clientMeta.textContent=[data.categoria,data.cidade,data.estado].filter(Boolean).join(" · ");
    if(data.logo_url){el.logo.src=data.logo_url;el.logo.alt=`Logo de ${name}`;el.logo.hidden=false}
    const heroImage=data.banner_url||data.capa_url;
    if(heroImage) el.hero.style.backgroundImage=`url("${heroImage}")`;
  }
  async function loadCatalogs(){
    const {data,error}=await db.from("catalogos").select("id,nome,tipo,descricao,destaque,ordem")
      .eq("cliente_id",clientId).eq("status","publicado").order("destaque",{ascending:false}).order("ordem",{ascending:true});
    if(error) throw error; catalogs=data||[];
    if(!catalogs.length){el.empty.hidden=false;el.empty.textContent="Nenhum catálogo publicado no momento.";return}
    const preferred=catalogs.find(c=>String(c.id)===String(client.catalogo_destaque));
    selectedCatalogId=(preferred||catalogs[0]).id;
    if(catalogs.length>1){el.chooser.hidden=false;el.buttons.innerHTML=catalogs.map(c=>`<button class="catalog-button ${String(c.id)===String(selectedCatalogId)?"active":""}" data-id="${esc(c.id)}">${esc(c.nome)}</button>`).join("")}
    await renderCatalog(selectedCatalogId);
  }
  async function renderCatalog(catalogId){
    selectedCatalogId=catalogId;const catalog=catalogs.find(i=>String(i.id)===String(catalogId));if(!catalog)return;
    el.catalogType.textContent=typeLabel(catalog.tipo).toUpperCase();el.catalogName.textContent=catalog.nome;el.catalogDescription.textContent=catalog.descricao||"";
    el.empty.hidden=true;el.categories.innerHTML='<div class="public-empty">Carregando itens...</div>';
    el.buttons.querySelectorAll(".catalog-button").forEach(b=>b.classList.toggle("active",String(b.dataset.id)===String(catalogId)));
    const {data:categories,error:categoryError}=await db.from("categorias").select("id,nome,descricao,ordem").eq("catalogo_id",catalogId).eq("status","ativa").order("ordem");
    if(categoryError)throw categoryError;
    if(!categories?.length){el.categories.innerHTML="";el.empty.hidden=false;el.empty.textContent="Este catálogo ainda não possui categorias publicadas.";return}
    const {data:products,error:productError}=await db.from("produtos").select("id,categoria_id,nome,descricao,preco,destaque,ordem").in("categoria_id",categories.map(c=>c.id)).eq("status","disponivel").order("destaque",{ascending:false}).order("ordem");
    if(productError)throw productError;
    el.categories.innerHTML=categories.map(category=>{
      const items=(products||[]).filter(p=>String(p.categoria_id)===String(category.id));if(!items.length)return"";
      return `<section class="category-section"><div class="category-header"><h3>${esc(category.nome)}</h3>${category.descricao?`<p>${esc(category.descricao)}</p>`:""}</div><div class="products-grid">${items.map(product=>`<article class="product-item"><div class="product-top"><div><h4>${esc(product.nome)}</h4>${product.destaque?'<div class="product-tags"><span class="product-tag">Destaque</span></div>':""}</div>${product.preco!==null?`<span class="product-price">${esc(money(product.preco))}</span>`:""}</div>${product.descricao?`<p class="product-description">${esc(product.descricao)}</p>`:""}</article>`).join("")}</div></section>`;
    }).join("");
    if(!el.categories.innerHTML.trim()){el.empty.hidden=false;el.empty.textContent="Nenhum produto disponível neste catálogo."}
  }
  el.buttons.addEventListener("click",async e=>{const b=e.target.closest(".catalog-button");if(!b)return;await renderCatalog(b.dataset.id);$("#catalogContent").scrollIntoView({behavior:"smooth",block:"start"})});
  (async()=>{if(!clientId){showError("O endereço do cliente está incompleto.");return}try{await loadClient();await loadCatalogs();el.loader.hidden=true;el.app.hidden=false}catch(error){console.error(error);showError(error.message||"Não foi possível abrir o catálogo.")}})();
})();
