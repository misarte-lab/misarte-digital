const state = { data:null, page:1, currentBrand:null };
const $ = (id) => document.getElementById(id);

const homeView = $("homeView");
const readerView = $("readerView");
const pageImage = $("pageImage");
const bottomNav = $("bottomNav");
const drawer = $("drawer");
const drawerBackdrop = $("drawerBackdrop");
const drawerTitle = $("drawerTitle");
const drawerContent = $("drawerContent");

fetch("catalogo.json")
  .then(r => r.json())
  .then(data => {
    state.data = data;
    renderHome();
    handleInitialRoute();
  })
  .catch(() => {
    document.body.innerHTML = '<div class="loading">Não foi possível carregar o catálogo.</div>';
  });

function renderHome(){
  const grid = $("brandGrid");
  grid.innerHTML = "";
  state.data.fabricantes.forEach(brand => {
    const b = document.createElement("button");
    b.className = "brand-card";
    b.innerHTML = `<strong>${brand.nome}</strong><span>${brand.produtos.length} rótulos</span>`;
    b.addEventListener("click", () => openPage(brand.inicio));
    grid.appendChild(b);
  });
}

function brandForPage(page){
  return state.data.fabricantes.find(b => page >= b.inicio && page <= b.fim) || null;
}
function openHome(push=true){
  state.page = 1;
  state.currentBrand = null;
  homeView.hidden = false;
  readerView.hidden = true;
  bottomNav.hidden = true;
  closeDrawer();
  if(push) history.pushState({view:"home"},"","#inicio");
  window.scrollTo({top:0,behavior:"instant"});
}
function openPage(page,push=true){
  page = Math.max(2, Math.min(40, Number(page)));
  state.page = page;
  state.currentBrand = brandForPage(page);
  homeView.hidden = true;
  readerView.hidden = false;
  bottomNav.hidden = false;
  pageImage.src = `pages/pagina-${String(page).padStart(2,"0")}.webp`;
  pageImage.alt = `${state.currentBrand?.nome || "Catálogo"} - página ${page}`;
  if(push) history.pushState({view:"page",page},"",`#pagina-${page}`);
  window.scrollTo({top:0,behavior:"instant"});
  updateNav();
}
function updateNav(){
  const b = state.currentBrand;
  $("prevBtn").disabled = state.page <= b.inicio;
  $("nextBtn").disabled = state.page >= b.fim;
}
function step(delta){
  const b = state.currentBrand;
  const target = state.page + delta;
  if(target >= b.inicio && target <= b.fim) openPage(target);
}
function renderDrawer(mode="all"){
  drawerContent.innerHTML = "";
  if(mode === "brand" && state.currentBrand){
    drawerTitle.textContent = state.currentBrand.nome;
    addBrandGroup(state.currentBrand);
  } else {
    drawerTitle.textContent = "Marcas e rótulos";
    state.data.fabricantes.forEach(addBrandGroup);
  }
}
function addBrandGroup(brand){
  const group = document.createElement("section");
  group.className = "drawer-group";
  const title = document.createElement("h3");
  title.textContent = brand.nome;
  group.appendChild(title);
  brand.produtos.forEach(p => {
    const btn = document.createElement("button");
    btn.className = "drawer-item" + (p.pagina === state.page ? " active" : "");
    btn.textContent = p.nome;
    btn.addEventListener("click", () => { openPage(p.pagina); closeDrawer(); });
    group.appendChild(btn);
  });
  drawerContent.appendChild(group);
}
function openDrawer(mode="all"){
  renderDrawer(mode);
  drawer.hidden = false;
  drawerBackdrop.hidden = false;
  requestAnimationFrame(() => drawer.classList.add("open"));
  drawer.setAttribute("aria-hidden","false");
}
function closeDrawer(){
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden","true");
  drawerBackdrop.hidden = true;
  setTimeout(()=>{ if(!drawer.classList.contains("open")) drawer.hidden = true; },230);
}
function handleInitialRoute(){
  const m = location.hash.match(/pagina-(\d+)/);
  if(m) openPage(Number(m[1]),false); else openHome(false);
}
$("homeBtn").addEventListener("click",()=>openHome());
$("brandsBtn").addEventListener("click",()=>openHome());
$("prevBtn").addEventListener("click",()=>step(-1));
$("nextBtn").addEventListener("click",()=>step(1));
$("labelsBtn").addEventListener("click",()=>openDrawer("brand"));
$("menuBtn").addEventListener("click",()=>openDrawer("all"));
$("closeDrawer").addEventListener("click",closeDrawer);
drawerBackdrop.addEventListener("click",closeDrawer);
window.addEventListener("popstate",handleInitialRoute);

let x0 = null;
readerView.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, {passive:true});
readerView.addEventListener("touchend", e => {
  if(x0 === null) return;
  const dx = e.changedTouches[0].clientX - x0;
  if(Math.abs(dx) > 55) step(dx < 0 ? 1 : -1);
  x0 = null;
}, {passive:true});