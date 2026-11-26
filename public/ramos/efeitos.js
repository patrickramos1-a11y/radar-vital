/* =========================================================================
   RAMOS — EFEITOS (fase 2: JavaScript pequeno, sem biblioteca)
   Carregar com <script src="efeitos.js" defer></script>, depois do efeitos.css.

   .holofote ........ a luz acompanha o cursor (--mx, --my)
   .luz ............. pausa a animação quando sai da tela (liga .luz--pausa)
   [data-centelha] .. faíscas na cor do tom ao clicar dentro da peça
   .busca-troca ..... input com data-exemplos="A|B|C": o texto de exemplo troca
                      sozinho; ao dar Enter o texto se desfaz (dissolve)
   .inclina ......... a peça se inclina de leve para o lado do cursor
   .faixa-curva ..... pausa o texto em curva com "reduzir movimento"

   Respeita "reduzir movimento": sem faíscas, sem inclinação, sem troca de texto
   e sem faixa correndo. Nada aqui mexe no texto da página além do exemplo da busca.
   ========================================================================= */
(function () {
  'use strict';
  var parado = function () { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; };
  var raf = window.requestAnimationFrame;

  /* ---- Holofote: segue o cursor ---- */
  document.addEventListener('pointermove', function (e) {
    var h = e.target.closest && e.target.closest('.holofote');
    if (!h) return;
    var x = e.clientX, y = e.clientY;
    raf(function () {
      var r = h.getBoundingClientRect();
      h.style.setProperty('--mx', (x - r.left) + 'px');
      h.style.setProperty('--my', (y - r.top) + 'px');
    });
  }, { passive: true });

  /* ---- Inclinação suave ---- */
  document.addEventListener('pointermove', function (e) {
    var el = e.target.closest && e.target.closest('.inclina');
    if (!el || parado()) return;
    var x = e.clientX, y = e.clientY;
    raf(function () {
      var r = el.getBoundingClientRect();
      var px = (x - r.left) / r.width - 0.5, py = (y - r.top) / r.height - 0.5;
      el.style.setProperty('--ry', (px * 8).toFixed(2) + 'deg');
      el.style.setProperty('--rx', (-py * 8).toFixed(2) + 'deg');
    });
  }, { passive: true });
  document.addEventListener('pointerout', function (e) {
    var el = e.target.closest && e.target.closest('.inclina');
    if (el && !el.contains(e.relatedTarget)) { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); }
  });

  /* ---- Pausar o contorno de luz fora da tela ---- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (itens) {
      itens.forEach(function (i) { i.target.classList.toggle('luz--pausa', !i.isIntersecting); });
    }, { rootMargin: '80px' });
    var observar = function (raiz) { (raiz || document).querySelectorAll('.luz').forEach(function (el) { io.observe(el); }); };
    observar();
    new MutationObserver(function (m) {
      m.forEach(function (x) {
        x.addedNodes.forEach(function (n) {
          if (n.nodeType !== 1) return;
          if (n.matches && n.matches('.luz')) io.observe(n);
          if (n.querySelectorAll) observar(n);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  /* ---- Centelha ao clicar ---- */
  document.addEventListener('click', function (e) {
    var alvo = e.target.closest && e.target.closest('[data-centelha]');
    if (!alvo || parado() || !alvo.animate) return;
    var r = alvo.getBoundingClientRect();
    var cx = e.clientX - r.left, cy = e.clientY - r.top;
    var pos = getComputedStyle(alvo).position;
    if (pos === 'static') alvo.style.position = 'relative';
    var cor = getComputedStyle(alvo).getPropertyValue('--luz-cor').trim() || '#0dd375';
    for (var i = 0; i < 8; i++) {
      var f = document.createElement('i');
      f.setAttribute('aria-hidden', 'true');
      f.style.cssText = 'position:absolute;left:' + cx + 'px;top:' + cy + 'px;width:2px;height:9px;border-radius:2px;pointer-events:none;z-index:9;background:' + cor + ';transform-origin:50% 100%';
      alvo.appendChild(f);
      var ang = (360 / 8) * i, dist = 22 + Math.random() * 12;
      var a = f.animate([
        { transform: 'rotate(' + ang + 'deg) translateY(-6px)', opacity: 1 },
        { transform: 'rotate(' + ang + 'deg) translateY(-' + dist + 'px) scaleY(.4)', opacity: 0 }
      ], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' });
      a.onfinish = (function (n) { return function () { n.remove(); }; })(f);
    }
  });

  /* ---- Busca que troca o texto de exemplo ---- */
  function prepararBusca(campo) {
    var lista = (campo.dataset.exemplos || '').split('|').filter(Boolean);
    if (!lista.length) return;
    var i = 0;
    campo.placeholder = lista[0];
    if (lista.length > 1 && !parado()) {
      setInterval(function () {
        if (document.activeElement === campo || campo.value) return;
        i = (i + 1) % lista.length;
        campo.classList.add('busca-troca--muda');
        setTimeout(function () { campo.placeholder = lista[i]; campo.classList.remove('busca-troca--muda'); }, 220);
      }, 3200);
    }
    campo.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' || !campo.value) return;
      if (parado()) return;
      campo.classList.add('busca-troca--dissolve');
      setTimeout(function () { campo.value = ''; campo.classList.remove('busca-troca--dissolve'); }, 520);
    });
  }
  document.querySelectorAll('input[data-exemplos]').forEach(prepararBusca);

  /* ---- Faixa em curva: parar com "reduzir movimento" ---- */
  if (parado()) document.querySelectorAll('svg.faixa-curva').forEach(function (s) { if (s.pauseAnimations) s.pauseAnimations(); });
})();
