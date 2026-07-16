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
document.body.classList.add('splash-active');
window.addEventListener('load', () => {
  const splash = document.getElementById('splash');
  setTimeout(() => {
    splash?.classList.add('hide');
    document.body.classList.remove('splash-active');
  }, 1300);
});

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
