// ------------------------------------------------------------
// CACHE POR TURMA
// ------------------------------------------------------------
const cache = new Map(); // codClasse -> { periodos, tsPeriodos, porCod: Map(cod -> {campos,dados,ts}) }

function cacheDaClasse(codClasse) {
  if (!cache.has(codClasse)) cache.set(codClasse, { periodos: null, tsPeriodos: 0, porCod: new Map() });
  return cache.get(codClasse);
}

async function obterPeriodo(codClasse, cod, forcar = false) {
  const c = cacheDaClasse(codClasse);
  const salvo = c.porCod.get(cod);
  if (!forcar && salvo && Date.now() - salvo.ts < CONFIG.cacheMinutos * 60e3) return salvo;
  const p = await pedirPeriodo(codClasse, cod);
  const novo = { ...p, ts: Date.now() };
  c.porCod.set(cod, novo);
  return novo;
}

// Descobre quais códigos de período têm estudantes nesta turma.
// Em 2026, por exemplo: 9 (1º), 10 (2º) e 11 (3º).
async function descobrirPeriodos(codClasse, codAtual) {
  const c = cacheDaClasse(codClasse);
  if (c.periodos && c.periodos.includes(codAtual) && Date.now() - c.tsPeriodos < 30 * 60e3) {
    return c.periodos;
  }

  const cods = [];
  for (let i = Math.max(1, codAtual - CONFIG.janelaBusca); i <= codAtual + 3; i++) cods.push(i);

  const comDados = [];
  let erros = 0;
  let primeiroErro = null;

  for (let i = 0; i < cods.length; i += 5) {
    const lote = cods.slice(i, i + 5);
    const res = await Promise.all(
      lote.map((cod) => obterPeriodo(codClasse, cod).catch((e) => ({ erro: e })))
    );
    res.forEach((r, j) => {
      if (r.erro) {
        erros++;
        primeiroErro = primeiroErro || r.erro;
      } else if (r.dados.length) {
        comDados.push(lote[j]);
      }
    });
  }

  if (erros >= cods.length - 1) throw primeiroErro || new Error("falha na busca");

  c.periodos = comDados.sort((a, b) => a - b);
  c.tsPeriodos = Date.now();
  return c.periodos;
}

// ------------------------------------------------------------
// FLUXO PRINCIPAL
// ------------------------------------------------------------
let estado = null;
let versaoFluxo = 0;
let contextoTabela = null; // { codClasse, codPeriodo, campos, dados, interpretado } — para a edição em qualquer trimestre

async function aoReceberAlunos(m) {
  const minhaVersao = ++versaoFluxo;
  // outra turma ou outro trimestre carregado: uma edição aberta perde o sentido
  if (edicao && contextoTabela &&
      (String(m.codClasse) !== String(contextoTabela.codClasse) || m.codPeriodo !== contextoTabela.codPeriodo)) {
    cancelarEdicao();
  }
  const c = cacheDaClasse(m.codClasse);
  c.porCod.set(m.codPeriodo, { campos: m.campos, dados: m.dados, ts: Date.now() });
  ultimaMensagem = m;
  // contexto sempre disponível para a edição, em qualquer trimestre
  contextoTabela = {
    codClasse: m.codClasse,
    codPeriodo: m.codPeriodo,
    campos: m.campos,
    dados: m.dados,
    interpretado: interpretar(m)
  };

  // previsão desligada no painel: não faz nenhuma consulta extra
  if (!opcoes.previsao) {
    estado = null;
    atualizarPainel();
    return;
  }

  const triTela = detectarTrimestreTela();
  estado = {
    codClasse: m.codClasse,
    codPeriodo: m.codPeriodo,
    atual: interpretar(m),
    tri: triTela === 3 ? 3 : null,
    t1: null,
    t2: null,
    status: { texto: "Carregando notas do 1º e do 2º trimestre…", tipo: "info" },
    versao: minhaVersao
  };
  atualizarPainel();

  try {
    const periodos = await descobrirPeriodos(m.codClasse, m.codPeriodo);
    if (minhaVersao !== versaoFluxo) return;

    let cod1;
    let cod2;
    let tri;

    if (periodos.length === 3) {
      tri = periodos.indexOf(m.codPeriodo) + 1;
      [cod1, cod2] = periodos;
    } else if (triTela === 3) {
      // mais ou menos de 3 períodos: usa os dois anteriores ao atual
      const anteriores = periodos.filter((p) => p < m.codPeriodo);
      tri = 3;
      [cod1, cod2] = anteriores.slice(-2);
    }

    if (tri !== 3) {
      estado = null;
      atualizarPainel();
      return;
    }
    if (cod1 == null || cod2 == null) {
      throw new Error("não encontrei os períodos do 1º e 2º trimestre desta turma");
    }

    const [p1, p2] = await Promise.all([obterPeriodo(m.codClasse, cod1), obterPeriodo(m.codClasse, cod2)]);
    if (minhaVersao !== versaoFluxo) return;

    Object.assign(estado, {
      tri: 3,
      t1: interpretar(p1),
      t2: interpretar(p2),
      status: {
        texto: `Notas do 1º e do 2º trimestre carregadas do RCO às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.`,
        tipo: "ok"
      },
      versao: ++versaoFluxo
    });
  } catch (e) {
    if (!estado || estado.versao !== minhaVersao) return;
    estado.status = { texto: `Não consegui carregar o 1º e o 2º trimestre: ${e.message}.`, tipo: "aviso" };
    estado.versao = ++versaoFluxo;
    console.warn("[Boletim+]", e);
  }
  atualizarPainel();
}
