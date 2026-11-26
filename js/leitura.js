/* Páginas de leitura: a faixa da pintura recua devagar na rolagem, os blocos aparecem ao entrar na tela,
   o índice marca a seção em que o leitor está e o prefácio mostra quanto já foi lido.
   Só transform e opacity. Com prefers-reduced-motion nada se move; sem script, a página aparece inteira e parada. */
(function () {
  'use strict';
  window.leituraPronta = true;
  var raiz = document.documentElement;
  var reduzir = window.matchMedia('(prefers-reduced-motion: reduce)');
  var temIO = 'IntersectionObserver' in window;

  /* ------------------------------------------------ índice: a seção atual (não é movimento; vale sempre) */
  var nesta = document.querySelector('[data-nesta]');
  if (nesta && temIO) {
    var links = Array.prototype.slice.call(nesta.querySelectorAll('a[href^="#"]'));
    var secoes = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
    var dentro = {};
    var marca = function () {
      var atual = null;
      for (var i = 0; i < secoes.length; i++) { if (dentro[secoes[i].id]) { atual = secoes[i].id; break; } }
      links.forEach(function (a) {
        if (atual && a.getAttribute('href') === '#' + atual) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
    };
    var olhoSecoes = new IntersectionObserver(function (es) {
      es.forEach(function (e) { dentro[e.target.id] = e.isIntersecting; });
      marca();
    }, { rootMargin: '-30% 0px -60% 0px' });
    secoes.forEach(function (s) { olhoSecoes.observe(s); });
  }

  /* ------------------------------------------------ revelação na rolagem (só com .rv, posta na cabeça) */
  if (raiz.classList.contains('rv') && temIO) {
    var ATRASOS = [0, 80, 140, 190, 230, 260];   /* intervalos que encolhem: lê como onda, não como fila */
    var alvos = Array.prototype.slice.call(document.querySelectorAll(
      '.bloco .split > *, .bloco > .wrap > h2, .episodios-grade > li, .ep-nav__numeros, .ep-navegacao'));
    var olhoBlocos = new IntersectionObserver(function (es) {
      var lote = es.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; });
      lote.forEach(function (el, i) {
        el.style.setProperty('--atraso', ATRASOS[Math.min(i, ATRASOS.length - 1)] + 'ms');
        el.classList.add('visto');
        olhoBlocos.unobserve(el);
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    alvos.forEach(function (el) { olhoBlocos.observe(el); });
    /* quem navega pelo teclado nunca cai num item ainda invisível: o foco revela o bloco na hora */
    document.addEventListener('focusin', function (e) {
      alvos.forEach(function (el) {
        if (!el.classList.contains('visto') && el.contains(e.target)) {
          el.style.transition = 'none';   /* aparece já inteiro: o foco não espera a revelação */
          el.classList.add('visto'); olhoBlocos.unobserve(el);
        }
      });
    });
    /* quem liga "reduzir movimento" com a página aberta vê tudo parar e aparecer */
    var paraTudo = function () { if (reduzir.matches) raiz.classList.remove('rv'); };
    if (reduzir.addEventListener) reduzir.addEventListener('change', paraTudo);
  }

  /* ------------------------------------------------ faixa que recua e barra de leitura do prefácio */
  var img = document.querySelector('[data-faixa]');
  var quadroFaixa = img && img.parentNode;            /* o picture: a imagem tem a própria entrada */
  var barra = document.querySelector('[data-progresso]');
  var artigo = barra && document.querySelector('.bloco--prefacio');
  if (!quadroFaixa && !barra) return;

  var medidas = { faixa: 0, fator: 0, artTopo: 0, artAltura: 1, tela: 1 };
  var mede = function () {   /* leituras de layout só ao carregar e ao mudar o tamanho da tela */
    medidas.tela = window.innerHeight;
    if (quadroFaixa) {
      quadroFaixa.style.transform = '';
      medidas.faixa = quadroFaixa.parentNode.offsetHeight;
      /* o recuo nunca passa da sobra que a imagem tem em cima (30% no computador, 10% no celular) */
      medidas.fator = medidas.faixa ? Math.max(0, -quadroFaixa.offsetTop) / medidas.faixa : 0;
    }
    if (artigo) {
      var r = artigo.getBoundingClientRect();
      medidas.artTopo = r.top + window.scrollY;
      medidas.artAltura = Math.max(1, artigo.offsetHeight - medidas.tela);
    }
  };
  var pedido = 0;
  var quadro = function () {
    pedido = 0;
    if (reduzir.matches) {
      if (quadroFaixa) quadroFaixa.style.transform = '';
      if (barra) barra.style.transform = '';
      return;
    }
    var y = window.scrollY;
    if (quadroFaixa && y <= medidas.faixa * 1.5) {
      quadroFaixa.style.transform = 'translateY(' + (Math.min(y, medidas.faixa) * medidas.fator).toFixed(1) + 'px)';
    }
    if (barra) {
      var p = (y - medidas.artTopo) / medidas.artAltura;
      barra.style.transform = 'scaleX(' + Math.max(0, Math.min(1, p)).toFixed(4) + ')';
    }
  };
  var pede = function () { if (!pedido) pedido = window.requestAnimationFrame(quadro); };
  mede(); quadro();
  window.addEventListener('scroll', pede, { passive: true });
  window.addEventListener('resize', function () { mede(); pede(); });
  window.addEventListener('load', function () { mede(); pede(); });
  if (reduzir.addEventListener) reduzir.addEventListener('change', pede);
})();
