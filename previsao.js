// ------------------------------------------------------------
// BARRA ACIMA DA TABELA
// [Mostrar 1º e 2º trimestre] [aviso] [resumo]      [Exportar planilha]
// O botão da previsão só aparece no 3º trimestre; o de exportar, em todos.
// ------------------------------------------------------------
let modoPrevisao = false;
let modoTocado = false; // o professor já usou o botão nesta página

const ICONE_DOWNLOAD =
  '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true">' +
  '<path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z"/></svg>';

function criarBarra() {
  const barra = document.createElement("div");
  barra.className = "rco-barra-previsao";

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "rco-switch";
  botao.setAttribute("role", "switch");
  botao.innerHTML = '<span class="rco-trilho"><span class="rco-bolinha"></span></span><span>Mostrar 1º e 2º trimestre</span>';
  botao.addEventListener("click", () => {
    modoPrevisao = !modoPrevisao;
    modoTocado = true;
    sincronizar();
  });

  const aviso = document.createElement("span");
  aviso.className = "rco-aviso";

  const resumo = document.createElement("span");
  resumo.className = "rco-resumo";

  const exportar = botaoNoVisualRco(acharBotaoRco("Limpar"), "rco-btn-reserva");
  exportar.classList.add("rco-exportar-btn");
  exportar.innerHTML = ICONE_DOWNLOAD + "<span>Exportar planilha</span>";
  exportar.title = "Baixar as notas desta turma em planilha (.xlsx)";
  exportar.addEventListener("click", () => exportarTurma());

  barra.append(botao, aviso, resumo, exportar);
  return barra;
}

function garantirBarra(tabela) {
  const comPrevisao = !!(estado && estado.tri === 3 && opcoes.previsao);
  const comExportar = !!(opcoes.exportar && contextoTabela);
  if (!comPrevisao && !comExportar) {
    removerBarra();
    return;
  }

  let barra = document.querySelector(".rco-barra-previsao");
  if (!barra) barra = criarBarra();
  if (tabela.previousElementSibling !== barra) tabela.insertAdjacentElement("beforebegin", barra);

  const botao = barra.querySelector(".rco-switch");
  if (botao.hidden !== !comPrevisao) botao.hidden = !comPrevisao;
  if (botao.getAttribute("aria-checked") !== String(modoPrevisao)) {
    botao.setAttribute("aria-checked", String(modoPrevisao));
  }

  // só aparece texto se algo der errado
  const texto = comPrevisao && estado.status?.tipo === "aviso" ? estado.status.texto : "";
  const aviso = barra.querySelector(".rco-aviso");
  if (aviso.textContent !== texto) aviso.textContent = texto;

  atualizarResumo(barra.querySelector(".rco-resumo"), comPrevisao && modoPrevisao && opcoes.resumo);

  const exportar = barra.querySelector(".rco-exportar-btn");
  if (exportar.hidden !== !comExportar) exportar.hidden = !comExportar;
}

// "18 já atingiram a média  9 ainda precisam de nota  3 não alcançam só com o 3º"
function atualizarResumo(el, mostrar) {
  const r = mostrar ? resumoTurma() : null;
  const chave = r ? `${r.atingiu}|${r["em-aberto"]}|${r["nao-alcanca"]}|${opcoes.cores}` : "";
  if (el.dataset.chave === chave) return;
  el.dataset.chave = chave;
  el.replaceChildren();
  el.hidden = !r;
  if (!r) return;
  const partes = [
    [r.atingiu, r.atingiu === 1 ? "já atingiu a média" : "já atingiram a média", "rco-verde"],
    [r["em-aberto"], r["em-aberto"] === 1 ? "ainda precisa de nota" : "ainda precisam de nota", ""],
    [r["nao-alcanca"], r["nao-alcanca"] === 1 ? "não alcança só com o 3º" : "não alcançam só com o 3º", "rco-vermelho"]
  ];
  partes.forEach(([n, texto, cor]) => {
    const item = document.createElement("span");
    item.className = "rco-resumo-item";
    const num = document.createElement("strong");
    num.textContent = n;
    if (cor && opcoes.cores) num.className = cor;
    item.append(num, " " + texto);
    el.append(item);
  });
}

function removerBarra() {
  document.querySelector(".rco-barra-previsao")?.remove();
}

// ------------------------------------------------------------
// COLUNAS EXTRAS NA TABELA DO RCO
// 1º Tri | 2º Tri | [Somatória → "3º Tri"] | Meta no 3º Tri | Média Anual
// ------------------------------------------------------------
const ANTES = [["t1", "1º Tri"], ["t2", "2º Tri"]];
const DEPOIS = [["meta", "Meta no 3º Tri"], ["media", "Média Anual"]];

// Garante um grupo de células vizinhas à célula de referência (a Somatória)
function garantirGrupo(tr, ref, colunas, lado, tag) {
  const achadas = [];
  let p = lado === "antes" ? ref.previousElementSibling : ref.nextElementSibling;
  const ordem = lado === "antes" ? [...colunas].reverse() : colunas;
  for (const [col] of ordem) {
    if (!p || !p.classList.contains("rco-cel") || p.dataset.col !== col) break;
    achadas.push(p);
    p = lado === "antes" ? p.previousElementSibling : p.nextElementSibling;
  }
  if (achadas.length === colunas.length) return lado === "antes" ? achadas.reverse() : achadas;

  const nomes = new Set(colunas.map(([c]) => c));
  Array.from(tr.children).forEach((c) => {
    if (c.classList.contains("rco-cel") && nomes.has(c.dataset.col)) c.remove();
  });

  const ancora = lado === "antes" ? ref : ref.nextSibling;
  return colunas.map(([col]) => {
    const c = document.createElement(tag);
    c.className = "rco-cel";
    c.dataset.col = col;
    tr.insertBefore(c, ancora);
    return c;
  });
}

function garantirColunas(tabela, cab) {
  const thSom = cab.ths[cab.idxSomatoria];
  if (!thSom.classList.contains("rco-th-somatoria")) thSom.classList.add("rco-th-somatoria");


  garantirGrupo(cab.linhaCab, thSom, ANTES, "antes", "th")
    .forEach((th, i) => definirCelula(th, { texto: ANTES[i][1], classe: "", titulo: "" }));
  garantirGrupo(cab.linhaCab, thSom, DEPOIS, "depois", "th")
    .forEach((th, i) => definirCelula(th, { texto: DEPOIS[i][1], classe: "", titulo: "" }));

  linhasDeDados(tabela, cab).forEach((tr) => {
    const tds = celulasOriginais(tr);
    const tdSom = tds[cab.idxSomatoria];
    const chave = normalizarNome(tds[cab.idxNome]?.textContent);
    const antes = garantirGrupo(tr, tdSom, ANTES, "antes", "td");
    const depois = garantirGrupo(tr, tdSom, DEPOIS, "depois", "td");

    if (!chave) {
      [...antes, ...depois].forEach((c) => definirCelula(c, { texto: "", classe: "", titulo: "" }));
      return;
    }
    const linha = calcularLinha(chave, lerNumeroTexto(tdSom.textContent));
    antes.forEach((c, i) => definirCelula(c, linha[ANTES[i][0]]));
    depois.forEach((c, i) => definirCelula(c, linha[DEPOIS[i][0]]));
  });
}

function removerColunas(tabela) {
  tabela.querySelectorAll(".rco-cel").forEach((c) => c.remove());
  tabela.querySelectorAll(".rco-th-somatoria").forEach((c) => {
    trocarTituloSomatoria(c, false);
    c.classList.remove("rco-th-somatoria");
  });

  ["rco-modo-previsao", "rco-negrito", "rco-mostrar-av", "rco-sem-meta", "rco-sem-media"]
    .forEach((c) => tabela.classList.remove(c));
}


function aplicarModo(tabela, cab) {
  alternarClasse(tabela, "rco-modo-previsao", modoPrevisao);
  alternarClasse(tabela, "rco-negrito", opcoes.negrito);
  alternarClasse(tabela, "rco-mostrar-av", !opcoes.ocultarAvaliacoes);
  alternarClasse(tabela, "rco-sem-meta", !opcoes.colunaMeta);
  alternarClasse(tabela, "rco-sem-media", !opcoes.colunaMedia);
  if (!cab.linhaCab.classList.contains("rco-cab")) cab.linhaCab.classList.add("rco-cab");
  trocarTituloSomatoria(cab.ths[cab.idxSomatoria], modoPrevisao);

  // esconde AV1, AV2, recuperações... enquanto o modo estiver ligado
  const css = cab.idxsAvaliacoes
    .map((i) =>
      `table.rco-modo-previsao:not(.rco-mostrar-av) tr.rco-cab > :nth-child(${i + 1}),` +
      `table.rco-modo-previsao:not(.rco-mostrar-av) tbody > tr > :nth-child(${i + 1}) { display: none; }`
    )
    .join("\n");
  let style = document.getElementById("rco-previsao-ocultas");
  if (!style) {
    style = document.createElement("style");
    style.id = "rco-previsao-ocultas";
    document.head.appendChild(style);
  }
  if (style.textContent !== css) style.textContent = css;
}

function colorirSomatorias(tabela, cab) {
  linhasDeDados(tabela, cab).forEach((tr) => {
    const td = celulasOriginais(tr)[cab.idxSomatoria];
    if (!td.classList.contains("rco-td-somatoria")) td.classList.add("rco-td-somatoria");
    trocarClasse(td, ["rco-verde", "rco-vermelho"], classeNota(lerNumeroTexto(td.textContent)) || null);
  });
}
