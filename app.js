/* =========================================================
   SÍTIO ESPERANÇA • app.js
   Carrossel, catálogo, favoritos, zoom, navegação e PWA
   ========================================================= */

/* ---------- Configuração ---------- */
const WA  = '5531982517147';
const PIX = '31982517147'; // chave PIX = mesmo número do WhatsApp

const waGeral = `https://wa.me/${WA}?text=${encodeURIComponent(
  'Olá! Vim pelo site do Sítio Esperança e quero saber mais sobre os filhotes disponíveis.'
)}`;

/* ---------- Dados ---------- */
const coelhos = [
  { id:1,  nome:'Pingo',   raca:'Holandês',   dias:60, sexo:'M', cor:'Preto e branco', preco:80,  seed:'coelho-pingo'   },
  { id:2,  nome:'Tico',    raca:'Fuzzy Lop',  dias:55, sexo:'M', cor:'Creme',          preco:90,  seed:'coelho-tico'    },
  { id:3,  nome:'Botão',   raca:'Lion',       dias:45, sexo:'M', cor:'Caramelo',       preco:120, seed:'coelho-botao'   },
  { id:4,  nome:'Canjica', raca:'Lion',       dias:50, sexo:'F', cor:'Bege',           preco:120, seed:'coelho-canjica' },
  { id:5,  nome:'Pipoca',  raca:'Mini Lop',   dias:50, sexo:'F', cor:'Cinza claro',    preco:140, seed:'coelho-pipoca'  },
  { id:6,  nome:'Mel',     raca:'Mini Lop',   dias:55, sexo:'F', cor:'Marrom mel',     preco:150, seed:'coelho-mel'     },
  { id:7,  nome:'Açaí',    raca:'Rex',        dias:50, sexo:'M', cor:'Azulado',        preco:160, seed:'coelho-acai'    },
  { id:8,  nome:'Cacau',   raca:'Rex',        dias:70, sexo:'F', cor:'Marrom cacau',   preco:130, seed:'coelho-cacau'   },
  { id:9,  nome:'Nuvem',   raca:'Angorá',     dias:60, sexo:'F', cor:'Branca',         preco:180, seed:'coelho-nuvem'   },
  { id:10, nome:'Bela',    raca:'Mini Lop',   dias:75, sexo:'F', cor:'Chinchila',      preco:200, seed:'coelho-bela'    },
];

const slides = [
  { img:'https://picsum.photos/seed/coelhos-palha/900/600.jpg', alt:'Filhotes de coelhos na palha',
    kicker:'Filhotes disponíveis agora',
    title:'COELHOS À VENDA<br>A PARTIR DE <span class="text-areia">R$ 80</span>',
    sub:'Filhotes saudáveis, vacinados e cheios de colo',
    cta:{ label:'VER CATÁLOGO', go:1 } },
  { img:'https://picsum.photos/seed/coelho-entrega/900/600.jpg', alt:'Coelho pronto para entrega',
    kicker:'Entregas',
    title:'ENTREGAMOS ATÉ 100 KM',
    sub:'Miguel Burnier, Ouro Preto, Mariana e região',
    cta:{ label:'PEDIR NO WHATSAPP', wa:true } },
  { img:'https://picsum.photos/seed/coelho-manso/900/600.jpg', alt:'Coelho manso no colo',
    kicker:'Reserva',
    title:'RESERVE COM 30% DE SINAL',
    sub:'Chave PIX = WhatsApp (31) 98251-7147',
    cta:{ label:'COMO FUNCIONA', go:3 } },
  { img:'https://picsum.photos/seed/coelho-feno/900/600.jpg', alt:'Coelho comendo feno fresco',
    kicker:'Saúde',
    title:'VACINADOS & VERMIFUGADOS',
    sub:'Carteirinha de saúde + garantia de 7 dias',
    cta:{ label:'FALE COM A GENTE', wa:true } },
];

const fmt = v => v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
const waLink = c => `https://wa.me/${WA}?text=${encodeURIComponent(
  `Olá! Quero reservar o coelhinho ${c.nome} (${c.raca}, ${c.dias} dias) de ${fmt(c.preco)}. Ainda está disponível?`
)}`;

/* ---------- Favoritos (localStorage) ---------- */
let favs = [];
try { favs = JSON.parse(localStorage.getItem('se_favs') || '[]'); } catch(e) {}
const saveFavs = () => { try { localStorage.setItem('se_favs', JSON.stringify(favs)); } catch(e) {} };

/* ---------- Estado ---------- */
const state = { raca:'Todas', sort:'', favOnly:false, q:'' };
let swipedAt = 0; // evita clique acidental logo após arrastar o carrossel

/* ---------- Toast ---------- */
let toastT;
function toast(msg, icon = 'check'){
  const t = document.getElementById('toast');
  t.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4 shrink-0"></i><span>${msg}</span>`;
  t.classList.add('show');
  lucide.createIcons();
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------- Navegação (slide + deep-link por hash) ---------- */
const HASHES = ['#inicio', '#catalogo', '#contato', '#sobre'];
const pages   = [...document.querySelectorAll('.page')];
const navbtns = [...document.querySelectorAll('.navbtn')];
let cur = 0;

function go(i, fromHash){
  if (i === cur || i < 0 || i >= pages.length) return;
  const dir = i > cur ? 1 : -1, oldEl = pages[cur], newEl = pages[i];

  newEl.style.transition = 'none';
  newEl.style.transform  = `translateX(${dir * 36}px)`;
  void newEl.offsetWidth;
  newEl.style.transition = '';
  newEl.style.transform  = '';
  newEl.classList.add('active');

  oldEl.classList.remove('active');
  oldEl.style.transform = `translateX(${-dir * 28}px)`;
  setTimeout(() => { if (!oldEl.classList.contains('active')) oldEl.style.transform = ''; }, 420);

  cur = i;
  navbtns.forEach((b, j) => b.classList.toggle('active', j === i));
  try { if (!fromHash) history.replaceState(null, '', HASHES[i]); } catch(e) {}
}
navbtns.forEach(b => b.addEventListener('click', () => go(+b.dataset.page)));

/* ---------- Carrossel hero ---------- */
function initCarousel(){
  const wrap  = document.getElementById('carWrap');
  const track = document.getElementById('carTrack');
  const dots  = document.getElementById('carDots');
  if (!wrap || !track || !dots) return;

  track.innerHTML = slides.map((s, i) => `
    <div class="relative w-full h-full shrink-0">
      <img src="${s.img}" alt="${s.alt}" draggable="false" ${i ? 'loading="lazy"' : ''}
           class="absolute inset-0 w-full h-full object-cover">
      <div class="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/30 to-transparent pointer-events-none"></div>
      <div class="absolute inset-x-0 bottom-0 p-5 text-white pointer-events-none">
        <p class="text-[10px] font-bold uppercase tracking-[.14em] text-areia/90">${s.kicker}</p>
        <h2 class="mt-1 font-extrabold text-[23px] leading-[1.1] tracking-tight">${s.title}</h2>
        <p class="mt-1.5 text-[12px] text-white/85 font-medium max-w-[290px]">${s.sub}</p>
        <button type="button" data-cta="${i}"
                class="pointer-events-auto mt-3 inline-flex items-center gap-1.5 bg-white text-verde-esc font-extrabold text-[12px] rounded-full px-5 py-2.5 active:scale-95 transition">
          ${s.cta.label} <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    </div>`).join('');

  dots.innerHTML = slides.map((_, i) =>
    `<button type="button" data-dot="${i}" aria-label="Ir para o slide ${i + 1}" class="h-1.5 rounded-full transition-all duration-300"></button>`
  ).join('');
  lucide.createIcons();

  let carI = 0, timer = null;
  const DOTS = [...dots.children];

  const paint = () => {
    track.style.transform = `translateX(-${carI * 100}%)`;
    DOTS.forEach((d, j) => {
      d.style.width      = j === carI ? '20px' : '6px';
      d.style.background = j === carI ? '#fff' : 'rgba(255,255,255,.45)';
    });
  };
  const stop    = () => { if (timer) clearInterval(timer); timer = null; };
  const start   = () => { stop(); timer = setInterval(() => nav(carI + 1), 5000); };
  const nav     = (i, user) => { carI = (i + slides.length) % slides.length; paint(); if (user) start(); };

  DOTS.forEach((d, i) => d.addEventListener('click', () => nav(i, true)));

  /* swipe com arrasto */
  let sw = null;
  wrap.addEventListener('pointerdown', e => { sw = { x: e.clientX }; stop(); });
  wrap.addEventListener('pointerup', e => {
    if (!sw) return;
    const dx = e.clientX - sw.x;
    if (Math.abs(dx) > 40) { swipedAt = Date.now(); nav(carI + (dx < 0 ? 1 : -1), true); }
    else start();
    sw = null;
  });
  wrap.addEventListener('pointercancel', () => { sw = null; start(); });
  wrap.addEventListener('mouseenter', stop);
  wrap.addEventListener('mouseleave', start);

  paint(); start();
}

/* ---------- Catálogo ---------- */
const grid    = document.getElementById('grid');
const countEl = document.getElementById('count');
const favNEl  = document.getElementById('favN');
const favBtn  = document.getElementById('favFilter');

function listaFiltrada(){
  const q = state.q.trim().toLowerCase();
  let l = coelhos.filter(c =>
    (state.raca === 'Todas' || c.raca === state.raca) &&
    (!state.favOnly || favs.includes(c.id)) &&
    (!q || `${c.nome} ${c.raca} ${c.cor}`.toLowerCase().includes(q))
  );
  const ord = {
    'price-asc' : (a,b) => a.preco - b.preco,
    'price-desc': (a,b) => b.preco - a.preco,
    'age-asc'   : (a,b) => a.dias - b.dias,
    'age-desc'  : (a,b) => b.dias - a.dias,
  };
  if (state.sort && ord[state.sort]) l = [...l].sort(ord[state.sort]);
  return l;
}

function renderGrid(){
  const l = listaFiltrada();
  countEl.textContent = `${l.length} filhote${l.length !== 1 ? 's' : ''}`;

  if (!l.length){
    grid.innerHTML = `
      <div class="col-span-2 text-center py-14">
        <span class="mx-auto w-14 h-14 rounded-full bg-verde-claro text-verde grid place-items-center">
          <i data-lucide="${state.favOnly ? 'heart-off' : 'search'}" class="w-7 h-7"></i>
        </span>
        <p class="mt-3 font-bold text-sm text-stone-700">${state.favOnly ? 'Nenhum favorito ainda' : 'Nada encontrado'}</p>
        <p class="mt-1 text-xs text-stone-500 max-w-[230px] mx-auto leading-relaxed">${
          state.favOnly ? 'Toque no coraçãozinho dos filhotes para salvá-los aqui.'
                        : 'Tente outra busca, raça ou ordenação.'
        }</p>
      </div>`;
    lucide.createIcons();
    return;
  }

  grid.innerHTML = l.map((c, i) => `
    <article class="card-in bg-white rounded-2xl ring-1 ring-areia-borda shadow-card overflow-hidden flex flex-col" style="animation-delay:${i * 45}ms">
      <div class="relative">
        <img src="https://picsum.photos/seed/${c.seed}/400/400.jpg" alt="Coelho ${c.nome}, raça ${c.raca}, ${c.dias} dias"
             loading="lazy" draggable="false" data-zoom
             data-src="https://picsum.photos/seed/${c.seed}/1200/1200.jpg"
             data-title="${c.nome} • ${c.raca}"
             data-sub="${c.dias} dias • ${c.cor} • ${fmt(c.preco)}"
             data-wa="${waLink(c)}"
             class="w-full aspect-square object-cover cursor-zoom-in">
        <span class="absolute top-2 left-2 inline-flex items-center gap-1.5 bg-white/95 text-verde-esc text-[9px] font-bold uppercase tracking-wide pl-1.5 pr-2 py-1 rounded-full shadow-sm">
          <span class="relative flex h-1.5 w-1.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-verde opacity-60"></span>
            <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-verde"></span>
          </span>
          Disponível
        </span>
        <button type="button" data-fav="${c.id}" aria-label="Favoritar ${c.nome}"
                class="favbtn absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-white/95 shadow-sm grid place-items-center active:scale-90 transition ${favs.includes(c.id) ? 'fav-on' : ''}">
          <i data-lucide="heart" class="w-4 h-4"></i>
        </button>
        <button type="button" data-zoom
                data-src="https://picsum.photos/seed/${c.seed}/1200/1200.jpg"
                data-title="${c.nome} • ${c.raca}"
                data-sub="${c.dias} dias • ${c.cor} • ${fmt(c.preco)}"
                data-wa="${waLink(c)}"
                aria-label="Ampliar foto de ${c.nome}"
                class="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/90 shadow grid place-items-center text-verde-esc active:scale-90 transition">
          <i data-lucide="zoom-in" class="w-4 h-4"></i>
        </button>
      </div>
      <div class="p-2.5 flex flex-col flex-1">
        <div class="flex items-center gap-1.5">
          <span class="text-[9px] font-bold uppercase tracking-wider text-verde bg-verde-claro rounded px-1.5 py-0.5">${c.raca}</span>
          <span class="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-stone-500">
            <i data-lucide="${c.sexo === 'F' ? 'venus' : 'mars'}" class="w-3 h-3"></i>${c.sexo === 'F' ? 'Fêmea' : 'Macho'}
          </span>
        </div>
        <h3 class="mt-1.5 font-bold text-[15px] leading-none text-stone-900">${c.nome}</h3>
        <p class="mt-1.5 text-[10.5px] text-stone-500 inline-flex items-center gap-1 leading-tight">
          <i data-lucide="calendar" class="w-3 h-3 shrink-0"></i>${c.dias} dias • ${c.cor}
        </p>
        <div class="mt-auto pt-2.5">
          <p class="text-lg font-extrabold text-verde tnum leading-none">${fmt(c.preco)}</p>
          <a href="${waLink(c)}" target="_blank" rel="noopener"
             class="mt-2 w-full inline-flex flex-wrap items-center justify-center gap-1.5 bg-verde hover:bg-verde-esc text-white text-[11px] font-bold rounded-xl py-2.5 px-1 active:scale-95 transition text-center">
            <svg class="w-3.5 h-3.5 fill-current"><use href="#wa"/></svg> Reservar no WhatsApp
          </a>
        </div>
      </div>
    </article>`).join('');

  lucide.createIcons();
}

/* ---------- Filtros ---------- */
const chipsEl = document.getElementById('raceChips');
function renderChips(){
  const racas = ['Todas', ...new Set(coelhos.map(c => c.raca))];
  chipsEl.innerHTML = racas.map(r =>
    `<button type="button" data-raca="${r}" class="chip ${r === state.raca ? 'chip-on' : ''}">${r}</button>`
  ).join('');
}
chipsEl.addEventListener('click', e => {
  const b = e.target.closest('[data-raca]');
  if (!b) return;
  state.raca = b.dataset.raca;
  renderChips(); renderGrid();
});

document.getElementById('sortSel').addEventListener('change', e => { state.sort = e.target.value; renderGrid(); });

const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', e => { state.q = e.target.value; renderGrid(); });

favBtn.addEventListener('click', () => {
  state.favOnly = !state.favOnly;
  favBtn.classList.toggle('chip-on', state.favOnly);
  favBtn.setAttribute('aria-pressed', state.favOnly);
  renderGrid();
});

function updateFavBadge(){
  favNEl.textContent = favs.length;
  favNEl.classList.toggle('hidden', favs.length === 0);
  favNEl.classList.toggle('grid', favs.length > 0);
}

grid.addEventListener('click', e => {
  const f = e.target.closest('[data-fav]');
  if (!f) return;
  const id = +f.dataset.fav, c = coelhos.find(x => x.id === id), i = favs.indexOf(id);
  if (i > -1){
    favs.splice(i, 1);
    f.classList.remove('fav-on');
    toast(`${c.nome} saiu dos favoritos`, 'heart-off');
  } else {
    favs.push(id);
    f.classList.add('fav-on');
    f.classList.remove('pop'); void f.offsetWidth; f.classList.add('pop');
    toast(`${c.nome} salvo nos favoritos`, 'heart');
  }
  saveFavs(); updateFavBadge();
  if (state.favOnly) renderGrid();
});

/* ---------- Visualizador com zoom ---------- */
const zoomer = document.getElementById('zoomer');
const zStage = document.getElementById('zoomStage');
const zImg   = document.getElementById('zoomImg');
const zTitle = document.getElementById('zoomTitle');
const zSub   = document.getElementById('zoomSub');
const zWa    = document.getElementById('zoomWa');
const zHint  = document.getElementById('zoomHint');

const clampN = (v, a, b) => Math.min(b, Math.max(a, v));
let Z = { s:1, x:0, y:0 };
const pts = new Map();
let pinch = null, drag = null;
let lastTapT = 0, lastTapX = 0, lastTapY = 0, hintT;

const zApply = () => { zImg.style.transform = `translate3d(${Z.x}px, ${Z.y}px, 0) scale(${Z.s})`; };

function zClamp(){
  const r = zStage.getBoundingClientRect();
  const maxX = Math.max(0, (zImg.offsetWidth  * Z.s - r.width)  / 2);
  const maxY = Math.max(0, (zImg.offsetHeight * Z.s - r.height) / 2);
  Z.x = clampN(Z.x, -maxX, maxX);
  Z.y = clampN(Z.y, -maxY, maxY);
}

function zAt(px, py, f, anim = false){
  const r  = zStage.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const s0 = Z.s;
  Z.s = clampN(s0 * f, 1, 4);
  const k = Z.s / s0;
  Z.x = px - cx - (px - cx - Z.x) * k;
  Z.y = py - cy - (py - cy - Z.y) * k;
  zClamp();
  if (anim){ zImg.classList.add('anim'); zApply(); setTimeout(() => zImg.classList.remove('anim'), 300); }
  else zApply();
}

function zReset(anim = true){
  Z = { s:1, x:0, y:0 };
  if (anim){ zImg.classList.add('anim'); zApply(); setTimeout(() => zImg.classList.remove('anim'), 300); }
  else zApply();
}

function openZoom(src, alt, title, sub, waHref){
  zImg.classList.remove('anim');
  const done = () => { zImg.style.opacity = '1'; };
  zImg.onload = done;
  zImg.style.opacity = '0';
  zImg.alt = alt || 'Foto do Sítio Esperança';
  zImg.src = src;
  if (zImg.complete) done();

  zTitle.textContent = title || '';
  zSub.textContent   = sub || '';
  if (waHref){ zWa.href = waHref; zWa.classList.remove('hidden'); }
  else zWa.classList.add('hidden');

  zoomer.style.background = '';
  zoomer.classList.add('open');
  zReset(false);

  zHint.style.opacity = '1';
  clearTimeout(hintT);
  hintT = setTimeout(() => { zHint.style.opacity = '0'; }, 2600);
}

function closeZoom(){
  zoomer.classList.remove('open');
  zoomer.style.background = '';
  zImg.style.opacity = '0';
}

zStage.addEventListener('pointerdown', e => {
  e.preventDefault();
  zStage.setPointerCapture(e.pointerId);
  pts.set(e.pointerId, { x:e.clientX, y:e.clientY });

  if (pts.size === 1){
    const now = Date.now();
    if (now - lastTapT < 320 && Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY) < 40){
      lastTapT = 0; pts.clear(); drag = null; pinch = null;
      if (Z.s > 1.05) zReset(); else zAt(e.clientX, e.clientY, 2.5, true);
      return;
    }
    lastTapT = now; lastTapX = e.clientX; lastTapY = e.clientY;
    drag = { sx:e.clientX, sy:e.clientY, ox:Z.x, oy:Z.y };

  } else if (pts.size === 2){
    drag = null;
    const [a, b] = [...pts.values()];
    pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, mx:(a.x + b.x) / 2, my:(a.y + b.y) / 2 };
  }
});

zStage.addEventListener('pointermove', e => {
  if (!pts.has(e.pointerId)) return;
  pts.set(e.pointerId, { x:e.clientX, y:e.clientY });

  if (pts.size === 2 && pinch){
    const [a, b] = [...pts.values()];
    const d  = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    Z.x += mx - pinch.mx; Z.y += my - pinch.my;
    zAt(mx, my, d / pinch.d);
    pinch = { d, mx, my };

  } else if (drag && pts.size === 1){
    if (Z.s > 1.02){
      Z.x = drag.ox + (e.clientX - drag.sx);
      Z.y = drag.oy + (e.clientY - drag.sy);
      zClamp(); zApply();
    } else {
      const dy = e.clientY - drag.sy;
      if (dy > 0){
        zImg.style.transform = `translate3d(0, ${dy}px, 0)`;
        zoomer.style.background = `rgba(28,25,23,${Math.max(.55, .96 - dy / 600)})`;
      }
    }
  }
});

const zUp = e => {
  if (!pts.has(e.pointerId)) return;
  pts.delete(e.pointerId);

  if (pts.size === 1){
    const p = [...pts.values()][0];
    drag = { sx:p.x, sy:p.y, ox:Z.x, oy:Z.y };
    pinch = null;

  } else if (pts.size === 0){
    if (Z.s <= 1.02 && drag){
      const dy = e.clientY - drag.sy;
      if (dy > 90){ closeZoom(); drag = null; return; }
      zImg.classList.add('anim'); zApply();
      zoomer.style.background = '';
      setTimeout(() => zImg.classList.remove('anim'), 300);
    }
    drag = null; pinch = null;
  }
};
zStage.addEventListener('pointerup', zUp);
zStage.addEventListener('pointercancel', zUp);

zStage.addEventListener('wheel', e => {
  e.preventDefault();
  zAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.25 : 0.8);
}, { passive:false });

document.getElementById('zoomClose').addEventListener('click', closeZoom);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && zoomer.classList.contains('open')) closeZoom();
});

/* ---------- Delegação global: zoom, navegação e CTAs do carrossel ---------- */
document.addEventListener('click', e => {
  if (Date.now() - swipedAt < 350) return; // ignora cliques logo após swipe

  const cta = e.target.closest('[data-cta]');
  if (cta){
    const s = slides[+cta.datase
