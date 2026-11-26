/* Início: camadas da pintura na rolagem e entrada em sequência das cinco partes.
   Só transform e opacity. Nada roda com prefers-reduced-motion; sem script, a página fica inteira e parada. */
(function () {
  'use strict';

  /* Âncoras do site de uma página só (até 2026-11) que agora vivem em páginas internas.
     As que continuam no Início (#livro, #videocast, #financiamento) não são tocadas. */
  var ANCORAS = { sobre: 'livro/#sobre', ficha: 'livro/#ficha', errata: 'livro/#errata', acessibilidade: 'acessibilidade/', equipe: 'projeto/#equipe' };
  var alvo = location.hash.slice(1);
  if (alvo && ANCORAS[alvo] && !document.getElementById(alvo)) { location.replace(ANCORAS[alvo]); return; }

  var reduzir = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduzir.matches) return;

  /* ------------------------------------------------ camadas */
  var ceu = document.querySelector('[data-camada="ceu"]');
  var abertura = ceu && ceu.closest('section');
  var faixas = Array.prototype.slice.call(document.querySelectorAll('[data-camada="faixa"]'));
  var visiveis = new Set();
  var pedido = 0;

  function desenha() {
    pedido = 0;
    if (reduzir.matches) return;
    var vh = window.innerHeight;
    var ceuNovo = null;
    if (ceu && visiveis.has(abertura)) {
      // o céu recua: anda a 30% da rolagem enquanto a abertura sai da tela
      var y = Math.min(window.scrollY, abertura.offsetHeight);
      ceuNovo = 'translateY(' + (y * 0.3).toFixed(1) + 'px)';
    }
    // primeiro lê todas as medidas, depois escreve: nenhuma leitura depois de uma escrita no mesmo quadro
    var novos = [];
    for (var i = 0; i < faixas.length; i++) {
      var camada = faixas[i], secao = camada.closest('section');
      if (!visiveis.has(secao)) continue;
      // a faixa é o alto da seção; a imagem tem 124% da altura da faixa e corre ±10% dela, mais devagar que a página
      var alto = camada.offsetHeight / 1.24, topo = secao.getBoundingClientRect().top;
      var p = (vh - topo) / (vh + alto); // 0: a faixa entra por baixo; 1: sai por cima
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      novos.push([camada, 'translateY(' + ((p - 0.5) * 0.2 * alto).toFixed(1) + 'px)']);
    }
    if (ceuNovo) ceu.style.transform = ceuNovo;
    for (var j = 0; j < novos.length; j++) novos[j][0].style.transform = novos[j][1];
  }
  function agenda() { if (!pedido) pedido = requestAnimationFrame(desenha); }

  if ('IntersectionObserver' in window) {
    var olho = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) { if (e.isIntersecting) visiveis.add(e.target); else visiveis.delete(e.target); });
      agenda();
    }, { rootMargin: '10% 0px 10% 0px' });
    if (abertura) olho.observe(abertura);
    faixas.forEach(function (c) { olho.observe(c.closest('section')); });
    window.addEventListener('scroll', agenda, { passive: true });
    window.addEventListener('resize', agenda, { passive: true });
  }

  /* ------------------------------------------------ as cinco partes chegam em sequência, uma vez */
  var lista = document.querySelector('[data-sequencia]');
  if (lista && 'IntersectionObserver' in window && lista.getBoundingClientRect().top > window.innerHeight * 0.9) {
    lista.classList.add('espera');
    var chegada = new IntersectionObserver(function (entradas) {
      if (!entradas.some(function (e) { return e.isIntersecting; })) return;
      chegada.disconnect();
      lista.classList.add('chegou');
      // ao fim, a lista volta ao estado de repouso (sem classes de animação)
      setTimeout(function () { lista.classList.remove('espera', 'chegou'); }, 1400);
    }, { rootMargin: '0px 0px -12% 0px' });
    chegada.observe(lista);
  }

  /* quem liga "reduzir movimento" com a página aberta vê tudo parar e aparecer */
  reduzir.addEventListener && reduzir.addEventListener('change', function () {
    if (!reduzir.matches) return;
    if (ceu) ceu.style.transform = '';
    faixas.forEach(function (c) { c.style.transform = ''; });
    if (lista) lista.classList.remove('espera', 'chegou');
  });
})();
