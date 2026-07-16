
const brands=[
 {id:'ouropretana',name:'Ouropretana',start:2,end:12},
 {id:'baden-baden',name:'Baden Baden',start:13,end:17},
 {id:'verace',name:'Verace',start:18,end:29},
 {id:'backer',name:'Backer',start:30,end:40}
];
let current=2;
let currentBrand=brands[0];

const qs=s=>document.querySelector(s);
const app=qs('#app');

function pageFile(n){return `pages/page-${String(n).padStart(2,'0')}.jpg`}
function brandForPage(n){return brands.find(b=>n>=b.start&&n<=b.end)||brands[0]}

function showHome(){
  history.replaceState(null,'','#inicio');
  app.innerHTML=`<section class="home">
    <div class="home-card">
      <h1>Cervejaria Inconfidentes</h1>
      <p>Escolha sua experiência cervejeira</p>
      <div class="brand-grid">
        ${brands.map(b=>`<button class="brand-card" data-brand="${b.id}">${b.name}</button>`).join('')}
      </div>
    </div>
  </section>`;
  document.querySelectorAll('[data-brand]').forEach(btn=>btn.onclick=()=>openBrand(btn.dataset.brand));
}
function openBrand(id){
  currentBrand=brands.find(b=>b.id===id);
  current=currentBrand.start;
  renderViewer();
}
function renderViewer(){
  currentBrand=brandForPage(current);
  history.replaceState(null,'',`#${currentBrand.id}-${current}`);
  app.innerHTML=`<div class="app">
    <header class="topbar">
      <button class="iconbtn" id="homeBtn" aria-label="Início">⌂</button>
      <div class="brand-title">${currentBrand.name}<div class="small">Página ${current-currentBrand.start+1} de ${currentBrand.end-currentBrand.start+1}</div></div>
      <button class="iconbtn" id="menuBtn" aria-label="Rótulos">☰</button>
    </header>
    <main class="viewer">
      <img class="page-img" id="pageImg" src="${pageFile(current)}" alt="Catálogo - ${currentBrand.name}" loading="eager">
    </main>
    <nav class="bottombar">
      <button class="navbtn primary" id="brandsBtn">Marcas</button>
      <button class="navbtn" id="prevBtn" ${current<=currentBrand.start?'disabled':''}>Anterior</button>
      <button class="navbtn" id="listBtn">Rótulos</button>
      <button class="navbtn" id="nextBtn" ${current>=currentBrand.end?'disabled':''}>Próxima</button>
    </nav>
    <aside class="drawer" id="drawer">
      <div class="scrim" id="scrim"></div>
      <div class="panel">
        <h2>${currentBrand.name}</h2>
        <div class="page-list">
          ${Array.from({length:currentBrand.end-currentBrand.start+1},(_,i)=>{
            let p=currentBrand.start+i;
            return `<button class="menu-item ${p===current?'active':''}" data-page="${p}">Rótulo ${i+1}</button>`
          }).join('')}
        </div>
      </div>
    </aside>
  </div>`;
  qs('#homeBtn').onclick=showHome;
  qs('#brandsBtn').onclick=showHome;
  qs('#menuBtn').onclick=openDrawer;
  qs('#listBtn').onclick=openDrawer;
  qs('#scrim').onclick=closeDrawer;
  qs('#prevBtn').onclick=()=>{if(current>currentBrand.start){current--;renderViewer()}};
  qs('#nextBtn').onclick=()=>{if(current<currentBrand.end){current++;renderViewer()}};
  document.querySelectorAll('[data-page]').forEach(btn=>btn.onclick=()=>{current=Number(btn.dataset.page);renderViewer()});
  let x0=null;
  const img=qs('#pageImg');
  img.addEventListener('touchstart',e=>x0=e.touches[0].clientX,{passive:true});
  img.addEventListener('touchend',e=>{
    if(x0===null)return;
    const dx=e.changedTouches[0].clientX-x0;
    if(dx<-55&&current<currentBrand.end){current++;renderViewer()}
    else if(dx>55&&current>currentBrand.start){current--;renderViewer()}
    x0=null;
  },{passive:true});
}
function openDrawer(){qs('#drawer').classList.add('open')}
function closeDrawer(){qs('#drawer').classList.remove('open')}
const hash=location.hash.replace('#','');
if(hash&&hash!=='inicio'){
 const m=hash.match(/^(.+)-(\d+)$/);
 if(m){
   const p=Number(m[2]);
   if(p>=2&&p<=40){current=p;renderViewer()}else showHome();
 }else showHome();
}else showHome();
