/* ==============================================
   RODRIGO PAREDES · CONCEJAL 2026
   script.js — StPageFlip + GSAP + AOS
============================================== */
'use strict';

/* ════════════════════════════════
   PRELOAD & LOADER
════════════════════════════════ */
const IMAGES_TO_PRELOAD = [
  'images/header.webp',
  'images/portada.webp',
  'images/candidato.webp',
  'images/flyer-final.webp',
];

function preloadImages(urls) {
  return Promise.all(urls.map(url => new Promise(resolve => {
    const img = new Image();
    img.onload = img.onerror = resolve;
    img.src = url;
  })));
}

function hideLoader() {
  const loader = document.getElementById('loader');
  loader.classList.add('fade-out');
  setTimeout(() => { loader.style.display = 'none'; }, 600);
}

Promise.all([
  new Promise(resolve => window.addEventListener('load', resolve)),
  preloadImages(IMAGES_TO_PRELOAD),
]).then(startApp);

/* ════════════════════════════════
   APP
════════════════════════════════ */
function startApp() {
  AOS.init({ duration: 500, once: true, offset: 20 });

  const $ = id => document.getElementById(id);

  const coverScreen = $('coverScreen');
  const book3d      = $('book3d');
  const bookOpenEl  = $('bookOpen');
  const btnClose    = $('btnClose');
  const btnPrev     = $('btnPrev');
  const btnNext     = $('btnNext');
  const navDots     = $('navDots');
  let flipBookEl    = $('flipBook');
  const pageTplEl   = $('pageTemplates');

  let pageFlip   = null;
  let totalPages = 0;
  let isMobile   = window.innerWidth <= 600;
  let busy       = false;

  /* ════════════════════════════════
     BOOK SIZING
  ════════════════════════════════ */
  function getBookSize() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    if (W <= 600) {
      return { width: Math.round(W * 0.99), height: Math.round(H - 124), single: true };
    }
    const maxH = Math.min(H - 70, 1100);
    const maxW = Math.min(W * 0.995, 1600);
    const ratio = 0.62;
    let ph = maxH;
    let pw = ph * ratio;
    if (pw * 2 > maxW) { pw = maxW / 2; ph = pw / ratio; }
    return { width: Math.round(pw * 2), height: Math.round(ph), single: false };
  }

  /* ════════════════════════════════
     BUILD PAGES
  ════════════════════════════════ */
  function buildPages(container) {
    container.innerHTML = '';
    const children = Array.from(pageTplEl.children);
    children.forEach(child => {
      const wrapper = document.createElement('div');
      wrapper.className = 'page-item';
      wrapper.appendChild(child.cloneNode(true));
      container.appendChild(wrapper);
    });
    totalPages = children.length;
  }

  /* ════════════════════════════════
     INIT STPAGEFLIP
  ════════════════════════════════ */
  function initFlip() {
    if (pageFlip) {
      try { pageFlip.destroy(); } catch (e) {}
      pageFlip = null;
    }

    if (flipBookEl.parentNode) flipBookEl.parentNode.removeChild(flipBookEl);
    const fresh = document.createElement('div');
    fresh.id = 'flipBook';
    const navBar = bookOpenEl.querySelector('.nav-bar');
    bookOpenEl.insertBefore(fresh, navBar);
    flipBookEl = fresh;

    isMobile = window.innerWidth <= 600;
    const size = getBookSize();

    flipBookEl.style.width  = size.width  + 'px';
    flipBookEl.style.height = size.height + 'px';

    buildPages(flipBookEl);

    flipBookEl.querySelectorAll('.page-item').forEach(p => {
      p.style.width    = (size.single ? size.width : size.width / 2) + 'px';
      p.style.height   = size.height + 'px';
      p.style.overflow = 'hidden';
      if (size.single) {
        const pg = p.querySelector('.pg');
        if (pg) { pg.style.overflow = 'hidden'; pg.style.height = size.height + 'px'; }
        const bodyArea = p.querySelector('.pg-body-area');
        if (bodyArea) { bodyArea.style.overflowY = 'auto'; bodyArea.style.webkitOverflowScrolling = 'touch'; }
      }
    });

    pageFlip = new St.PageFlip(flipBookEl, {
      width:        size.single ? size.width : size.width / 2,
      height:       size.height,
      size:         'fixed',
      minWidth:     50,
      maxWidth:     size.single ? size.width : size.width / 2,
      minHeight:    50,
      maxHeight:    size.height,
      drawShadow:   false,   /* sin canvas = flip instantáneo */
      flippingTime: 400,
      usePortrait:  size.single,
      startZIndex:  10,
      autoSize:     false,
      showCover:    false,
      mobileScrollSupport: false,
      clickEventForward:   false,
      useMouseEvents:      true,
      swipeDistance:       30,
      showPageCorners:     !size.single,
    });

    pageFlip.loadFromHTML(flipBookEl.querySelectorAll('.page-item'));

    pageFlip.on('flip', e => syncUI(e.data));
    pageFlip.on('changeState', e => {
      flipBookEl.classList.toggle('is-flipping', e.data === 'flipping' || e.data === 'user_fold');
      syncUI(pageFlip.getCurrentPageIndex());
    });

    syncUI(0);
  }

  /* ════════════════════════════════
     SYNC NAV
  ════════════════════════════════ */
  function syncUI(pageIdx) {
    const spread = isMobile ? pageIdx : Math.floor(pageIdx / 2);
    navDots.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('on', i === spread));
    btnPrev.disabled = pageIdx <= 0;
    btnNext.disabled = isMobile ? pageIdx >= totalPages - 1 : pageIdx >= totalPages - 2;
  }

  function buildDots() {
    navDots.innerHTML = '';
    const totalSpreads = isMobile ? totalPages : Math.ceil(totalPages / 2);
    for (let i = 0; i < totalSpreads; i++) {
      const d = document.createElement('div');
      d.className = 'dot' + (i === 0 ? ' on' : '');
      d.addEventListener('click', () => pageFlip.turnToPage(isMobile ? i : i * 2));
      navDots.appendChild(d);
    }
  }

  /* ════════════════════════════════
     PRE-INIT: StPageFlip se inicializa
     mientras el libro está oculto,
     así al abrir ya está listo.
  ════════════════════════════════ */
  initFlip();
  buildDots();
  hideLoader(); /* mostrar app solo cuando StPageFlip ya está listo */

  /* ════════════════════════════════
     OPEN BOOK
  ════════════════════════════════ */
  function openBook() {
    if (busy) return;
    busy = true;

    gsap.killTweensOf([book3d, coverScreen, bookOpenEl]);

    gsap.to(book3d, {
      rotateY: -50, rotateX: 3, scale: .85, opacity: 0,
      duration: .3, ease: 'power2.in',
      onComplete: () => {
        coverScreen.style.display = 'none';
        bookOpenEl.classList.add('show');
        gsap.fromTo(bookOpenEl,
          { opacity: 0 },
          { opacity: 1, duration: .25, ease: 'power2.out',
            onComplete: () => { busy = false; }
          }
        );
      }
    });
  }

  /* ════════════════════════════════
     CLOSE BOOK
  ════════════════════════════════ */
  function closeBook() {
    if (busy) return;
    busy = true;

    gsap.killTweensOf([book3d, coverScreen, bookOpenEl]);

    gsap.to(bookOpenEl, {
      opacity: 0, duration: .2, ease: 'power2.in',
      onComplete: () => {
        bookOpenEl.classList.remove('show');
        coverScreen.style.display = '';

        gsap.set(book3d, { rotateY: -50, rotateX: 3, scale: .85, opacity: 0 });
        gsap.to(book3d, {
          rotateY: -22, rotateX: 6, scale: 1, opacity: 1,
          duration: .5, ease: 'back.out(1.3)',
          onComplete: () => {
            gsap.set(book3d, { clearProps: 'all' });
            /* re-inicializar en segundo plano para la próxima apertura */
            initFlip();
            buildDots();
            busy = false;
          }
        });
      }
    });
  }

  /* ════════════════════════════════
     EVENTS
  ════════════════════════════════ */
  book3d.addEventListener('click', openBook);
  btnClose.addEventListener('click', closeBook);
  btnNext.addEventListener('click', () => { if (pageFlip) pageFlip.flipNext('bottom'); });
  btnPrev.addEventListener('click', () => { if (pageFlip) pageFlip.flipPrev('bottom'); });

  document.addEventListener('keydown', e => {
    if (!bookOpenEl.classList.contains('show') || !pageFlip) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { pageFlip.flipNext('bottom'); e.preventDefault(); }
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { pageFlip.flipPrev('bottom'); e.preventDefault(); }
    if (e.key === 'Escape') closeBook();
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      isMobile = window.innerWidth <= 600;
      if (bookOpenEl.classList.contains('show') && pageFlip) {
        const currentPage = pageFlip.getCurrentPageIndex();
        initFlip();
        buildDots();
        try { pageFlip.turnToPage(currentPage); } catch (e) {}
      } else {
        /* re-init silencioso para ajustar tamaño */
        initFlip();
        buildDots();
      }
    }, 250);
  });
}
