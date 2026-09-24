// ------------------------------------------------------------
// DOM: trimestre da tela e tabela do RCO
// ------------------------------------------------------------
function detectarTrimestreTela() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) =>
      n.parentElement?.closest(".rco-cel, .rco-barra-previsao, .rco-banner, script, style, option")
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT
  });
  while (walker.nextNode()) {
    const m = walker.currentNode.nodeValue.match(/\b([123])\s*[º°ª]\s*Trimestre\b/i);
    if (m) return Number(m[1]);
  }
  return null;
}

const celulasOriginais = (tr) => Array.from(tr.children).filter((c) => !c.classList.contains("rco-cel"));

// A tabela do formulário do próprio RCO (Alterar/Cadastrar Avaliação) tem
// campos de digitação e a coluna "Somatória (Prévia*)". Ali vale o fluxo
// normal do RCO: a extensão não mexe.
function ehTabelaFormulario(t) {
  const temCampos = Array.from(t.querySelectorAll("tbody input, tbody select, tbody textarea"))
    .some((i) => !i.classList.contains("rco-nota-input"));
  if (temCampos) return true;
  return Array.from(t.querySelectorAll("th")).some((th) => /PR[ÉE]VIA/i.test(th.textContent));
}

function localizarTabela() {
  for (const t of document.querySelectorAll("table")) {
    if (ehTabelaFormulario(t)) continue;
    const textos = Array.from(t.querySelectorAll("th")).map((th) => th.textContent.toUpperCase());
    const temSomatoria = textos.some((x) => x.includes("SOMAT")) || t.querySelector("th.rco-th-somatoria");
    if (temSomatoria && textos.some((x) => x.includes("NOME"))) return t;
  }
  return null;
}

const ehThSomatoria = (c) => c.classList.contains("rco-th-somatoria") || /SOMAT/i.test(c.textContent);

// Troca o texto "Somatória" por "3º Tri" no próprio cabeçalho (assim sai certo ao copiar)
function trocarTituloSomatoria(th, ligado) {
  const walker = document.createTreeWalker(th, NodeFilter.SHOW_TEXT);
  const nos = [];
  while (walker.nextNode()) nos.push(walker.currentNode);
  nos.forEach((n) => {
    if (ligado) {
      if (/somat/i.test(n.nodeValue)) {
        n.__rcoOriginal = n.nodeValue;
        n.nodeValue = n.nodeValue.replace(/somat\S*/i, "3º Tri");
      }
    } else if (n.__rcoOriginal != null) {
      if (n.nodeValue.includes("3º Tri")) n.nodeValue = n.__rcoOriginal;
      delete n.__rcoOriginal;
    }
  });
}

function lerCabecalho(tabela) {
  const linhaCab = Array.from(tabela.querySelectorAll("tr")).find((tr) =>
    Array.from(tr.children).some((c) => c.tagName === "TH" && ehThSomatoria(c))
  );
  if (!linhaCab) return null;

  const ths = celulasOriginais(linhaCab);
  const textos = ths.map((th) => th.textContent.replace(/\s+/g, " ").trim().toUpperCase());
  const idxSomatoria = ths.findIndex(ehThSomatoria);
  const idxNome = textos.findIndex((t) => t.includes("NOME"));
  const idxsAvaliacoes = textos
    .map((t, i) => (/\bAV\s*\d/.test(t) || t.includes("RECUPERA") ? i : -1))
    .filter((i) => i >= 0 && i < idxSomatoria);

  return { linhaCab, ths, idxSomatoria, idxNome, idxsAvaliacoes };
}

function linhasDeDados(tabela, cab) {
  return Array.from(tabela.querySelectorAll("tr")).filter((tr) => {
    if (tr === cab.linhaCab) return false;
    const tds = celulasOriginais(tr);
    return tds.length > cab.idxSomatoria && tds.every((c) => c.tagName === "TD");
  });
}

const lerNumeroTexto = (t) => {
  const s = String(t || "").trim().replace(",", ".");
  return /^-?\d+(\.\d+)?$/.test(s) ? parseFloat(s) : null;
};

// Só escreve no DOM quando algo mudou (evita laço com o observador)
function definirCelula(cel, { texto, classe, titulo }) {
  if (cel.textContent !== texto) cel.textContent = texto;
  const cls = `rco-cel ${classe || ""}`.trim();
  if (cel.className !== cls) cel.className = cls;
  if ((cel.title || "") !== (titulo || "")) cel.title = titulo || "";
}

function trocarClasse(el, remover, adicionar) {
  remover.forEach((c) => c !== adicionar && el.classList.contains(c) && el.classList.remove(c));
  if (adicionar && !el.classList.contains(adicionar)) el.classList.add(adicionar);
}

function alternarClasse(el, classe, ligado) {
  if (el.classList.contains(classe) !== ligado) el.classList.toggle(classe, ligado);
}

// Cor de fundo efetiva de um elemento (sobe até achar uma cor não transparente)
function corDeFundo(el) {
  for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
    const c = getComputedStyle(e).backgroundColor;
    if (c && c !== "transparent" && !/rgba\([^)]*,\s*0\)$/.test(c)) return c;
  }
  return "";
}

// Procura um botão do próprio RCO pelo texto (para copiar o visual dele)
function acharBotaoRco(texto) {
  return Array.from(document.querySelectorAll("button")).find(
    (b) => !b.closest(".rco-barra-previsao, .rco-banner") &&
      !b.classList.contains("rco-hdr-btn") &&
      b.textContent.trim() === texto
  );
}

// Cria um botão com o visual de um botão do RCO (mesmas classes e atributos
// de estilo, sem os eventos dele). Sem botão de referência, usa a classe
// de reserva indicada.
function botaoNoVisualRco(referencia, classeReserva) {
  let btn;
  if (referencia) {
    btn = referencia.cloneNode(false);
    btn.removeAttribute("id");
    btn.removeAttribute("disabled");
    btn.removeAttribute("aria-disabled");
    btn.removeAttribute("tabindex");
    btn.classList.remove("rco-rco-travado");
    btn.setAttribute("data-rco-clonado", "");
  } else {
    btn = document.createElement("button");
    btn.classList.add(classeReserva);
  }
  btn.type = "button";
  return btn;
}
