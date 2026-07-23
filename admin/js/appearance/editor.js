
(() => {
  "use strict";
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const form = $("#appearanceForm");
  const preview = $("#previewFrame");
  if (!form || !preview) return;

  const clientId = new URLSearchParams(location.search).get("id") || "default";
  const storageKey = `misarte-appearance-editor-${clientId}`;
  const defaults = {
    buttonRadius: 12, cardRadius: 18, sectionGap: 24, contentWidth: 1120,
    shadow: "media", buttonStyle: "rounded", cardBorder: 1, alignment: "left"
  };
  let savedVisual = {...defaults, ...safeRead()};
  let sessionStart = null;
  let dirty = false;

  function safeRead(){
    try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); }
    catch { return {}; }
  }
  function capture(){
    const colors = {};
    ["corPrimariaText","corSecundariaText","corTextoText","corBotaoText","corDestaqueText","corFundoText"]
      .forEach(id => colors[id] = $("#"+id)?.value || "");
    return {
      tema: $("#tema")?.value || "escuro",
      fonte: $("#fonte")?.value || "DM Sans",
      colors,
      visual: readVisual()
    };
  }
  function readVisual(){
    return {
      buttonRadius:+($("#buttonRadius23")?.value ?? savedVisual.buttonRadius),
      cardRadius:+($("#cardRadius23")?.value ?? savedVisual.cardRadius),
      sectionGap:+($("#sectionGap23")?.value ?? savedVisual.sectionGap),
      contentWidth:+($("#contentWidth23")?.value ?? savedVisual.contentWidth),
      shadow:$("#shadow23")?.value ?? savedVisual.shadow,
      buttonStyle:$("#buttonStyle23")?.value ?? savedVisual.buttonStyle,
      cardBorder:+($("#cardBorder23")?.value ?? savedVisual.cardBorder),
      alignment:$("#alignment23")?.value ?? savedVisual.alignment
    };
  }
  function setDirty(value=true){
    dirty=value;
    $(".preview-panel")?.classList.toggle("is-dirty", value);
  }
  function setField(id,value){
    const node=$("#"+id); if(!node) return;
    node.value=value;
    node.dispatchEvent(new Event("input",{bubbles:true}));
    node.dispatchEvent(new Event("change",{bubbles:true}));
  }
  function applyState(state){
    if(!state) return;
    if(state.tema) setField("tema",state.tema);
    if(state.fonte){
      setField("fonte",state.fonte);
      const label=$("#selectedFontName"); if(label) label.textContent=state.fonte;
    }
    Object.entries(state.colors||{}).forEach(([id,value])=>setField(id,value));
    const v={...defaults,...state.visual};
    Object.entries({
      buttonRadius23:v.buttonRadius,cardRadius23:v.cardRadius,sectionGap23:v.sectionGap,
      contentWidth23:v.contentWidth,shadow23:v.shadow,buttonStyle23:v.buttonStyle,
      cardBorder23:v.cardBorder,alignment23:v.alignment
    }).forEach(([id,value])=>setField(id,value));
    updateReadouts(); applyPreview();
  }

  const workspace=document.createElement("div");
  workspace.className="appearance-workspace";
  const nav=document.createElement("nav");
  nav.className="appearance-section-nav";
  nav.setAttribute("aria-label","Seções da aparência");
  workspace.append(nav);

  const panels=document.createElement("div");
  panels.className="appearance-panels";
  workspace.append(panels);

  const originalCards=$$(".appearance-card",form);
  originalCards.forEach((card,index)=>{
    const panel=document.createElement("div");
    panel.className="appearance-panel"+(index===0?" is-active":"");
    panel.dataset.panel=index===0?"identidade":"imagens";
    panel.append(card);
    panels.append(panel);
  });

  form.prepend(workspace);
  const oldActions=$(".appearance-actions",form);
  if(oldActions) oldActions.hidden=true;

  const modelsPanel=document.createElement("div");
  modelsPanel.className="appearance-panel";
  modelsPanel.dataset.panel="modelos";
  modelsPanel.innerHTML=`<section class="appearance-editor-card">
    <p class="eyebrow">MISARTE MODELS</p><h2>Modelos visuais</h2>
    <p>Aplique uma combinação completa e ajuste os detalhes antes de salvar.</p>
    <div class="model-grid-23" id="modelGrid23"></div>
  </section>`;
  panels.prepend(modelsPanel);

  const componentsPanel=document.createElement("div");
  componentsPanel.className="appearance-panel";
  componentsPanel.dataset.panel="componentes";
  componentsPanel.innerHTML=`<section class="appearance-editor-card">
    <p class="eyebrow">COMPONENTES</p><h2>Botões e cards</h2>
    <p>Personalize forma, bordas e profundidade com atualização imediata.</p>
    <div class="component-controls">
      ${controlSelect("buttonStyle23","Estilo dos botões",[["square","Quadrado"],["rounded","Arredondado"],["pill","Pill"]])}
      ${controlRange("buttonRadius23","Raio dos botões",0,40,1,"px")}
      ${controlRange("cardRadius23","Raio dos cards",0,36,1,"px")}
      ${controlRange("cardBorder23","Espessura da borda",0,4,1,"px")}
      ${controlSelect("shadow23","Sombras",[["none","Sem sombra"],["soft","Suave"],["media","Média"],["strong","Marcante"]])}
    </div>
  </section>`;
  panels.append(componentsPanel);

  const layoutPanel=document.createElement("div");
  layoutPanel.className="appearance-panel";
  layoutPanel.dataset.panel="layout";
  layoutPanel.innerHTML=`<section class="appearance-editor-card">
    <p class="eyebrow">LAYOUT</p><h2>Ritmo e proporção</h2>
    <p>Controle a largura e o respiro da página pública.</p>
    <div class="component-controls">
      ${controlRange("contentWidth23","Largura do conteúdo",760,1440,20,"px")}
      ${controlRange("sectionGap23","Espaço entre seções",8,64,2,"px")}
      ${controlSelect("alignment23","Alinhamento",[["left","Esquerda"],["center","Centralizado"]])}
    </div>
  </section>`;
  panels.append(layoutPanel);

  function controlRange(id,label,min,max,step,unit){
    return `<div class="component-control"><strong>${label}</strong>
      <input id="${id}" type="range" min="${min}" max="${max}" step="${step}">
      <div class="range-readout"><span>Menor</span><b id="${id}Value"></b><span>Maior</span></div></div>`;
  }
  function controlSelect(id,label,options){
    return `<div class="component-control"><label for="${id}">${label}</label>
      <select id="${id}">${options.map(([v,t])=>`<option value="${v}">${t}</option>`).join("")}</select></div>`;
  }

  const navItems=[
    ["modelos","Modelos"],["identidade","Cores e fontes"],["componentes","Botões e cards"],
    ["layout","Layout"],["imagens","Imagens"]
  ];
  navItems.forEach(([id,label],i)=>{
    const b=document.createElement("button");
    b.type="button"; b.dataset.target=id; b.textContent=label;
    if(i===0)b.classList.add("is-active");
    b.addEventListener("click",()=>activate(id,b));
    nav.append(b);
  });
  $$(".appearance-panel",panels).forEach(p=>p.classList.remove("is-active"));
  modelsPanel.classList.add("is-active");

  function activate(id,button){
    $$(".appearance-panel",panels).forEach(p=>p.classList.toggle("is-active",p.dataset.panel===id));
    $$("button",nav).forEach(b=>b.classList.toggle("is-active",b===button));
  }

  const models=[
    {name:"Minimal",desc:"Limpo e objetivo.",font:"Inter",theme:"claro",colors:["#111827","#E5E7EB","#111827","#111827","#6B7280","#F9FAFB"],visual:{buttonStyle:"rounded",buttonRadius:10,cardRadius:14,shadow:"soft",sectionGap:24,contentWidth:1120,cardBorder:1,alignment:"left"}},
    {name:"Elegante",desc:"Refinado e editorial.",font:"Playfair Display",theme:"claro",colors:["#1C1917","#D6D3D1","#292524","#1C1917","#B08D57","#FAFAF9"],visual:{buttonStyle:"square",buttonRadius:2,cardRadius:6,shadow:"none",sectionGap:36,contentWidth:1040,cardBorder:1,alignment:"center"}},
    {name:"Moderno",desc:"Atual e versátil.",font:"Poppins",theme:"claro",colors:["#0F172A","#CBD5E1","#0F172A","#2563EB","#22C55E","#F8FAFC"],visual:{buttonStyle:"rounded",buttonRadius:14,cardRadius:20,shadow:"media",sectionGap:28,contentWidth:1200,cardBorder:0,alignment:"left"}},
    {name:"Escuro",desc:"Contraste e presença.",font:"DM Sans",theme:"escuro",colors:["#B8DBC3","#173C2C","#F5F4ED","#B8DBC3","#D6A85F","#07140F"],visual:{buttonStyle:"rounded",buttonRadius:12,cardRadius:18,shadow:"strong",sectionGap:26,contentWidth:1160,cardBorder:1,alignment:"left"}},
    {name:"Vintage",desc:"Personalidade clássica.",font:"Cinzel",theme:"claro",colors:["#5B3A29","#BFA37A","#2F241E","#5B3A29","#A66A3F","#F3EBDD"],visual:{buttonStyle:"square",buttonRadius:4,cardRadius:8,shadow:"soft",sectionGap:34,contentWidth:1080,cardBorder:2,alignment:"center"}},
    {name:"Premium",desc:"Luxo discreto.",font:"Cormorant Garamond",theme:"escuro",colors:["#D4AF37","#2A2418","#F8F3E3","#D4AF37","#E7C86E","#0D0B08"],visual:{buttonStyle:"pill",buttonRadius:40,cardRadius:22,shadow:"media",sectionGap:40,contentWidth:1100,cardBorder:1,alignment:"center"}}
  ];
  const grid=$("#modelGrid23");
  models.forEach(model=>{
    const b=document.createElement("button");
    b.type="button"; b.className="model-card-23";
    b.innerHTML=`<span class="model-swatch-23">${model.colors.slice(0,5).map(c=>`<i style="background:${c}"></i>`).join("")}</span>
      <span class="model-copy-23"><strong>${model.name}</strong><small>${model.desc}</small></span>`;
    b.addEventListener("click",()=>{
      $$(".model-card-23",grid).forEach(x=>x.classList.toggle("is-active",x===b));
      applyModel(model); setDirty();
    });
    grid.append(b);
  });
  function applyModel(model){
    setField("tema",model.theme);
    setField("fonte",model.font);
    const sf=$("#selectedFontName"); if(sf) sf.textContent=model.font;
    ["corPrimariaText","corSecundariaText","corTextoText","corBotaoText","corDestaqueText","corFundoText"]
      .forEach((id,i)=>setField(id,model.colors[i]));
    Object.entries(model.visual).forEach(([key,val])=>{
      const map={buttonStyle:"buttonStyle23",buttonRadius:"buttonRadius23",cardRadius:"cardRadius23",shadow:"shadow23",sectionGap:"sectionGap23",contentWidth:"contentWidth23",cardBorder:"cardBorder23",alignment:"alignment23"};
      if(map[key]) setField(map[key],val);
    });
    updateReadouts(); applyPreview();
  }

  const bottom=document.createElement("div");
  bottom.className="appearance-bottom-bar";
  bottom.innerHTML=`<span class="appearance-status">Preview em tempo real</span>
    <button id="cancelChanges23" class="button button-secondary" type="button">Cancelar alterações</button>
    <button id="restoreDefaults23" class="button button-secondary" type="button">Restaurar</button>
    <button id="saveChanges23" class="button button-primary" type="button">Salvar alterações</button>`;
  form.append(bottom);

  function updateReadouts(){
    [["buttonRadius23","px"],["cardRadius23","px"],["cardBorder23","px"],["sectionGap23","px"],["contentWidth23","px"]]
      .forEach(([id,u])=>{const input=$("#"+id),out=$("#"+id+"Value");if(input&&out)out.textContent=input.value+u;});
  }
  function applyPreview(){
    const visual=readVisual();
    const doc=preview.contentDocument;
    if(!doc) return;
    const root=doc.documentElement;
    root.style.setProperty("--misarte-button-radius", visual.buttonStyle==="pill"?"999px":visual.buttonStyle==="square"?"0px":visual.buttonRadius+"px");
    root.style.setProperty("--misarte-card-radius",visual.cardRadius+"px");
    root.style.setProperty("--misarte-section-gap",visual.sectionGap+"px");
    root.style.setProperty("--misarte-content-width",visual.contentWidth+"px");
    root.style.setProperty("--misarte-card-border",visual.cardBorder+"px");
    const shadow={none:"none",soft:"0 8px 24px rgba(0,0,0,.10)",media:"0 16px 42px rgba(0,0,0,.18)",strong:"0 24px 70px rgba(0,0,0,.30)"}[visual.shadow];
    root.style.setProperty("--misarte-card-shadow",shadow);
    let style=$("#misarteEditorPreviewStyles",doc);
    if(!style){style=doc.createElement("style");style.id="misarteEditorPreviewStyles";doc.head.append(style);}
    style.textContent=`
      main,.container,.content,.page-content{max-width:var(--misarte-content-width)!important}
      section{margin-bottom:var(--misarte-section-gap)!important}
      button,.button,.btn,a[class*="button"],a[class*="btn"]{border-radius:var(--misarte-button-radius)!important}
      .card,[class*="card"],article{border-radius:var(--misarte-card-radius)!important;box-shadow:var(--misarte-card-shadow)!important;border-width:var(--misarte-card-border)!important}
      h1,h2,h3,.hero{text-align:${visual.alignment}!important}`;
  }

  ["input","change"].forEach(evt=>form.addEventListener(evt,e=>{
    if(e.target.closest(".appearance-bottom-bar")) return;
    updateReadouts(); setDirty(); setTimeout(applyPreview,0);
  }));
  preview.addEventListener("load",()=>setTimeout(applyPreview,80));

  $("#cancelChanges23").addEventListener("click",()=>{applyState(sessionStart);setDirty(false);});
  $("#restoreDefaults23").addEventListener("click",()=>{applyState({visual:defaults});setDirty();});
  $("#saveChanges23").addEventListener("click",()=>{
    savedVisual=readVisual();
    localStorage.setItem(storageKey,JSON.stringify(savedVisual));
    $("#saveButton")?.click();
    setDirty(false);
  });
  window.addEventListener("beforeunload",e=>{if(dirty){e.preventDefault();e.returnValue="";}});

  Object.entries({
    buttonRadius23:savedVisual.buttonRadius,cardRadius23:savedVisual.cardRadius,sectionGap23:savedVisual.sectionGap,
    contentWidth23:savedVisual.contentWidth,shadow23:savedVisual.shadow,buttonStyle23:savedVisual.buttonStyle,
    cardBorder23:savedVisual.cardBorder,alignment23:savedVisual.alignment
  }).forEach(([id,val])=>{const n=$("#"+id);if(n)n.value=val;});
  updateReadouts();
  setTimeout(()=>{sessionStart=capture();applyPreview();},900);
})();
