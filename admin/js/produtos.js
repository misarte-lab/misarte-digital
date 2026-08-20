(() => {
const db=window.misarteSupabase,p=new URLSearchParams(location.search),clientId=p.get("cliente"),catalogId=p.get("catalogo"),categoryId=p.get("categoria");
const $=s=>document.querySelector(s),e={loader:$("#pageLoader"),app:$("#dashboardApp"),email:$("#userEmail"),logout:$("#logoutButton"),menu:$("#menuButton"),sidebar:$(".sidebar"),clientCrumb:$("#clientBreadcrumb"),catalogCrumb:$("#catalogBreadcrumb"),categoryCrumb:$("#categoryBreadcrumb"),categoryName:$("#categoryName"),categoryMeta:$("#categoryMeta"),total:$("#productTotal"),available:$("#productAvailable"),featured:$("#productFeatured"),search:$("#searchInput"),statusFilter:$("#statusFilter"),sortFilter:$("#sortFilter"),state:$("#productState"),grid:$("#productGrid"),newBtn:$("#newProductButton"),drawer:$("#productDrawer"),backdrop:$("#drawerBackdrop"),close:$("#closeDrawerButton"),cancel:$("#cancelButton"),form:$("#productForm"),id:$("#productId"),name:$("#productName"),price:$("#productPrice"),status:$("#productStatus"),order:$("#productOrder"),featuredInput:$("#productFeatured"),description:$("#productDescription"),imageInput:$("#productImage"),imageCurrent:$("#currentProductImage"),imagePreview:$("#currentProductImagePreview"),removeImage:$("#removeProductImage"),imageStatus:$("#productImageStatus"),title:$("#drawerTitle"),message:$("#formMessage"),save:$("#saveButton"),modal:$("#confirmModal"),confirmText:$("#confirmText"),cancelDelete:$("#cancelDeleteButton"),confirmDelete:$("#confirmDeleteButton"),toast:$("#toast")};
let rows=[],target=null;
const norm=v=>String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
const money=v=>v===null||v===""?"Preço não informado":new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v));
const toast=(m,t="success")=>{e.toast.textContent=m;e.toast.className=`toast ${t}`;e.toast.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>e.toast.hidden=true,3000)};
const optimizeImage=async file=>{
  const bitmap=await createImageBitmap(file),max=1600,scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement("canvas");canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
  canvas.getContext("2d").drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error("Não foi possível otimizar a imagem.")),"image/webp",.82));
  return blob;
};
const uploadImage=async(file,productId)=>{
  const optimized=await optimizeImage(file),path=`${clientId}/catalogos/${catalogId}/produtos/${productId||Date.now()}.webp`;
  const{error}=await db.storage.from("clientes").upload(path,optimized,{contentType:"image/webp",cacheControl:"31536000",upsert:true});
  if(error)throw error;return db.storage.from("clientes").getPublicUrl(path).data.publicUrl;
};
const removeStoredImage=async url=>{
  const marker="/storage/v1/object/public/clientes/",relative=String(url||"").split(marker)[1];
  if(relative)await db.storage.from("clientes").remove([decodeURIComponent(relative)]);
};
const filtered=()=>{const q=norm(e.search.value),s=norm(e.statusFilter.value),sort=e.sortFilter.value;return rows.filter(x=>(!q||norm(`${x.nome} ${x.descricao}`).includes(q))&&(!s||norm(x.status)===s)).sort((a,b)=>sort==="nome"?String(a.nome).localeCompare(String(b.nome),"pt-BR"):sort==="preco"?Number(a.preco||0)-Number(b.preco||0):sort==="recentes"?new Date(b.created_at)-new Date(a.created_at):Number(a.ordem||0)-Number(b.ordem||0))};
function render(){e.total.textContent=rows.length;e.available.textContent=rows.filter(x=>x.status==="disponivel").length;e.featured.textContent=rows.filter(x=>x.destaque===true).length;const list=filtered();if(!list.length){e.state.textContent=rows.length?"Nenhum produto corresponde aos filtros.":"Nenhum produto cadastrado. Clique em “Novo produto” para começar.";e.state.hidden=false;e.grid.hidden=true;return}e.grid.innerHTML=list.map(x=>`<article class="product-card">${x.imagem_url?`<img class="product-card-image" src="${esc(x.imagem_url)}" alt="${esc(x.nome)}" loading="lazy">`:""}<div class="product-card-top"><div><p class="eyebrow">ORDEM ${esc(x.ordem)}</p><h2>${esc(x.nome)}</h2></div><span class="status-badge ${x.status==="disponivel"?"status-active":"status-neutral"}">${x.status==="disponivel"?"Disponível":"Indisponível"}</span></div><p class="product-description">${esc(x.descricao||"Sem descrição.")}</p><div class="product-price">${esc(money(x.preco))}</div><div class="product-flags"><span>Destaque <strong>${x.destaque?"Sim":"Não"}</strong></span></div><div class="client-actions"><button class="button button-secondary" data-action="edit" data-id="${esc(x.id)}">Editar</button><button class="button button-text-danger" data-action="delete" data-id="${esc(x.id)}">Excluir</button></div></article>`).join("");e.state.hidden=true;e.grid.hidden=false}
async function load(){const{data,error}=await db.from("produtos").select("id,categoria_id,nome,descricao,preco,status,destaque,ordem,imagem_url,created_at").eq("categoria_id",categoryId).order("ordem",{ascending:true});if(error){e.state.textContent="Não foi possível carregar os produtos. Execute o SQL da versão v1.6.0.";toast(error.message,"error");return}rows=data||[];render()}
async function context(){const[{data:c,error:ce},{data:g,error:ge},{data:k,error:ke}]=await Promise.all([db.from("clientes").select("id,nome,empresa").eq("id",clientId).single(),db.from("catalogos").select("id,cliente_id,nome").eq("id",catalogId).eq("cliente_id",clientId).single(),db.from("categorias").select("id,catalogo_id,nome,status").eq("id",categoryId).eq("catalogo_id",catalogId).single()]);if(ce)throw ce;if(ge)throw ge;if(ke)throw ke;e.clientCrumb.textContent=c.nome||c.empresa||"Cliente";e.clientCrumb.href=`./cliente.html?id=${encodeURIComponent(clientId)}`;e.catalogCrumb.textContent=g.nome;e.catalogCrumb.href=`./catalogos.html?id=${encodeURIComponent(clientId)}`;e.categoryCrumb.textContent=k.nome;e.categoryCrumb.href=`./categorias.html?cliente=${encodeURIComponent(clientId)}&catalogo=${encodeURIComponent(catalogId)}`;e.categoryName.textContent=k.nome;e.categoryMeta.textContent=`Produtos da categoria · ${k.status}`}
function open(x=null){e.form.reset();e.id.value=x?.id||"";e.name.value=x?.nome||"";e.price.value=x?.preco??"";e.status.value=x?.status||"disponivel";e.order.value=x?.ordem??(rows.length?Math.max(...rows.map(r=>Number(r.ordem||0)))+1:1);e.featuredInput.checked=x?.destaque===true;e.description.value=x?.descricao||"";e.imageCurrent.hidden=!x?.imagem_url;if(x?.imagem_url)e.imagePreview.src=x.imagem_url;e.imageStatus.textContent=x?.imagem_url?"Selecione outra imagem somente para substituir a atual.":"A imagem será otimizada automaticamente antes do envio.";e.title.textContent=x?"Editar produto":"Novo produto";e.save.textContent=x?"Salvar alterações":"Salvar produto";e.message.textContent="";e.backdrop.hidden=false;e.drawer.classList.add("is-open");document.body.classList.add("drawer-open");setTimeout(()=>e.name.focus(),120)}
function close(){e.drawer.classList.remove("is-open");e.backdrop.hidden=true;document.body.classList.remove("drawer-open")}
e.form.addEventListener("submit",async ev=>{
  ev.preventDefault();if(!e.form.checkValidity()){e.form.reportValidity();return}
  e.save.disabled=true;e.save.textContent="Salvando...";
  const id=e.id.value,current=rows.find(item=>String(item.id)===String(id));
  const payload={categoria_id:categoryId,nome:e.name.value.trim(),descricao:e.description.value.trim()||null,preco:e.price.value===""?null:Number(e.price.value),status:e.status.value,destaque:e.featuredInput.checked,ordem:Number(e.order.value||1)};
  try{
    const file=e.imageInput.files?.[0];
    if(file){e.imageStatus.textContent="Otimizando e enviando imagem...";payload.imagem_url=await uploadImage(file,id)}
    else if(e.removeImage.checked)payload.imagem_url=null;
    const q=id?db.from("produtos").update(payload).eq("id",id).eq("categoria_id",categoryId):db.from("produtos").insert(payload),{error}=await q;
    if(error)throw error;
    if(current?.imagem_url&&(payload.imagem_url===null||payload.imagem_url&&payload.imagem_url!==current.imagem_url))await removeStoredImage(current.imagem_url);
    close();await load();toast(id?"Produto atualizado.":"Produto criado.");
  }catch(error){console.error(error);e.message.textContent=error.message||"Não foi possível salvar o produto.";e.message.className="form-message error"}
  finally{e.save.disabled=false;e.save.textContent=id?"Salvar alterações":"Salvar produto"}
});
e.grid.addEventListener("click",ev=>{const b=ev.target.closest("button[data-action]");if(!b)return;const x=rows.find(r=>String(r.id)===b.dataset.id);if(!x)return;if(b.dataset.action==="edit")open(x);else{target=x;e.confirmText.textContent=`Você está prestes a excluir “${x.nome}”.`;e.modal.hidden=false}});
e.confirmDelete.addEventListener("click",async()=>{if(!target)return;const removed=target,{error}=await db.from("produtos").delete().eq("id",target.id).eq("categoria_id",categoryId);e.modal.hidden=true;target=null;if(error){toast(error.message,"error");return}if(removed.imagem_url)await removeStoredImage(removed.imagem_url);await load();toast("Produto excluído.")});
e.cancelDelete.addEventListener("click",()=>{e.modal.hidden=true;target=null});
e.newBtn.addEventListener("click",()=>open());e.close.addEventListener("click",close);e.cancel.addEventListener("click",close);e.backdrop.addEventListener("click",close);
[e.search,e.statusFilter,e.sortFilter].forEach(c=>c.addEventListener(c===e.search?"input":"change",render));
e.menu.addEventListener("click",()=>e.sidebar.classList.toggle("is-open"));e.logout.addEventListener("click",async()=>{await db.auth.signOut();location.replace("./login.html")});
(async()=>{if(!clientId||!catalogId||!categoryId){location.replace("./clientes.html");return}const{data}=await db.auth.getSession();if(!data.session){location.replace("./login.html");return}e.email.textContent=data.session.user.email||"Usuária autenticada";await context();e.loader.hidden=true;e.app.hidden=false;await load()})().catch(err=>{console.error(err);e.loader.hidden=true;e.app.hidden=false;e.state.textContent=err.message||"Não foi possível abrir esta área."});
})();
