// ============================================================
// EDIÇÃO DE NOTAS (a única função que grava no RCO)
//
// Um lápis extra ao lado do lápis de cada coluna do RCO. Ao clicar:
// - as notas da coluna viram campos (sobrepostos ao texto do RCO,
//   sem removê-lo);
// - o lápis vira [disquete][Limpar]; os lápis das outras colunas travam;
// - nota acima do valor da avaliação mostra o aviso do RCO e não salva;
// - ao salvar: grava, confere, registra no histórico e oferece Desfazer.
// ============================================================
let edicao = null;           // edição aberta
let ultimoSalvamento = null; // para o Desfazer
let edicaoBloqueada = false; // o formato do RCO mudou: edição desligada nesta página

const ICONE_LAPIS =
  '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">' +
  '<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';

const ICONE_DISQUETE =
  '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">' +
  '<path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zm2 16H5V5h11.17L19 7.83V19zM12 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM6 6h9v4H6V6z"/></svg>';

// ------------------------------------------------------------
// COLUNAS EDITÁVEIS
// ------------------------------------------------------------
const rotuloColuna = (col) => String(col.label || "").split("\n")[0].trim() || "a coluna";
// sem acentos, maiúsculas, só letras e números ("AV1 (2.0)" → "AV120")
const normalizarRotulo = (t) =>
  String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");

// Casa cada coluna de avaliação da tabela com o campo nota<código> da API.
// Se a quantidade ou os nomes não baterem, o RCO mudou: retorna null e
// a edição não é oferecida (evita gravar na avaliação errada).
function interpretarColunas(cab) {
  const campos = contextoTabela?.campos || [];
  const notaCampos = campos.filter((c) => /^nota/i.test(c.key));
  if (!cab.idxsAvaliacoes.length || notaCampos.length !== cab.idxsAvaliacoes.length) return null;

  const cols = cab.idxsAvaliacoes.map((idx, i) => {
    const c = notaCampos[i];
    return { idx, key: c.key, label: c.label || "", max: extrairMaximo(c.label) };
  });
  const confere = cols.every((col) => {
    const nome = normalizarRotulo(rotuloColuna(col));
    return nome && normalizarRotulo(cab.ths[col.idx].textContent).includes(nome);
  });
  return confere ? cols : null;
}

// Casa a coluna clicada (key nota<código>) com a avaliação da API.
function acharAvaliacao(avaliacoes, colKey, colMax) {
  const cod = String(colKey).replace(/^nota/i, "");
  const porCodigo = avaliacoes.find((x) => String(x.codAvaliacaoParcialClasse) === cod);
  if (porCodigo) return porCodigo;
  const mesmoPeso = avaliacoes.filter((x) => Math.abs(parseFloat(x.pesoDecimal) - colMax) < 0.001);
  return mesmoPeso.length === 1 ? mesmoPeso[0] : null;
}

// ------------------------------------------------------------
// BOTÕES DO CABEÇALHO (visual do RCO)
// ------------------------------------------------------------
// Clona o lápis do próprio RCO: mesmas classes e atributos de estilo,
// sem os eventos dele.
function criarBotaoCabecalho(th, classe, icone, titulo) {
  const lapisRco = th.querySelector("button:not(.rco-hdr-btn)");
  const btn = botaoNoVisualRco(lapisRco, "rco-btn-reserva-azul");
  if (lapisRco) {
    if (lapisRco.offsetHeight) btn.style.height = lapisRco.offsetHeight + "px";
    if (lapisRco.offsetWidth) btn.style.minWidth = lapisRco.offsetWidth + "px";
  }
  if (icone === "lapis" && lapisRco?.firstElementChild) {
    btn.appendChild(lapisRco.firstElementChild.cloneNode(true));
  } else {
    btn.innerHTML = icone === "lapis" ? ICONE_LAPIS : ICONE_DISQUETE;
  }
  btn.classList.add("rco-hdr-btn", classe);
  btn.title = titulo;
  btn.setAttribute("aria-label", titulo);
  btn.addEventListener("mousedown", (e) => e.stopPropagation());
  return btn;
}

function criarBotaoLimpar(altura) {
  const btn = botaoNoVisualRco(acharBotaoRco("Limpar"), "rco-btn-reserva");
  btn.textContent = "Limpar";
  btn.classList.add("rco-hdr-btn", "rco-cancelar-btn");
  if (altura) btn.style.height = altura + "px";
  btn.title = "Descartar as alterações desta coluna";
  btn.addEventListener("mousedown", (e) => e.stopPropagation());
  return btn;
}

function garantirBotoesEditar(tabela, cab) {
  const cols = opcoes.editar && !edicaoBloqueada ? interpretarColunas(cab) : null;
  if (!cols) {
    tabela.querySelectorAll(".rco-editar-btn").forEach((b) => b.remove());
    return;
  }
  cols.forEach((col) => {
    const th = cab.ths[col.idx];
    if (!th) return;
    const existente = th.querySelector(".rco-editar-btn");
    if (existente) {
      if (!edicao && (existente.disabled || existente.hidden)) {
        existente.disabled = false;
        existente.hidden = false;
      }
      return;
    }
    const btn = criarBotaoCabecalho(th, "rco-editar-btn", "lapis", `Alterar aqui as notas de ${rotuloColuna(col)}`);
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!btn.disabled) iniciarEdicao(tabela, cab, col.idx, col);
    });
    const lapis = th.querySelector("button:not(.rco-hdr-btn)");
    if (lapis) lapis.insertAdjacentElement("afterend", btn);
    else th.appendChild(btn);
  });
}

// Trava os lápis da extensão e os lápis do próprio RCO (que abrem o
// formulário "Alterar Avaliação") enquanto uma coluna está sendo editada.
function travarBotoesEditar(tabela, travar) {
  tabela.querySelectorAll(".rco-editar-btn").forEach((b) => {
    b.disabled = travar;
    b.hidden = false;
  });
  tabela.querySelectorAll("th button:not(.rco-hdr-btn), .rco-rco-travado").forEach((b) => {
    if (travar) {
      b.classList.add("rco-rco-travado");
      b.setAttribute("aria-disabled", "true");
      b.setAttribute("tabindex", "-1");
    } else if (b.classList.contains("rco-rco-travado")) {
      b.classList.remove("rco-rco-travado");
      b.removeAttribute("aria-disabled");
      b.removeAttribute("tabindex");
    }
  });
}

// Garantia extra: clique num botão travado do RCO não chega ao Angular
document.addEventListener("click", (e) => {
  if (e.target.closest?.(".rco-rco-travado")) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
}, true);

// Troca o lápis da coluna editada por [disquete][Limpar]
function mostrarAcoesEdicao(botaoLapis) {
  if (!botaoLapis) return;
  const th = botaoLapis.closest("th");
  botaoLapis.hidden = true;

  const salvar = criarBotaoCabecalho(th, "rco-salvar-btn", "disquete", "Alterar: salvar as notas desta coluna");
  salvar.addEventListener("click", (e) => {
    e.stopPropagation();
    salvarEdicao();
  });

  const limpar = criarBotaoLimpar(botaoLapis.offsetHeight || salvar.offsetHeight);
  limpar.addEventListener("click", (e) => {
    e.stopPropagation();
    cancelarEdicao();
  });

  botaoLapis.insertAdjacentElement("afterend", salvar);
  salvar.insertAdjacentElement("afterend", limpar);
}

// ------------------------------------------------------------
// ABRIR / FECHAR A EDIÇÃO
// ------------------------------------------------------------
async function iniciarEdicao(tabela, cab, idxCol, colInfo) {
  if (edicao) return;
  const botao = cab.ths[idxCol].querySelector(".rco-editar-btn");
  // enquanto uma coluna é editada, os lápis das outras ficam travados
  travarBotoesEditar(tabela, true);
  ultimoSalvamento = null;
  fecharBanner();

  try {
    if (!contextoTabela) throw new Error("recarregue a página de avaliação");
    const resp = await pedirInj("avaliacoes", {
      codClasse: contextoTabela.codClasse,
      codPeriodo: contextoTabela.codPeriodo
    });
    const aval = acharAvaliacao(resp.avaliacoes || [], colInfo.key, colInfo.max);
    if (!aval) throw new Error("não identifiquei esta avaliação no RCO");

    edicao = {
      tabela,
      idxCol,
      col: colInfo,
      aval,
      max: colInfo.max,
      dataAtualizacaoVista: aval.dataAtualizacao || null,
      inputs: new Map(),   // codMatrizAluno -> input
      originais: new Map() // td -> texto original
    };
    montarCamposColuna(tabela, cab, idxCol);
    mostrarAcoesEdicao(botao);
  } catch (e) {
    mostrarBanner(`Não foi possível abrir a edição: ${e.message}.`, "erro");
    travarBotoesEditar(tabela, false);
    edicao = null;
    sincronizar();
  }
}

function montarCamposColuna(tabela, cab, idxCol) {
  linhasDeDados(tabela, cab).forEach((tr) => {
    const tds = celulasOriginais(tr);
    const td = tds[idxCol];
    if (!td) return;
    const chave = normalizarNome(tds[cab.idxNome]?.textContent);
    const aluno = contextoTabela?.interpretado.alunos.find((a) => a.chave === chave);
    const codMatriz = aluno?.codMatrizAluno;
    const inativo = !!(aluno && aluno.situacao); // Transf, Concl… = sem matrícula ativa
    // sem matrícula ativa: a célula fica como o RCO mostra, sem campo
    if (codMatriz == null || inativo) return;

    const original = td.textContent.trim();
    edicao.originais.set(td, original);

    const wrap = document.createElement("span");
    wrap.className = "rco-nota-wrap";

    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "numeric";
    input.autocomplete = "off";
    input.className = "rco-nota-input";
    input.value = formatarNota(original);
    input.dataset.codMatriz = codMatriz ?? "";
    input.__td = td;
    input.setAttribute("aria-label", `Nota de ${aluno?.nome || "estudante"}`);
    input.addEventListener("mousedown", (e) => e.stopPropagation());

    // aviso igual ao do RCO: "O campo Nota precisa ser 1 ou menor."
    const aviso = document.createElement("span");
    aviso.className = "rco-campo-erro";
    aviso.hidden = true;

    edicao.inputs.set(String(codMatriz), input);

    input.addEventListener("input", () => {
      aplicarMascara(input);
      validarInput(input);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === "ArrowDown") {
        e.preventDefault();
        focarProximo(input, 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        focarProximo(input, -1);
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelarEdicao();
      }
    });

    wrap.append(input, aviso);
    // a cor do texto do RCO vai para o campo; o texto original fica
    // invisível embaixo dele (continua no DOM, só não aparece)
    input.style.color = getComputedStyle(td).color;
    td.classList.add("rco-td-editando");
    td.appendChild(wrap);
    validarInput(input);
  });

  tabela.classList.add("rco-editando");
  const primeiro = [...edicao.inputs.values()][0];
  if (primeiro) {
    primeiro.focus();
    primeiro.select?.();
  }
}

function aplicarMascara(input) {
  const novo = mascararNota(input.value);
  if (input.value !== novo) {
    input.value = novo;
    input.setSelectionRange?.(novo.length, novo.length);
  }
}

function focarProximo(input, dir) {
  const todos = [...edicao.inputs.values()];
  const alvo = todos[todos.indexOf(input) + dir];
  if (alvo) {
    alvo.focus();
    alvo.select?.();
  } else if (dir === 1) {
    edicao.tabela.querySelector(".rco-salvar-btn")?.focus();
  }
}

// Mostra/esconde o aviso vermelho ao lado do campo. Retorna true se válido.
function validarInput(input) {
  const r = lerEntrada(input.value, edicao.max);
  const aviso = input.nextElementSibling;
  const invalido = !!(r.acima || r.erro);
  input.classList.toggle("rco-nota-acima", invalido);
  if (aviso) {
    aviso.hidden = !invalido;
    aviso.textContent = r.acima
      ? `O campo Nota precisa ser ${fmtMaximo(edicao.max)} ou menor.`
      : r.erro ? "O campo Nota precisa ser um número." : "";
  }
  return !invalido;
}

function limparCampos() {
  if (!edicao) return;
  edicao.tabela.querySelectorAll(".rco-nota-wrap").forEach((w) => w.remove());
  edicao.originais.forEach((_, td) => td.classList.remove("rco-td-editando"));
  edicao.tabela.classList.remove("rco-editando");
  edicao.tabela.querySelectorAll(".rco-salvar-btn, .rco-cancelar-btn").forEach((b) => b.remove());
  travarBotoesEditar(edicao.tabela, false);
}

function cancelarEdicao() {
  if (!edicao) return;
  limparCampos();
  edicao = null;
  sincronizar();
}

// ------------------------------------------------------------
// SALVAR
// ------------------------------------------------------------
// Notas atuais da coluna (da consulta do RCO), para preservar as não editadas
function existentesDaColuna(colKey) {
  const existentes = {};
  (contextoTabela?.dados || []).forEach((r) => {
    if (r.codMatrizAluno == null) return;
    const n = paraNumero(r[colKey]);
    existentes[String(r.codMatrizAluno)] = n == null ? "" : n.toFixed(1);
  });
  return existentes;
}

// Envia ao injetado.js; lança erro com mensagem já traduzida.
async function gravar({ codAvaliacao, pesoDecimal, dataAvaliacao, dataAtualizacaoVista, colKey, alteracoes }) {
  let r;
  try {
    r = await pedirInj("salvar", {
      codClasse: contextoTabela.codClasse,
      codPeriodo: contextoTabela.codPeriodo,
      codAvaliacao,
      pesoDecimal,
      dataAvaliacao,
      dataAtualizacaoVista,
      existentes: existentesDaColuna(colKey),
      alteracoes
    });
  } catch (e) {
    if (e.dados?.formato) {
      edicaoBloqueada = true;
      console.warn("[Boletim+] formato inesperado do RCO:", e.dados.detalhe);
    }
    throw e;
  }
  if (!r.ok) {
    console.warn("[Boletim+] PUT recusado — status:", r.status, "| resposta do RCO:", r.mensagem);
    throw new Error(interpretarErroSalvar(r.status, r.mensagem));
  }
  return r;
}

function interpretarErroSalvar(status, mensagem) {
  let msg = "";
  try {
    const j = JSON.parse(mensagem);
    msg = j.message || j.error || j.mensagem || "";
  } catch {
    msg = String(mensagem || "").slice(0, 140);
  }
  if (status === 400 && !msg) return "o RCO recusou (verifique se o período está aberto)";
  if (status === 401 || status === 403) return "sessão expirada, recarregue a página";
  return msg || `erro ${status} do RCO`;
}

async function salvarEdicao() {
  if (!edicao) return;

  const invalidos = [];
  const alteracoes = [];
  const reverter = [];
  for (const [codMatriz, input] of edicao.inputs) {
    if (!validarInput(input)) {
      invalidos.push(input);
      continue;
    }
    const r = lerEntrada(input.value, edicao.max);
    const novo = r.vazio ? "" : r.nota;
    const antigo = formatarNota(edicao.originais.get(input.__td));
    if (novo !== antigo) {
      alteracoes.push({ codMatrizAluno: codMatriz, nota: novo });
      reverter.push({ codMatrizAluno: codMatriz, nota: antigo });
    }
  }

  // nota acima do valor da avaliação: o aviso já está ao lado do campo; não salva
  if (invalidos.length) {
    invalidos[0].focus();
    invalidos[0].select?.();
    return;
  }
  if (!alteracoes.length) {
    cancelarEdicao();
    mostrarBanner("Nenhuma nota foi alterada.", "info", { duracao: 4000 });
    return;
  }

  const { tabela, aval, col, idxCol } = edicao;
  const botoes = tabela.querySelectorAll(".rco-salvar-btn, .rco-cancelar-btn");
  botoes.forEach((b) => (b.disabled = true));
  tabela.querySelectorAll(".rco-nota-input").forEach((i) => (i.disabled = true));

  const pedido = {
    codAvaliacao: aval.codAvaliacaoParcialClasse,
    pesoDecimal: aval.pesoDecimal,
    dataAvaliacao: aval.dataAvaliacaoParcial,
    dataAtualizacaoVista: edicao.dataAtualizacaoVista,
    colKey: col.key,
    alteracoes
  };
  const nomes = nomesPorMatriz();

  let r;
  try {
    r = await gravar(pedido);
  } catch (e) {
    mostrarBanner(`Não salvou: ${e.message}.`, "erro");
    if (edicao) {
      tabela.querySelectorAll(".rco-nota-input").forEach((i) => {
        if (edicao.inputs.has(i.dataset.codMatriz)) i.disabled = false;
      });
      botoes.forEach((b) => (b.disabled = false));
    }
    return;
  }

  limparCampos();
  edicao = null;

  const n = alteracoes.length;
  const p = await recarregarNotas(col.key, idxCol);
  const falhas = p ? conferir(p, col.key, alteracoes, nomes) : [];

  registrarHistorico({
    acao: "alteracao",
    ...contextoDoSalvamento(r),
    avaliacao: rotuloAvaliacao(col.label),
    mudancas: alteracoes.map((a, i) => ({
      num: nomes.get(a.codMatrizAluno)?.num ?? null,
      nome: nomes.get(a.codMatrizAluno)?.nome || "",
      de: reverter[i].nota,
      para: a.nota
    }))
  });

  ultimoSalvamento = {
    ...pedido,
    idxCol,
    label: col.label,
    alteracoes: reverter,
    desfeitas: alteracoes,
    codClasse: contextoTabela.codClasse,
    codPeriodo: contextoTabela.codPeriodo
  };

  if (falhas.length) {
    mostrarBanner(avisoFalhas(falhas), "erro", { duracao: 0 });
  } else {
    const texto = `${n} nota${n > 1 ? "s salvas" : " salva"} no RCO.` +
      (p ? "" : " Os valores novos aparecem ao abrir a turma de novo.");
    mostrarBanner(texto, "ok", {
      acao: { texto: "Desfazer", fn: desfazerUltimo },
      duracao: CONFIG.desfazerSegundos * 1000
    });
    setTimeout(() => {
      if (ultimoSalvamento?.desfeitas === alteracoes) ultimoSalvamento = null;
    }, CONFIG.desfazerSegundos * 1000);
  }
}

function nomesPorMatriz() {
  const m = new Map();
  (contextoTabela?.interpretado.alunos || []).forEach((a) => {
    if (a.codMatrizAluno != null) m.set(String(a.codMatrizAluno), { nome: a.nome, num: a.num });
  });
  return m;
}

function contextoDoSalvamento(r) {
  const c = r?.contexto || {};
  return { turma: c.turma || "", disciplina: c.disciplina || "", periodo: c.periodo || "" };
}

// Depois de gravar: as notas lidas de volta do RCO são as enviadas?
function conferir(p, colKey, alteracoes, nomes) {
  const porMatriz = new Map((p.dados || []).map((r) => [String(r.codMatrizAluno), r]));
  return alteracoes
    .filter((a) => {
      const linha = porMatriz.get(String(a.codMatrizAluno));
      if (!linha) return true;
      return formatarNota(paraNumero(linha[colKey])) !== a.nota;
    })
    .map((a) => nomes.get(String(a.codMatrizAluno))?.nome || "estudante");
}

function avisoFalhas(falhas) {
  const lista = falhas.slice(0, 3).join(", ") + (falhas.length > 3 ? ` e mais ${falhas.length - 3}` : "");
  return falhas.length === 1
    ? `Atenção: a nota de ${lista} não ficou gravada. Confira no RCO.`
    : `Atenção: ${falhas.length} notas não ficaram gravadas (${lista}). Confira no RCO.`;
}

// ------------------------------------------------------------
// DESFAZER
// ------------------------------------------------------------
async function desfazerUltimo() {
  const u = ultimoSalvamento;
  if (!u || edicao) return;
  if (!contextoTabela || String(contextoTabela.codClasse) !== String(u.codClasse) ||
      contextoTabela.codPeriodo !== u.codPeriodo) {
    mostrarBanner("Não foi possível desfazer: a turma na tela mudou.", "erro");
    return;
  }
  ultimoSalvamento = null;
  mostrarBanner("Desfazendo…", "info", { duracao: 0 });
  const nomes = nomesPorMatriz();

  try {
    // a avaliação acabou de ser gravada por nós; a data de atualização mudou
    const r = await gravar({ ...u, dataAtualizacaoVista: null, alteracoes: u.alteracoes });
    const p = await recarregarNotas(u.colKey, u.idxCol);
    const falhas = p ? conferir(p, u.colKey, u.alteracoes, nomes) : [];
    registrarHistorico({
      acao: "desfazer",
      ...contextoDoSalvamento(r),
      avaliacao: rotuloAvaliacao(u.label),
      mudancas: u.alteracoes.map((a, i) => ({
        num: nomes.get(a.codMatrizAluno)?.num ?? null,
        nome: nomes.get(a.codMatrizAluno)?.nome || "",
        de: u.desfeitas[i].nota,
        para: a.nota
      }))
    });
    if (falhas.length) mostrarBanner(avisoFalhas(falhas), "erro", { duracao: 0 });
    else mostrarBanner("Alteração desfeita. As notas voltaram ao que eram.", "ok");
  } catch (e) {
    mostrarBanner(`Não foi possível desfazer: ${e.message}.`, "erro");
  }
}

// ------------------------------------------------------------
// ATUALIZAR A TELA DEPOIS DE GRAVAR
// ------------------------------------------------------------
// Troca o valor de uma célula alterando o nó de texto existente,
// como o próprio Angular do RCO faz, sem remover nada do DOM dele.
function escreverTexto(td, valor) {
  for (const n of td.childNodes) {
    if (n.nodeType === 3 && n.nodeValue.trim() !== "") {
      n.nodeValue = valor;
      return;
    }
  }
  const filho = td.firstElementChild;
  if (filho && !filho.children.length && !filho.classList.contains("rco-nota-wrap")) {
    filho.textContent = valor;
    return;
  }
  td.appendChild(document.createTextNode(valor));
}

// Rebusca as notas e atualiza a coluna editada e a somatória no lugar.
// Retorna a consulta nova (ou null se não conseguiu).
async function recarregarNotas(colKey, idxCol) {
  if (!contextoTabela) return null;
  try {
    const p = await obterPeriodo(contextoTabela.codClasse, contextoTabela.codPeriodo, true);
    contextoTabela.campos = p.campos;
    contextoTabela.dados = p.dados;
    contextoTabela.interpretado = interpretar(p);
    if (estado) {
      estado.atual = interpretar(p);
      estado.versao = ++versaoFluxo;
    }

    const tabela = localizarTabela();
    const cab = tabela && lerCabecalho(tabela);
    if (cab) {
      const chaveFinal =
        (p.campos || []).find((c) => c.key === "final")?.key ||
        (p.campos || []).find((c) => /somat/i.test(c.label || ""))?.key ||
        "final";
      const porChave = new Map(p.dados.map((r) => [normalizarNome(r.nome), r]));
      const fmtV = (v) => (v == null || v === "" ? "-" : String(v));
      linhasDeDados(tabela, cab).forEach((tr) => {
        const tds = celulasOriginais(tr);
        const dado = porChave.get(normalizarNome(tds[cab.idxNome]?.textContent));
        if (!dado) return;
        if (tds[idxCol]) escreverTexto(tds[idxCol], fmtV(dado[colKey]));
        if (tds[cab.idxSomatoria]) escreverTexto(tds[cab.idxSomatoria], fmtV(dado[chaveFinal]));
      });
    }
    sincronizar();
    return p;
  } catch (e) {
    console.warn("[Boletim+] recarregar", e);
    return null;
  }
}
