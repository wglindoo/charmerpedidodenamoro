/* ============================================================
   CHARMER — interações
   ============================================================ */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     1. Campo de corações flutuantes (canvas de fundo)
  --------------------------------------------------------- */
  const heartCanvas = document.getElementById('heart-field');
  const hctx = heartCanvas.getContext('2d');
  let hearts = [];
  let hw, hh;

  function sizeHeartCanvas(){
    hw = heartCanvas.width = window.innerWidth;
    hh = heartCanvas.height = document.documentElement.scrollHeight;
  }

  function makeHearts(){
    const count = Math.min(46, Math.floor(window.innerWidth / 34));
    hearts = Array.from({ length: count }, () => spawnHeart(true));
  }

  function spawnHeart(randomY){
    return {
      x: Math.random() * hw,
      y: randomY ? Math.random() * hh : hh + 40,
      size: 6 + Math.random() * 14,
      speed: .15 + Math.random() * .35,
      drift: (Math.random() - .5) * .4,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: .008 + Math.random() * .012,
      opacity: .12 + Math.random() * .3,
      hue: Math.random() > .5 ? 'rose' : 'gold'
    };
  }

  function drawHeart(x, y, size, opacity, hue){
    hctx.save();
    hctx.translate(x, y);
    hctx.globalAlpha = opacity;
    hctx.fillStyle = hue === 'rose' ? '#b5405f' : '#c9a15a';
    hctx.beginPath();
    const s = size / 16;
    hctx.moveTo(0, 4 * s);
    hctx.bezierCurveTo(-8 * s, -6 * s, -16 * s, 2 * s, 0, 14 * s);
    hctx.bezierCurveTo(16 * s, 2 * s, 8 * s, -6 * s, 0, 4 * s);
    hctx.fill();
    hctx.restore();
  }

  function tickHearts(){
    hctx.clearRect(0, 0, hw, hh);
    for (const h of hearts){
      h.wobble += h.wobbleSpeed;
      h.y -= h.speed;
      h.x += h.drift + Math.sin(h.wobble) * .3;
      if (h.y < -30){
        Object.assign(h, spawnHeart(false));
      }
      drawHeart(h.x, h.y, h.size, h.opacity, h.hue);
    }
    if (!reduceMotion) requestAnimationFrame(tickHearts);
  }

  function initHeartField(){
    sizeHeartCanvas();
    makeHearts();
    if (!reduceMotion){
      tickHearts();
    } else {
      // draw a single static frame
      tickHearts();
    }
  }

  window.addEventListener('resize', () => {
    sizeHeartCanvas();
  });

  /* ---------------------------------------------------------
     2. Linha dourada (fio condutor) atravessando a página
  --------------------------------------------------------- */
  function buildThreadLine(){
    const svg = document.getElementById('thread-line');
    const wrap = document.querySelector('.thread-line-wrap');
    const docHeight = document.documentElement.scrollHeight;
    wrap.style.height = docHeight + 'px';
    svg.setAttribute('viewBox', `0 0 100 ${docHeight}`);

    // gradiente
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <linearGradient id="gold-gradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#b5405f" stop-opacity="0" />
        <stop offset="12%" stop-color="#b5405f" stop-opacity=".55" />
        <stop offset="50%" stop-color="#c9a15a" stop-opacity=".65" />
        <stop offset="88%" stop-color="#b5405f" stop-opacity=".55" />
        <stop offset="100%" stop-color="#b5405f" stop-opacity="0" />
      </linearGradient>`;
    svg.appendChild(defs);

    // gera um caminho serpenteante suave do topo ao fim do documento
    let d = `M 50 0`;
    const step = 220;
    let y = step;
    let side = 1;
    while (y < docHeight){
      const cx = 50 + side * 26;
      d += ` Q ${cx} ${y - step / 2}, 50 ${y}`;
      side *= -1;
      y += step;
    }

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('id', 'thread-path');
    svg.appendChild(path);

    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;

    function updateThread(){
      const scrollTop = window.scrollY;
      const winH = window.innerHeight;
      const progress = Math.min(1, (scrollTop + winH * .6) / docHeight);
      path.style.strokeDashoffset = length - (length * progress);
    }

    updateThread();
    window.addEventListener('scroll', updateThread, { passive: true });
    window.addEventListener('resize', () => {
      // recalcula em resize significativo
    });
  }

  /* ---------------------------------------------------------
     3. Revelar elementos ao rolar
  --------------------------------------------------------- */
  function initReveal(){
    const els = document.querySelectorAll('.reveal, .reveal-up');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, idx) => {
        if (entry.isIntersecting){
          const el = entry.target;
          const delay = Array.from(el.parentElement?.children || []).indexOf(el) * 70;
          setTimeout(() => el.classList.add('is-visible'), Math.min(delay, 280));
          io.unobserve(el);
        }
      });
    }, { threshold: .18, rootMargin: '0px 0px -8% 0px' });

    els.forEach(el => io.observe(el));
  }

  /* ---------------------------------------------------------
     4. Navegação por pontos (seções)
  --------------------------------------------------------- */
  function initSectionNav(){
    const dots = document.querySelectorAll('.section-nav .dot');
    const sections = Array.from(dots).map(d => document.getElementById(d.dataset.target));

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        sections[i]?.scrollIntoView({ behavior: 'smooth' });
      });
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const idx = sections.indexOf(entry.target);
        if (entry.isIntersecting && idx !== -1){
          dots.forEach(d => d.classList.remove('active'));
          dots[idx].classList.add('active');
        }
      });
    }, { threshold: .5 });

    sections.forEach(s => s && io.observe(s));
  }

  /* ---------------------------------------------------------
     5. Botão "Começar nossa história"
  --------------------------------------------------------- */
  function initStartButton(){
    const btn = document.getElementById('start-btn');
    btn.addEventListener('click', () => {
      document.getElementById('story').scrollIntoView({ behavior: 'smooth' });
    });
  }

  /* ---------------------------------------------------------
     6. Pedido final + comemoração
  --------------------------------------------------------- */
  function initAsk(){
    const stage = document.getElementById('ask-stage');
    const celebration = document.getElementById('celebration');
    const yesBtn = document.getElementById('yes-btn');
    const noBtn = document.getElementById('no-btn');
    const noNote = document.getElementById('no-note');

    function accept(){
      stage.classList.add('hidden-stage');
      celebration.hidden = false;
      launchConfetti();
    }
    yesBtn.addEventListener('click', accept);

    /* botão "Não" é clicável normalmente — apenas mostra uma resposta gentil */
    noBtn.addEventListener('click', () => {
      if (noNote){
        noNote.classList.add('is-visible');
      }
    });
  }

  /* ---------------------------------------------------------
     7. Confete de corações na aceitação
  --------------------------------------------------------- */
  function launchConfetti(){
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#b5405f', '#c9a15a', '#e7b6bf', '#f4e9e3'];
    const pieces = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * .5,
      size: 6 + Math.random() * 10,
      speed: 1.5 + Math.random() * 3.5,
      drift: (Math.random() - .5) * 2,
      spin: Math.random() * Math.PI * 2,
      spinSpeed: (Math.random() - .5) * .2,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() > .4 ? 'heart' : 'dot'
    }));

    let frame = 0;
    const maxFrames = reduceMotion ? 1 : 480;

    function drawPiece(p){
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin);
      ctx.fillStyle = p.color;
      if (p.shape === 'heart'){
        const s = p.size / 16;
        ctx.beginPath();
        ctx.moveTo(0, 4 * s);
        ctx.bezierCurveTo(-8 * s, -6 * s, -16 * s, 2 * s, 0, 14 * s);
        ctx.bezierCurveTo(16 * s, 2 * s, 8 * s, -6 * s, 0, 4 * s);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function tick(){
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let stillFalling = false;
      for (const p of pieces){
        p.y += p.speed;
        p.x += p.drift;
        p.spin += p.spinSpeed;
        if (p.y < canvas.height + 30) stillFalling = true;
        drawPiece(p);
      }
      frame++;
      if (stillFalling && frame < maxFrames){
        requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    tick();
  }

  /* ---------------------------------------------------------
     Inicialização
  --------------------------------------------------------- */
  window.addEventListener('load', () => {
    initHeartField();
    buildThreadLine();
    initReveal();
    initSectionNav();
    initStartButton();
    initAsk();

    // primeiro reveal do hero acontece de imediato
    document.querySelectorAll('#hero .reveal').forEach((el, i) => {
      setTimeout(() => el.classList.add('is-visible'), 200 + i * 180);
    });
  });

  window.addEventListener('resize', () => {
    const canvas = document.getElementById('confetti-canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
})();