// ------------------------------------------------------------
// FAIXA DE AVISO NO VISUAL DO RCO
// Todas as mensagens usam a faixa verde "Sucesso ao alterar Avaliação"
// do RCO (mesma cor, mesmo ×): ícone, texto, uma ação opcional (ex.:
// Desfazer) e o × para fechar. O tipo só muda o ícone.
// Entra no mesmo lugar da faixa do RCO (acima do título "AVALIAÇÃO"),
// junto com a página, e a página rola até ela, como o RCO faz.
// ------------------------------------------------------------
const ICONES_AVISO = {
  ok:
    '<svg viewBox="0 0 24 24" width="1.15em" height="1.15em" fill="currentColor" aria-hidden="true">' +
    '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
  erro:
    '<svg viewBox="0 0 24 24" width="1.15em" height="1.15em" fill="currentColor" aria-hidden="true">' +
    '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>',
  info:
    '<svg viewBox="0 0 24 24" width="1.15em" height="1.15em" fill="currentColor" aria-hidden="true">' +
    '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>'
};

let timerBanner = null;

// tipo: "ok" | "erro" | "info"
// opts.acao = { texto, fn }  opts.duracao em ms (0 = só fecha no ×)
function mostrarBanner(texto, tipo = "ok", opts = {}) {
  fecharBanner();

  const banner = document.createElement("div");
  banner.className = `rco-banner rco-banner-${tipo}`;
  banner.setAttribute("role", tipo === "erro" ? "alert" : "status");

  const icone = document.createElement("span");
  icone.className = "rco-banner-icone";
  icone.innerHTML = ICONES_AVISO[tipo] || ICONES_AVISO.info;

  const msg = document.createElement("span");
  msg.className = "rco-banner-texto";
  msg.textContent = texto;

  banner.append(icone, msg);

  if (opts.acao) {
    const acao = document.createElement("button");
    acao.type = "button";
    acao.className = "rco-banner-acao";
    acao.textContent = opts.acao.texto;
    acao.addEventListener("click", () => opts.acao.fn());
    banner.append(acao);
  }

  const fechar = document.createElement("button");
  fechar.type = "button";
  fechar.className = "rco-banner-fechar";
  fechar.setAttribute("aria-label", "Fechar aviso");
  // × igual ao do RCO: pequeno, traço grosso, claro e translúcido
  fechar.innerHTML =
    '<svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">' +
    '<path d="M1.3 1.3l7.4 7.4M8.7 1.3l-7.4 7.4" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
  fechar.addEventListener("click", fecharBanner);
  banner.append(fechar);

  inserirBanner(banner);

  const duracao = opts.duracao ?? (tipo === "erro" ? 12000 : 8000);
  if (duracao > 0) timerBanner = setTimeout(fecharBanner, duracao);
  return banner;
}

function fecharBanner() {
  clearTimeout(timerBanner);
  document.querySelectorAll(".rco-banner").forEach((b) => b.remove());
}

// Título "AVALIAÇÃO" da página: a faixa do RCO fica logo acima dele.
function acharTituloPagina() {
  const candidatos = document.querySelectorAll("h1, h2, h3, h4, h5, h6, span, div, p");
  for (const el of candidatos) {
    if (el.closest(".rco-banner, .rco-barra-previsao, table")) continue;
    if (el.children.length > 2) continue;
    if (/^avalia[cç][aã]o$/i.test(el.textContent.trim())) return el;
  }
  return null;
}

function inserirBanner(banner) {
  let alvo = acharTituloPagina();
  // sobe enquanto o elemento só embrulha o título (ex.: div > h4)
  while (alvo && alvo.parentElement && alvo.parentElement.children.length === 1 &&
         alvo.parentElement.textContent.trim() === alvo.textContent.trim()) {
    alvo = alvo.parentElement;
  }
  if (!alvo) alvo = document.querySelector(".rco-barra-previsao") || localizarTabela();
  if (alvo?.parentElement) alvo.insertAdjacentElement("beforebegin", banner);
  else document.body.prepend(banner);

  // rola até a faixa, descontando o cabeçalho fixo do RCO
  let topoFixo = 0;
  document.querySelectorAll("header, mat-toolbar, nav, .navbar, .mat-toolbar").forEach((h) => {
    const pos = getComputedStyle(h).position;
    const r = h.getBoundingClientRect();
    if ((pos === "fixed" || pos === "sticky") && r.top <= 1 && r.height > 0 && r.height < 200) {
      topoFixo = Math.max(topoFixo, r.bottom);
    }
  });
  const y = banner.getBoundingClientRect().top + window.scrollY - topoFixo - 16;
  try {
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  } catch {}
}
