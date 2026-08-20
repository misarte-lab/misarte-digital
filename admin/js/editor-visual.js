(() => {
  const db=window.misarteSupabase,params=new URLSearchParams(location.search);
  const clientId=params.get("cliente"),catalogId=params.get("catalogo"),previewMode=params.get("preview")==="1",previewPageId=params.get("pagina");
  const $=selector=>document.querySelector(selector);
  const el={loader:$("#pageLoader"),app:$("#editorApp"),back:$("#backLink"),catalog:$("#catalogName"),client:$("#clientName"),pages:$("#pagesList"),newPage:$("#newPageButton"),pdfInput:$("#pdfInput"),pdfStatus:$("#pdfStatus"),duplicate:$("#duplicatePageButton"),deletePage:$("#deletePageButton"),empty:$("#emptyCanvas"),shell:$("#canvasShell"),canvas:$("#pageCanvas"),zoomOut:$("#zoomOutButton"),zoomFit:$("#zoomFitButton"),zoomIn:$("#zoomInButton"),zoomLabel:$("#zoomLabel"),pageName:$("#pageName"),pageType:$("#pageType"),background:$("#backgroundInput"),backgroundStatus:$("#backgroundStatus"),savePage:$("#savePageButton"),addButton:$("#addButtonElement"),preview:$("#previewButton"),elementForm:$("#elementProperties"),elementText:$("#elementText"),elementImage:$("#elementImage"),x:$("#elementX"),y:$("#elementY"),width:$("#elementWidth"),height:$("#elementHeight"),destinationType:$("#destinationType"),destinationField:$("#destinationSelectField"),destinationId:$("#destinationId"),destinationUrlField:$("#destinationUrlField"),destinationUrl:$("#destinationUrl"),deleteElement:$("#deleteElementButton"),toast:$("#toast")};
  let pages=[],elements=[],categories=[],products=[],selectedPage=null,selectedElement=null,fitCanvasWidth=470,zoomLevel=1;
  const esc=value=>String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  const toast=(message,type="success")=>{el.toast.textContent=message;el.toast.className=`toast ${type}`;el.toast.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.toast.hidden=true,3200)};
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,Number(value)||0));

  async function optimizeImage(file,max=1800){
    const bitmap=await createImageBitmap(file),scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement("canvas");canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
    canvas.getContext("2d").drawImage(bitmap,0,0,canvas.width,canvas.height);
    bitmap.close();return await new Promise(resolve=>canvas.toBlob(resolve,"image/webp",.9));
  }
  async function uploadImage(file,folder,name){
    if(file.size>12*1024*1024)throw new Error("A imagem deve ter no máximo 12 MB.");
    const blob=await optimizeImage(file),path=`${clientId}/catalogos/${catalogId}/editor/${folder}/${name}-${Date.now()}.webp`;
    const {error}=await db.storage.from("clientes").upload(path,blob,{contentType:"image/webp",upsert:true});if(error)throw error;
    const {data}=db.storage.from("clientes").getPublicUrl(path);return data.publicUrl;
  }
  async function uploadBlob(blob,folder,name){const path=`${clientId}/catalogos/${catalogId}/editor/${folder}/${name}-${Date.now()}.webp`;const {error}=await db.storage.from("clientes").upload(path,blob,{contentType:"image/webp",upsert:true});if(error)throw error;const {data}=db.storage.from("clientes").getPublicUrl(path);return data.publicUrl}
  async function loadContext(){
    const [{data:client,error:clientError},{data:catalog,error:catalogError}]=await Promise.all([
      db.from("clientes").select("id,nome,empresa").eq("id",clientId).single(),
      db.from("catalogos").select("id,cliente_id,nome,status").eq("id",catalogId).eq("cliente_id",clientId).single()
    ]);if(clientError)throw clientError;if(catalogError)throw catalogError;
    el.catalog.textContent=catalog.nome;el.client.textContent=`${client.nome||client.empresa||"Cliente"} · ${catalog.status}`;
    el.back.href=`./catalogos.html?id=${encodeURIComponent(clientId)}`;
  }
  async function loadDestinations(){
    const {data:categoryRows}=await db.from("categorias").select("id,nome").eq("catalogo_id",catalogId).order("ordem");categories=categoryRows||[];
    if(categories.length){const {data:productRows}=await db.from("produtos").select("id,categoria_id,nome").in("categoria_id",categories.map(item=>item.id)).order("ordem");products=productRows||[]}
  }
  async function loadPages(selectId=null){
    const {data,error}=await db.from("catalogo_paginas").select("id,catalogo_id,nome,tipo,fundo_url,largura,altura,ordem,status").eq("catalogo_id",catalogId).order("ordem");
    if(error)throw new Error("Execute o SQL v1.7.0-editor-visual no Supabase antes de abrir o editor.");pages=data||[];renderPageList();
    const desired=selectId||previewPageId||selectedPage?.id||pages[0]?.id;if(desired)await selectPage(desired);else clearCanvas();
  }
  function renderPageList(){el.pages.innerHTML=pages.length?pages.map((page,index)=>`<button class="page-list-item ${String(page.id)===String(selectedPage?.id)?"active":""}" data-page-id="${esc(page.id)}"><span class="page-number">${index+1}</span><span>${esc(page.nome)}</span></button>`).join(""):'<div class="editor-empty">Nenhuma página.</div>'}
  async function selectPage(id){
    selectedPage=pages.find(page=>String(page.id)===String(id));selectedElement=null;if(!selectedPage)return;
    el.pageName.value=selectedPage.nome;el.pageType.value=selectedPage.tipo;el.backgroundStatus.textContent=selectedPage.fundo_url?"Arte de fundo carregada.":"Envie PNG, JPG ou WebP.";
    const pageRatio=selectedPage.largura/selectedPage.altura,availableHeight=Math.max(420,window.innerHeight-235);
    fitCanvasWidth=Math.min(620,availableHeight*pageRatio);zoomLevel=1;applyZoom();
    el.canvas.style.aspectRatio=`${selectedPage.largura}/${selectedPage.altura}`;el.canvas.style.backgroundImage=selectedPage.fundo_url?`url("${selectedPage.fundo_url}")`:"none";
    el.empty.hidden=true;el.shell.hidden=false;el.duplicate.disabled=false;el.deletePage.disabled=false;el.elementForm.hidden=true;renderPageList();await loadElements();
  }
  function applyZoom(){const percent=Math.round(zoomLevel*100);el.shell.style.width=`${Math.round(fitCanvasWidth*zoomLevel)}px`;el.zoomLabel.textContent=`${percent}%`;el.zoomOut.disabled=zoomLevel<=.5;el.zoomIn.disabled=zoomLevel>=2}
  function changeZoom(amount){zoomLevel=clamp(zoomLevel+amount,.5,2);applyZoom()}
  function clearCanvas(){selectedPage=null;selectedElement=null;el.empty.hidden=false;el.shell.hidden=true;el.duplicate.disabled=true;el.deletePage.disabled=true;el.elementForm.hidden=true;renderPageList()}
  async function loadElements(){const {data,error}=await db.from("pagina_elementos").select("*").eq("pagina_id",selectedPage.id).order("ordem");if(error)throw error;elements=data||[];renderElements()}
  function renderElements(){
    el.canvas.innerHTML=elements.map(item=>`<div class="visual-element ${String(item.id)===String(selectedElement?.id)?"selected":""}" data-element-id="${esc(item.id)}" style="left:${item.posicao_x}%;top:${item.posicao_y}%;width:${item.largura}%;height:${item.altura}%">${item.imagem_url?`<img src="${esc(item.imagem_url)}" alt="">`:`<span>${esc(item.conteudo||"Botão")}</span>`}</div>`).join("");
    el.canvas.querySelectorAll(".visual-element").forEach(node=>previewMode?enablePreviewAction(node):enableDrag(node));
  }
  function enablePreviewAction(node){node.addEventListener("click",async()=>{const item=elements.find(value=>String(value.id)===String(node.dataset.elementId));if(!item)return;if(item.destino_tipo==="pagina"&&item.destino_id){await selectPage(item.destino_id);return}if(item.destino_tipo==="url"&&item.destino_url){window.open(item.destino_url,"_blank","noopener");return}if(item.destino_tipo==="categoria"||item.destino_tipo==="produto")toast("O destino está configurado e será ativado na página pública final.")})}
  function enableDrag(node){
    node.addEventListener("pointerdown",event=>{event.preventDefault();selectElement(node.dataset.elementId);const rect=el.canvas.getBoundingClientRect(),item=elements.find(value=>String(value.id)===String(node.dataset.elementId));const startX=event.clientX,startY=event.clientY,originX=Number(item.posicao_x),originY=Number(item.posicao_y);node.setPointerCapture(event.pointerId);
      const move=moveEvent=>{item.posicao_x=clamp(originX+(moveEvent.clientX-startX)/rect.width*100,0,100-Number(item.largura));item.posicao_y=clamp(originY+(moveEvent.clientY-startY)/rect.height*100,0,100-Number(item.altura));node.style.left=`${item.posicao_x}%`;node.style.top=`${item.posicao_y}%`;el.x.value=item.posicao_x.toFixed(1);el.y.value=item.posicao_y.toFixed(1)};
      const up=async()=>{node.removeEventListener("pointermove",move);node.removeEventListener("pointerup",up);await db.from("pagina_elementos").update({posicao_x:item.posicao_x,posicao_y:item.posicao_y}).eq("id",item.id)};
      node.addEventListener("pointermove",move);node.addEventListener("pointerup",up);
    });
  }
  function selectElement(id){selectedElement=elements.find(item=>String(item.id)===String(id));if(!selectedElement)return;el.elementForm.hidden=false;el.elementText.value=selectedElement.conteudo||"";el.x.value=selectedElement.posicao_x;el.y.value=selectedElement.posicao_y;el.width.value=selectedElement.largura;el.height.value=selectedElement.altura;el.destinationType.value=selectedElement.destino_tipo||"nenhum";el.destinationUrl.value=selectedElement.destino_url||"";updateDestinationOptions(selectedElement.destino_id);renderElements()}
  function updateDestinationOptions(selectedId=null){
    const type=el.destinationType.value;el.destinationField.hidden=!['pagina','categoria','produto'].includes(type);el.destinationUrlField.hidden=type!=="url";
    const rows=type==="pagina"?pages:type==="categoria"?categories:type==="produto"?products:[];el.destinationId.innerHTML=rows.map(item=>`<option value="${esc(item.id)}">${esc(item.nome)}</option>`).join("");if(selectedId)el.destinationId.value=selectedId;
  }
  async function createPage(){const order=pages.length?Math.max(...pages.map(page=>Number(page.ordem)))+1:1;const {data,error}=await db.from("catalogo_paginas").insert({catalogo_id:catalogId,nome:order===1?"Capa":`Página ${order}`,tipo:order===1?"capa":"conteudo",ordem:order}).select().single();if(error){toast(error.message,"error");return}await loadPages(data.id);toast("Página criada.")}
  async function importPdf(){
    const file=el.pdfInput.files[0];if(!file)return;if(file.size>50*1024*1024){toast("O PDF deve ter no máximo 50 MB para esta importação.","error");el.pdfInput.value="";return}
    el.pdfInput.disabled=true;try{window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";el.pdfStatus.textContent="Abrindo o PDF...";const pdf=await window.pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;const reusable=pages.length===1&&!pages[0].fundo_url&&elements.length===0?pages[0]:null;let firstId=null;
      for(let index=1;index<=pdf.numPages;index++){el.pdfStatus.textContent=`Convertendo página ${index} de ${pdf.numPages}...`;const pdfPage=await pdf.getPage(index),base=pdfPage.getViewport({scale:1}),scale=Math.min(2,1600/base.width),viewport=pdfPage.getViewport({scale});const canvas=document.createElement("canvas");canvas.width=Math.round(viewport.width);canvas.height=Math.round(viewport.height);await pdfPage.render({canvasContext:canvas.getContext("2d"),viewport}).promise;const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/webp",.9));
        let pageId;if(index===1&&reusable){pageId=reusable.id}else{const order=pages.length+index-(reusable?1:0);const {data,error}=await db.from("catalogo_paginas").insert({catalogo_id:catalogId,nome:index===1?"Capa":`Página ${index}`,tipo:index===1?"capa":"conteudo",ordem:order,largura:canvas.width,altura:canvas.height}).select().single();if(error)throw error;pageId=data.id}
        const url=await uploadBlob(blob,"pdf",`pagina-${pageId}`);const {error:updateError}=await db.from("catalogo_paginas").update({nome:index===1?"Capa":`Página ${index}`,tipo:index===1?"capa":"conteudo",fundo_url:url,largura:canvas.width,altura:canvas.height}).eq("id",pageId).eq("catalogo_id",catalogId);if(updateError)throw updateError;if(!firstId)firstId=pageId;canvas.width=1;canvas.height=1;
      }
      el.pdfStatus.textContent=`PDF importado: ${pdf.numPages} página(s).`;el.pdfInput.value="";await loadPages(firstId);toast("PDF transformado em páginas visuais.")
    }catch(error){console.error(error);el.pdfStatus.textContent="Não foi possível importar o PDF.";toast(error.message||"Não foi possível importar o PDF.","error")}finally{el.pdfInput.disabled=false}
  }
  async function savePage(){if(!selectedPage)return;el.savePage.disabled=true;try{const payload={nome:el.pageName.value.trim()||"Página sem nome",tipo:el.pageType.value};const file=el.background.files[0];if(file){el.backgroundStatus.textContent="Enviando arte...";payload.fundo_url=await uploadImage(file,"paginas",selectedPage.id)}const {error}=await db.from("catalogo_paginas").update(payload).eq("id",selectedPage.id).eq("catalogo_id",catalogId);if(error)throw error;el.background.value="";await loadPages(selectedPage.id);toast("Página salva.")}catch(error){toast(error.message,"error")}finally{el.savePage.disabled=false}}
  async function duplicatePage(){if(!selectedPage)return;const order=pages.length?Math.max(...pages.map(page=>Number(page.ordem)))+1:1;const {data,error}=await db.from("catalogo_paginas").insert({catalogo_id:catalogId,nome:`${selectedPage.nome} — cópia`,tipo:selectedPage.tipo,fundo_url:selectedPage.fundo_url,largura:selectedPage.largura,altura:selectedPage.altura,ordem:order,status:selectedPage.status}).select().single();if(error){toast(error.message,"error");return}if(elements.length){const copies=elements.map(({id,created_at,updated_at,...item})=>({...item,pagina_id:data.id}));const {error:elementsError}=await db.from("pagina_elementos").insert(copies);if(elementsError){toast(elementsError.message,"error");return}}await loadPages(data.id);toast("Página duplicada com todos os elementos.")}
  async function deletePage(){if(!selectedPage||!confirm(`Excluir “${selectedPage.nome}” e todos os elementos desta página?`))return;const {error}=await db.from("catalogo_paginas").delete().eq("id",selectedPage.id).eq("catalogo_id",catalogId);if(error){toast(error.message,"error");return}selectedPage=null;await loadPages();toast("Página excluída.")}
  async function addButton(){if(!selectedPage)return;const {data,error}=await db.from("pagina_elementos").insert({pagina_id:selectedPage.id,tipo:"botao",conteudo:"Novo botão",posicao_x:30,posicao_y:15,largura:40,altura:8,ordem:elements.length+1}).select().single();if(error){toast(error.message,"error");return}await loadElements();selectElement(data.id);toast("Botão criado. Arraste para posicionar.")}
  async function saveElement(event){event.preventDefault();if(!selectedElement)return;const payload={conteudo:el.elementText.value.trim()||"Botão",posicao_x:clamp(el.x.value,0,98),posicao_y:clamp(el.y.value,0,98),largura:clamp(el.width.value,2,100),altura:clamp(el.height.value,2,100),destino_tipo:el.destinationType.value,destino_id:['pagina','categoria','produto'].includes(el.destinationType.value)?el.destinationId.value||null:null,destino_url:el.destinationType.value==="url"?el.destinationUrl.value.trim()||null:null};
    try{const file=el.elementImage.files[0];if(file)payload.imagem_url=await uploadImage(file,"elementos",selectedElement.id);const {error}=await db.from("pagina_elementos").update(payload).eq("id",selectedElement.id).eq("pagina_id",selectedPage.id);if(error)throw error;el.elementImage.value="";await loadElements();selectElement(selectedElement.id);toast("Botão salvo.")}catch(error){toast(error.message,"error")}}
  async function deleteElement(){if(!selectedElement||!confirm("Excluir este botão?"))return;const {error}=await db.from("pagina_elementos").delete().eq("id",selectedElement.id);if(error){toast(error.message,"error");return}selectedElement=null;el.elementForm.hidden=true;await loadElements();toast("Botão excluído.")}
  function openPreview(){if(!selectedPage){toast("Crie uma página primeiro.","error");return}window.open(`./editor-visual.html?cliente=${encodeURIComponent(clientId)}&catalogo=${encodeURIComponent(catalogId)}&pagina=${encodeURIComponent(selectedPage.id)}&preview=1`,"_blank","noopener")}
  async function start(){if(!clientId||!catalogId){location.replace("./clientes.html");return}const {data}=await db.auth.getSession();if(!data.session){location.replace("./login.html");return}await Promise.all([loadContext(),loadDestinations()]);await loadPages();el.loader.hidden=true;el.app.hidden=false;if(previewMode){document.body.classList.add("visual-preview-only");el.canvas.querySelectorAll(".visual-element").forEach(node=>node.style.cursor="pointer")}}
  el.pages.addEventListener("click",event=>{const button=event.target.closest("[data-page-id]");if(button)selectPage(button.dataset.pageId)});el.newPage.addEventListener("click",createPage);el.pdfInput.addEventListener("change",importPdf);el.savePage.addEventListener("click",savePage);el.duplicate.addEventListener("click",duplicatePage);el.deletePage.addEventListener("click",deletePage);el.addButton.addEventListener("click",addButton);el.elementForm.addEventListener("submit",saveElement);el.deleteElement.addEventListener("click",deleteElement);el.destinationType.addEventListener("change",()=>updateDestinationOptions());el.preview.addEventListener("click",openPreview);el.zoomOut.addEventListener("click",()=>changeZoom(-.25));el.zoomFit.addEventListener("click",()=>{zoomLevel=1;applyZoom()});el.zoomIn.addEventListener("click",()=>changeZoom(.25));
  start().catch(error=>{console.error(error);el.loader.querySelector("span").textContent=error.message||"Não foi possível abrir o editor."});
})();
