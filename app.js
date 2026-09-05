const toggle = document.getElementById('menuToggle');
const nav = document.getElementById('siteNav');

toggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
});

nav?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  });
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Splash screen
const returnFromProject =
  new URLSearchParams(window.location.search).get('origem') === 'projeto';

const splash = document.getElementById('splash');

if (returnFromProject) {
  splash?.classList.add('hide');
  document.body.classList.remove('splash-active');
} else {
  document.body.classList.add('splash-active');

  window.addEventListener('load', () => {
    setTimeout(() => {
      splash?.classList.add('hide');
      document.body.classList.remove('splash-active');
    }, 2050);
  });
}

// Compact navbar on scroll
const header = document.querySelector('.site-header');
const updateHeader = () => {
  header?.classList.toggle('compact', window.scrollY > 24);
};
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

// Subtle green particles
const canvas = document.getElementById('particles');
const ctx = canvas?.getContext('2d');
let dots = [];
let rafId;

function resizeParticles(){
  if(!canvas || !ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const amount = Math.min(34, Math.max(14, Math.round(innerWidth / 55)));
  dots = Array.from({length:amount}, () => ({
    x:Math.random()*innerWidth,
    y:Math.random()*innerHeight,
    r:Math.random()*1.4+.35,
    vx:(Math.random()-.5)*.12,
    vy:(Math.random()-.5)*.12,
    a:Math.random()*.22+.04
  }));
}

function drawParticles(){
  if(!canvas || !ctx) return;
  ctx.clearRect(0,0,innerWidth,innerHeight);
  for(const d of dots){
    d.x += d.vx; d.y += d.vy;
    if(d.x < -10) d.x = innerWidth+10;
    if(d.x > innerWidth+10) d.x = -10;
    if(d.y < -10) d.y = innerHeight+10;
    if(d.y > innerHeight+10) d.y = -10;
    ctx.beginPath();
    ctx.fillStyle = `rgba(79,197,140,${d.a})`;
    ctx.arc(d.x,d.y,d.r,0,Math.PI*2);
    ctx.fill();
  }
  rafId = requestAnimationFrame(drawParticles);
}

if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  resizeParticles();
  drawParticles();
  window.addEventListener('resize', resizeParticles);
}

// Better touch feedback on mobile
document.querySelectorAll('.feature-card,.project-card,.cta-card').forEach(el => {
  el.addEventListener('touchstart', () => el.classList.add('touch-active'), {passive:true});
  el.addEventListener('touchend', () => el.classList.remove('touch-active'), {passive:true});
});


// =========================================================
// MisArte Digital v3.1.0 — Projetos dinâmicos via Supabase
// =========================================================
const SUPABASE_URL = "https://sflpvafkopvngciojaqe.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_3fRcC4NF1Ni4fBm2JGmxwA_MAC-AR1B";

const projectsDynamic = document.getElementById('projectsDynamic');

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function projectUrlWithOrigin(url) {
  try {
    const parsed = new URL(url, window.location.href);
    parsed.searchParams.set('origem', 'misarte');
    return parsed.href;
  } catch {
    return url;
  }
}

function projectCover(client) {
  const slug = String(client.slug || '').trim();

  if (slug === 'cervejaria-inconfidentes') {
    return './cervejaria-inconfidentes/pages/pagina-01.webp';
  }

  return client.logo || './assets/misarte-monograma-oficial.png';
}

function renderProjects(clients) {
  if (!projectsDynamic || !Array.isArray(clients) || clients.length === 0) return;

  projectsDynamic.innerHTML = clients.map((client, index) => {
    const name = escapeHtml(client.nome || client.empresa || 'Projeto MisArte');
    const category = escapeHtml((client.categoria || 'PROJETO DIGITAL').toUpperCase());
    const catalogUrl = projectUrlWithOrigin(client.url_catalogo || '#');
    const cover = projectCover(client);
    const featured = client.destaque === true;

    return `
      <article class="project-card reveal visible${featured ? ' is-featured' : ''}">
        <div class="project-visual">
          <img
            src="${escapeHtml(cover)}"
            alt="Capa do projeto ${name}"
            loading="${index === 0 ? 'eager' : 'lazy'}"
            onerror="this.onerror=null;this.src='./cervejaria-inconfidentes/pages/pagina-01.webp';"
          >
        </div>

        <div class="project-copy">
         <p class="project-tag" data-i18n="projectTag">${category} · EXPERIÊNCIA DIGITAL</p>
<h3>${name}</h3>
<p data-i18n="projectCardDescription">Projeto digital desenvolvido para valorizar a identidade da marca, facilitar a navegação e permitir atualizações contínuas.</p>

<div class="project-highlights">
  <span data-i18n="projectBadgeMobile">Navegação mobile</span>
 <span data-i18n="projectBadgeLink">Link permanente</span>
  <span data-i18n="featureUpdatesBadge">Atualização contínua</span>
</div>

<a class="text-link" href="${escapeHtml(catalogUrl)}">
  <span data-i18n="projectExplore">Explorar projeto</span> <span>→</span>
</a>
        </div>
      </article>
    `;
  }).join('');
  const currentLanguage = localStorage.getItem("misarteLanguage") || "pt-BR";
setLanguage(currentLanguage);
}

async function loadProjectsFromSupabase() {
  if (!projectsDynamic) return;

  const endpoint =
    `${SUPABASE_URL}/rest/v1/clientes` +
    '?select=nome,slug,empresa,categoria,logo,url_catalogo,status,destaque,ordem' +
    '&status=eq.ativo&order=ordem.asc';

  try {
    const response = await fetch(endpoint, {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Supabase respondeu com status ${response.status}`);
    }

    const clients = await response.json();
    renderProjects(clients);
  } catch (error) {
    // O projeto estático permanece visível como fallback.
    console.warn('MisArte: não foi possível carregar os projetos do Supabase.', error);
  }
}

loadProjectsFromSupabase();
// Idiomas PT-BR / ES-ES
const languageButtons = document.querySelectorAll(".language-btn");

const testTranslations = {
 "pt-BR": {
  navPlatform: "Plataforma",
  navProject: "Projeto",
  navPrinciples: "Princípios",
  navContact: "Contato",
  heroEyebrow: "PLATAFORMA DE EXPERIÊNCIAS DIGITAIS",
  heroTagline: "Sua marca merece ser vivida.",
  heroDescription: "Criamos experiências digitais que aproximam pessoas, produtos e marcas.",
  heroPlatformButton: "Conheça a plataforma",
  heroProjectButton: "Ver último projeto publicado",
  platformEyebrow: "POSSIBILIDADES",
  platformTitle: "O que sua marca pode se tornar.",
  featureExperiencesTitle: "Experiências digitais",
  featureExperiencesText: "Muito além de um catálogo. Criamos experiências que despertam curiosidade, facilitam a navegação e valorizam cada detalhe.",
   featureIdentityTitle: "Identidade",
   featureIdentityText: "Cada projeto possui personalidade própria. Sua empresa nunca será apenas mais uma dentro de um modelo genérico.",
   featureUpdatesTitle: "Atualização contínua",
   featureUpdatesBadge: "Atualização contínua",
   featureUpdatesText: "Seu conteúdo evolui sem exigir um novo QR Code. O endereço permanece; a experiência fica sempre atualizada.",
   featureDesignTitle: "Design estratégico",
   featureDesignText: "Cada botão, cor, movimento e espaço tem uma função. Design bonito, mas sempre pensado para gerar resultado.",
   projectEyebrow: "PROJETO EM DESTAQUE",
   projectTag: "CERVEJARIA · EXPERIÊNCIA DIGITAL",
   projectTitle: "Último projeto publicado.",
   projectDescription: "Uma experiência digital criada para simplificar a navegação por dezenas de rótulos, preservar a identidade visual e permitir atualizações sem trocar o QR Code.",
   projectCardDescription: "Projeto digital desenvolvido para valorizar a identidade da marca, facilitar a navegação e permitir atualizações contínuas.",
   projectBadgeMobile: "Navegação mobile",
   projectBadgeLink: "Link permanente",
   projectBadgeQr: "QR Code permanente",
   projectExplore: "Explorar projeto",
   principlesEyebrow: "NOSSA FORMA DE PENSAR",
   principlesTitle: "Como pensamos.",
   principle1Line1: "Menos interface.",
   principle1Line2: "Mais experiência.",
   principle2Line1: "Cada detalhe",
   principle2Line2: "comunica.",
   principle3Line1: "Tecnologia deve facilitar.",
   principle3Line2: "Nunca complicar.",
   principle4Line1: "Sua marca é única.",
   principle4Line2: "Sua experiência também.",
   contactEyebrow: "VAMOS CONVERSAR",
   contactTitle: "Vamos construir algo que represente sua marca?",
   contactText: "Projetos digitais exclusivos, pensados para a forma como seus clientes descobrem, exploram e vivem a sua empresa.",
   contactButton: "Solicitar um projeto",
   footerTagline: "Sua marca merece ser vivida.",
   footerDescription: "Experiências digitais para empresas que desejam ser lembradas.",
   footerHome: "Início",
   footerProjects: "Projetos"


},
"es-ES": {
  navPlatform: "Plataforma",
  navProject: "Proyecto",
  navPrinciples: "Principios",
  navContact: "Contacto",
  heroEyebrow: "PLATAFORMA DE EXPERIENCIAS DIGITALES",
  heroTagline: "Tu marca merece ser vivida.",
  heroDescription: "Creamos experiencias digitales que acercan personas, productos y marcas.",
  heroPlatformButton: "Conoce la plataforma",
  heroProjectButton: "Ver último proyecto publicado",
  platformEyebrow: "POSIBILIDADES",
  platformTitle: "En lo que puede convertirse tu marca.",
  featureExperiencesTitle: "Experiencias digitales",
  featureExperiencesText: "Mucho más que un catálogo. Creamos experiencias que despiertan curiosidad, facilitan la navegación y realzan cada detalle.",
  featureIdentityTitle: "Identidad",
  featureIdentityText: "Cada proyecto tiene una personalidad propia. Tu empresa nunca será una más dentro de un modelo genérico.",
  featureUpdatesTitle: "Actualización continua",
  featureUpdatesBadge: "Actualización continua",
  featureUpdatesText: "Tu contenido evoluciona sin necesidad de un nuevo código QR. La dirección permanece; la experiencia se mantiene siempre actualizada.",
  featureDesignTitle: "Diseño estratégico",
  featureDesignText: "Cada botón, color, movimiento y espacio tiene una función. Un diseño atractivo, pero siempre pensado para generar resultados.",
  projectEyebrow: "PROYECTO DESTACADO",
  projectTag: "CERVECERÍA · EXPERIENCIA DIGITAL",
  projectTitle: "Último proyecto publicado.",
  projectDescription: "Proyecto digital desarrollado para una empresa brasileña, creado para simplificar la navegación por decenas de etiquetas, preservar la identidad visual y permitir actualizaciones sin cambiar el código QR.",
  projectCardDescription: "Proyecto digital desarrollado para una empresa brasileña, preservando la identidad original de la marca y facilitando la navegación por su catálogo en portugués.",
  projectBadgeMobile: "Navegación móvil",
  projectBadgeLink: "Enlace permanente",
  projectBadgeQr: "Código QR permanente",
  projectExplore: "Explorar proyecto",
  principlesEyebrow: "NUESTRA MANERA DE PENSAR",
  principlesTitle: "Cómo pensamos.",
  principle1Line1: "Menos interfaz.",
  principle1Line2: "Más experiencia.",
  principle2Line1: "Cada detalle",
  principle2Line2: "comunica.",
  principle3Line1: "La tecnología debe facilitar.",
  principle3Line2: "Nunca complicar.",
  principle4Line1: "Tu marca es única.",
  principle4Line2: "Tu experiencia también.",
  contactEyebrow: "TU PROYECTO EMPIEZA AQUÍ",
  contactTitle: "¿Creamos algo que represente tu marca?",
  contactText: "Proyectos digitales exclusivos, pensados para la forma en que tus clientes descubren, exploran y viven tu empresa.",
  contactButton: "Solicitar un proyecto",
  footerTagline: "Tu marca merece ser vivida.",
  footerDescription: "Experiencias digitales para empresas que quieren ser recordadas.",
  footerHome: "Inicio",
  footerProjects: "Proyectos"
 



  
}
};

function setLanguage(language) {
  localStorage.setItem("misarteLanguage", language);
  document.documentElement.lang = language === "es-ES" ? "es" : "pt-BR";

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    const translation = testTranslations[language]?.[key];

    if (translation) {
      element.textContent = translation;
    }
  });

  languageButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === language);
  });

  document.querySelectorAll('a[href*="cervejaria-inconfidentes"]').forEach((link) => {
    const url = new URL(link.href, window.location.href);
    url.searchParams.set("origem", "misarte");
    url.searchParams.set("lang", language);
    link.href = url.href;
  });
}

const urlLanguage = new URLSearchParams(window.location.search).get("lang");
const savedLanguage = localStorage.getItem("misarteLanguage");
const initialLanguage =
  urlLanguage === "es-ES" || urlLanguage === "pt-BR"
    ? urlLanguage
    : savedLanguage === "es-ES" || savedLanguage === "pt-BR"
      ? savedLanguage
      : "pt-BR";

setLanguage(initialLanguage);

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setLanguage(button.dataset.lang);
  });
});