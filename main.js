// ------------------------------------------------------------
// SINCRONIZAÇÃO E INÍCIO
// Último arquivo carregado: todas as funções dos outros já existem.
// ------------------------------------------------------------
function sincronizar() {
  injetarEstilos();

  // a tabela editada sumiu ou o RCO redesenhou as células: descarta a
  // edição e destrava os botões (nunca deixa o lápis extra sumido)
  if (edicao && (!edicao.tabela.isConnected || !edicao.tabela.querySelector(".rco-nota-wrap"))) {
    const t = edicao.tabela;
    t.querySelectorAll(".rco-nota-wrap, .rco-salvar-btn, .rco-cancelar-btn").forEach((e) => e.remove());
    t.querySelectorAll(".rco-td-editando").forEach((td) => td.classList.remove("rco-td-editando"));
    travarBotoesEditar(t, false);
    edicao = null;
  }

  const tabela = localizarTabela();
  if (!tabela) {
    removerBarra();
    return;
  }
  const cab = lerCabecalho(tabela);
  if (!cab || cab.idxSomatoria < 0 || cab.idxNome < 0) return;

  colorirSomatorias(tabela, cab);

  // durante a edição, não mexe na tabela
  if (edicao) return;

  garantirBotoesEditar(tabela, cab);
  garantirBarra(tabela);

  if (!estado || estado.tri !== 3 || !opcoes.previsao) {
    removerColunas(tabela);
    return;
  }

  // se o RCO redesenhou linhas e as colunas extras desalinharam, refaz do zero
  const totalCel = ANTES.length + DEPOIS.length;
  const linhas = linhasDeDados(tabela, cab);
  const alinhado =
    cab.linhaCab.querySelectorAll(":scope > .rco-cel").length % totalCel === 0 &&
    linhas.every((tr) => tr.querySelectorAll(":scope > .rco-cel").length <= totalCel);
  if (!alinhado) removerColunas(tabela);
  garantirColunas(tabela, cab);
  aplicarModo(tabela, cab);
}

// chamado pelo fluxo principal quando os dados mudam
function atualizarPainel() {
  agendarSync();
}

let timerDom = null;
function agendarSync() {
  clearTimeout(timerDom);
  timerDom = setTimeout(sincronizar, 150);
}

// Opções do painel: carrega e acompanha mudanças (valem na hora)
try {
  chrome.storage.sync.get(CHAVE_OPCOES).then((r) => {
    opcoes = { ...OPCOES_PADRAO, ...(r[CHAVE_OPCOES] || {}) };
    if (!modoTocado) modoPrevisao = opcoes.iniciarLigado;
    agendarSync();
  }).catch(() => {});

  chrome.storage.onChanged.addListener((mudancas, area) => {
    if (area !== "sync" || !mudancas[CHAVE_OPCOES]) return;
    const antes = opcoes;
    opcoes = { ...OPCOES_PADRAO, ...(mudancas[CHAVE_OPCOES].newValue || {}) };
    if (antes.iniciarLigado !== opcoes.iniciarLigado) modoPrevisao = opcoes.iniciarLigado;
    if (!antes.previsao && opcoes.previsao && ultimaMensagem) aoReceberAlunos(ultimaMensagem);
    if (antes.editar && !opcoes.editar && edicao) cancelarEdicao();
    agendarSync();
  });
} catch (e) {
  console.warn("[Boletim+] opções indisponíveis", e);
}

new MutationObserver((muts) => {
  const relevante = muts.some((m) => {
    const alvo = m.target.nodeType === 1 ? m.target : m.target.parentElement;
    return !alvo?.closest?.(".rco-cel, .rco-barra-previsao, .rco-banner, .rco-nota-wrap");
  });
  if (relevante) agendarSync();
}).observe(document.body, { childList: true, subtree: true, characterData: true });

agendarSync();
