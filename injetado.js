// ============================================================
// Boletim+ | roda no contexto da página (world: MAIN)
// 1) Observa a consulta avaliacaoParcialAlunos que o RCO faz.
// 2) Quando os scripts da extensão pedem, repete essa consulta para
//    outro codPeriodoAvaliacao, com os mesmos cabeçalhos (token e
//    consumerid). Os cabeçalhos nunca saem deste script.
// 3) Grava notas editadas (PUT igual ao do RCO), após conferir o
//    formato das respostas.
// ============================================================
(() => {
  if (window.__RCO_PREVISAO_INJ__) return;
  window.__RCO_PREVISAO_INJ__ = true;

  const TAG = "rco-previsao";
  const HOST = "apigateway-educacao.paas.pr.gov.br";
  const CAMINHO = /\/relatorios\/avaliacaoParcialAlunos$/;
  const BASE_API = "https://" + HOST + "/seed/rcdig/estadual/v1/classe/v1/";
  const fetchOriginal = window.fetch;
  const bases = new Map(); // codClasse -> { url, headers }
  let cabecalhosAuth = null; // últimos cabeçalhos autenticados vistos (token, consumerid, grupo)
  const classesVistas = new Map();  // codClasse -> objeto classe {codClasse, turma, disciplina}
  const periodosVistos = new Map(); // codPeriodoAvaliacao -> objeto periodoAvaliacao completo
  const datasRef = new Map();       // codClasse -> data=YYYY-MM-DD usada pelo RCO nas consultas

  const enviar = (m) => window.postMessage({ [TAG]: m.tipo, ...m }, location.origin);

  function ehApi(u) {
    try {
      return new URL(u, location.href).hostname === HOST;
    } catch {
      return false;
    }
  }

  function ehAlvo(u) {
    try {
      const x = new URL(u, location.href);
      return x.hostname === HOST && CAMINHO.test(x.pathname);
    } catch {
      return false;
    }
  }

  // Guarda os cabeçalhos que autenticam no gateway, para reusar nas nossas chamadas.
  function colherDataRef(u) {
    try {
      const x = new URL(u, location.href);
      const cod = x.searchParams.get("codClasse");
      const data = x.searchParams.get("data");
      if (cod && /^\d{4}-\d{2}-\d{2}$/.test(data || "")) datasRef.set(String(cod), data);
    } catch {}
  }

  function lembrarAuth(headers) {
    const h = {};
    for (const [k, v] of Object.entries(headers || {})) {
      const kl = k.toLowerCase();
      if (["authorization", "consumerid", "grupo"].includes(kl)) h[kl] = v;
    }
    if (h.authorization && h.consumerid) cabecalhosAuth = h;
  }

  function headersObj(h) {
    try { return Object.fromEntries(new Headers(h || {}).entries()); } catch { return {}; }
  }

  // Vasculha respostas do RCO guardando os objetos classe e periodoAvaliacao,
  // que o PUT de notas exige mas o GET da avaliação não devolve.
  function colher(raiz) {
    const pilha = [raiz];
    let n = 0;
    while (pilha.length && n++ < 20000) {
      const v = pilha.pop();
      if (!v || typeof v !== "object") continue;
      if (Array.isArray(v)) {
        for (let i = 0; i < v.length && i < 100; i++) pilha.push(v[i]);
        continue;
      }
      if (v.codClasse != null && v.turma && v.disciplina) {
        classesVistas.set(String(v.codClasse), {
          codClasse: v.codClasse,
          turma: v.turma,
          disciplina: v.disciplina
        });
      }
      if (v.codPeriodoAvaliacao != null && v.descrPeriodoAvaliacao != null) {
        periodosVistos.set(String(v.codPeriodoAvaliacao), v);
      }
      for (const k in v) pilha.push(v[k]);
    }
  }

  function lerCampos(v) {
    try { return JSON.parse(v || "null"); } catch { return null; }
  }

  function registrar(url, headers, status, campos, dados) {
    if (status !== 200 || !Array.isArray(dados)) return;
    const x = new URL(url, location.href);
    const codClasse = x.searchParams.get("codClasse");
    const codPeriodo = Number(x.searchParams.get("codPeriodoAvaliacao"));
    if (!codClasse || !codPeriodo) return;
    bases.set(codClasse, { url: x.href, headers });
    enviar({ tipo: "alunos", codClasse, codPeriodo, campos, dados });
  }

  // ---------------- fetch ----------------
  window.fetch = async function (input, init) {
    const resp = await fetchOriginal.call(window, input, init);
    try {
      const req = input instanceof Request ? input : null;
      const url = req ? req.url : String(input);
      if (ehApi(url)) {
        const headers = { ...headersObj(req?.headers), ...headersObj(init?.headers) };
        lembrarAuth(headers);
        colherDataRef(url);
        if ((resp.headers.get("content-type") || "").includes("json")) {
          resp.clone().json().then(colher).catch(() => {});
        }
        if (ehAlvo(url)) {
          const campos = lerCampos(resp.headers.get("fields"));
          resp.clone().json()
            .then((d) => registrar(url, headers, resp.status, campos, d))
            .catch(() => {});
        }
      }
    } catch {}
    return resp;
  };

  // ---------------- XMLHttpRequest ----------------
  const XP = XMLHttpRequest.prototype;
  const { open, send, setRequestHeader } = XP;

  XP.open = function (m, u, ...resto) {
    this.__rcoApi = ehApi(u) ? { url: new URL(String(u), location.href).href, headers: {}, alvo: ehAlvo(u) } : null;
    return open.call(this, m, u, ...resto);
  };

  XP.setRequestHeader = function (k, v) {
    if (this.__rcoApi) this.__rcoApi.headers[k.toLowerCase()] = v;
    return setRequestHeader.call(this, k, v);
  };

  XP.send = function (body) {
    const meta = this.__rcoApi;
    if (meta) {
      lembrarAuth(meta.headers);
      colherDataRef(meta.url);
      this.addEventListener("load", () => {
        try {
          if (this.responseType === "json") colher(this.response);
          else if (this.responseType === "" || this.responseType === "text") colher(JSON.parse(this.responseText));
        } catch {}
      });
      if (meta.alvo) {
        this.addEventListener("load", () => {
          try {
            let dados;
            if (this.responseType === "json") dados = this.response;
            else if (this.responseType === "" || this.responseType === "text") dados = JSON.parse(this.responseText);
            else return;
            registrar(meta.url, meta.headers, this.status, lerCampos(this.getResponseHeader("fields")), dados);
          } catch {}
        });
      }
    }
    return send.call(this, body);
  };

  // ---------------- chamadas autenticadas à API ----------------
  function authDisponivel(base) {
    // prioriza os cabeçalhos completos; cai para os da consulta de notas
    const h = cabecalhosAuth || base?.headers;
    if (!h || !h.authorization) throw new Error("ainda não vi uma requisição autenticada; recarregue a página");
    return h;
  }

  async function apiGET(caminho, headers) {
    const resp = await fetchOriginal.call(window, BASE_API + caminho, { headers });
    if (resp.status === 401 || resp.status === 403) throw new Error("sessão expirada, recarregue a página");
    if (!resp.ok) throw new Error("GET " + caminho.split("?")[0] + " → HTTP " + resp.status);
    return resp.json();
  }

  // Turma, disciplina e trimestre em texto (para histórico e planilha)
  function contextoDe(codClasse, codPeriodo) {
    const c = classesVistas.get(String(codClasse));
    const p = periodosVistos.get(String(codPeriodo));
    return {
      turma: c?.turma?.descrTurma || "",
      disciplina: c?.disciplina?.nomeDisciplina || "",
      periodo: p?.descrPeriodoAvaliacao || ""
    };
  }

  // Confere se as respostas do RCO têm o formato esperado. Se o RCO mudar,
  // a extensão não grava nada (melhor não salvar do que salvar errado).
  function problemaDeFormato(aval, matriz, codAvaliacao, edicoes) {
    if (!aval || typeof aval !== "object") return "avaliação sem dados";
    if (String(aval.codAvaliacaoParcialClasse) !== String(codAvaliacao)) return "código da avaliação diferente";
    if (!Array.isArray(aval.alunos) || aval.alunos.some((a) => !a || a.codMatrizAluno == null)) {
      return "lista de estudantes da avaliação";
    }
    if (!Array.isArray(matriz) || !matriz.length) return "matrícula vazia";
    if (matriz.some((m) => !m || m.codMatrizAluno == null || !("indAtivo" in m) || m.nome == null)) {
      return "campos da matrícula";
    }
    const ativos = new Set(matriz.filter((m) => m.indAtivo).map((m) => String(m.codMatrizAluno)));
    const fora = [...edicoes.keys()].filter((cod) => !ativos.has(cod));
    if (fora.length) return "estudante editado fora da matrícula ativa";
    return null;
  }

  // ---------------- salvar notas de uma avaliação ----------------
  // Refaz o mesmo fluxo do RCO: lê a avaliação e a matrícula, troca só as
  // notas editadas (mantendo todas as outras) e envia o PUT.
  async function salvarNotas(pedido) {
    const { codClasse, codPeriodo, codAvaliacao, pesoDecimal, dataAvaliacao, alteracoes } = pedido;
    const headers = authDisponivel(bases.get(String(codClasse)));
    const auth = { authorization: headers.authorization, consumerid: headers.consumerid };

    // 1) avaliação completa, com codAvaliacaoParcialAluno de cada estudante
    const aval = await apiGET(
      `avaliacaoParcialClasses/${codAvaliacao}?listas=recuperacaos,recuperadas,alunos,conteudos`,
      auth
    );

    // 2) matrícula: nome, situação, ativo, cgm, numChamada
    const data = datasRef.get(String(codClasse)) || (dataAvaliacao || "").slice(0, 10);
    const matriz = await apiGET(
      `matrizAlunos?codClasse=${codClasse}&codPeriodoAvaliacao=${codPeriodo}` +
        `&data=${data}&pesoDecimal=${encodeURIComponent(pesoDecimal)}`,
      auth
    );
    const edicoes = new Map(alteracoes.map((e) => [String(e.codMatrizAluno), e.nota]));
    const problema = problemaDeFormato(aval, matriz, codAvaliacao, edicoes);
    if (problema) {
      return {
        tipo: "salvo", reqId: pedido.reqId, formato: true, detalhe: problema,
        erro: "os dados do RCO vieram num formato diferente do esperado; por segurança, a edição foi desligada nesta página (as outras funções continuam)"
      };
    }
    const notaAtual = new Map(aval.alunos.map((a) => [String(a.codMatrizAluno), a]));
    const ativos = matriz.filter((m) => m.indAtivo); // o RCO só envia estudantes ativos

    // proteção contra edição concorrente: a avaliação mudou desde que a tela carregou?
    if (pedido.dataAtualizacaoVista && aval.dataAtualizacao &&
        pedido.dataAtualizacaoVista !== aval.dataAtualizacao) {
      return { tipo: "salvo", reqId: pedido.reqId, conflito: true,
               erro: "esta avaliação foi alterada em outro lugar; recarregue a página" };
    }

    // 3) alterações do professor e notas atuais lidas da tabela
    //    (o GET da avaliação não devolve as notas existentes)
    const existentes = new Map(Object.entries(pedido.existentes || {}));

    // 4) monta a lista de alunos preservando o que já existe e trocando só o editado
    const alunos = ativos.map((m) => {
      const cod = String(m.codMatrizAluno);
      const existente = notaAtual.get(cod);
      const aluno = {
        codMatrizAluno: m.codMatrizAluno,
        numChamada: m.numChamada,
        nome: m.nome,
        indAtivo: m.indAtivo,
        situacaoMatricula: m.situacaoMatricula,
        cgmAluno: m.cgmAluno
      };
      if (existente && existente.codAvaliacaoParcialAluno != null) {
        aluno.codAvaliacaoParcialAluno = existente.codAvaliacaoParcialAluno;
      }
      // notaDecimal: editada ("" apaga); senão a nota atual da tabela;
      // quem nunca teve nota vai SEM o campo (como o RCO envia)
      if (edicoes.has(cod)) {
        aluno.notaDecimal = edicoes.get(cod);
      } else if (existentes.has(cod) && existentes.get(cod) !== "") {
        aluno.notaDecimal = existentes.get(cod);
      }
      return aluno;
    });

    // 5) corpo do PUT: somente os campos que o próprio RCO envia
    //    (o GET com ?listas=… devolve campos extras que o servidor recusa)
    const CHAVES_PUT = [
      "codAvaliacaoParcialClasse", "codTipoAvaliacaoParcial", "numAvaliacaoParcial",
      "dataAvaliacaoParcial", "pesoDecimal", "dataAtualizacao", "codUsuario",
      "recuperacaos", "conteudos", "descrAvaliacaoParcial",
      "classe", "subClasse", "periodoAvaliacao"
    ];
    const dados = {};
    CHAVES_PUT.forEach((k) => {
      if (k in aval) dados[k] = aval[k];
    });
    // classe, subClasse e periodoAvaliacao: o RCO os envia mas o GET não os
    // devolve; usa os objetos colhidos das respostas da própria página
    dados.classe = classesVistas.get(String(codClasse)) || { codClasse };
    dados.subClasse = null;
    dados.periodoAvaliacao =
      periodosVistos.get(String(codPeriodo)) || { codPeriodoAvaliacao: Number(codPeriodo) };
    dados.alunos = alunos;

    const resp = await fetchOriginal.call(window, BASE_API + "avaliacaoParcialClasses/" + codAvaliacao, {
      method: "PUT",
      headers: { ...auth, "content-type": "application/json", grupo: headers.grupo || "D" },
      body: JSON.stringify(dados)
    });

    const texto = await resp.text().catch(() => "");
    return {
      tipo: "salvo",
      reqId: pedido.reqId,
      status: resp.status,
      ok: resp.ok,
      mensagem: texto.slice(0, 300),
      contexto: contextoDe(codClasse, codPeriodo)
    };
  }

  // ---------------- pedidos do content.js ----------------
  window.addEventListener("message", async (ev) => {
    if (ev.source !== window || !ev.data) return;
    const tipo = ev.data[TAG];

    if (tipo === "buscar") {
      const { reqId, codClasse, codPeriodo } = ev.data;
      const r = { tipo: "resposta", reqId };
      try {
        const base = bases.get(String(codClasse));
        if (!base) throw new Error("consulta original não encontrada");
        const u = new URL(base.url);
        u.searchParams.set("codPeriodoAvaliacao", String(Number(codPeriodo)));
        const resp = await fetchOriginal.call(window, u.href, { headers: base.headers });
        r.status = resp.status;
        if (resp.status === 401 || resp.status === 403) throw new Error("sessão expirada, recarregue a página");
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        r.campos = lerCampos(resp.headers.get("fields"));
        r.dados = await resp.json();
      } catch (e) {
        r.erro = e.message || String(e);
      }
      enviar(r);
      return;
    }

    if (tipo === "salvar") {
      try {
        enviar(await salvarNotas(ev.data));
      } catch (e) {
        enviar({ tipo: "salvo", reqId: ev.data.reqId, erro: e.message || String(e) });
      }
      return;
    }

    if (tipo === "contexto") {
      enviar({ tipo: "contexto-resp", reqId: ev.data.reqId, contexto: contextoDe(ev.data.codClasse, ev.data.codPeriodo) });
      return;
    }

    if (tipo === "avaliacoes") {
      const { reqId, codClasse, codPeriodo } = ev.data;
      const r = { tipo: "avaliacoes-resp", reqId };
      try {
        const headers = authDisponivel(bases.get(String(codClasse)));
        const auth = { authorization: headers.authorization, consumerid: headers.consumerid };
        // regra de cálculo (codRegraCalculo/qtdeAvaliacao) vem de avaliacaoClasses
        const ac = await apiGET(`avaliacaoClasses?codClasse=${codClasse}&codPeriodoAvaliacao=${codPeriodo}`, auth);
        const regra = ac?.regraCalculo?.codigo ?? 3;
        const qtde = ac?.qtdeAvaliacao ?? 2;
        r.avaliacoes = await apiGET(
          `avaliacaoParcialClasses?codClasse=${codClasse}&codPeriodoAvaliacao=${codPeriodo}` +
            `&codRegraCalculo=${regra}&qtdeAvaliacao=${qtde}&page=1&perPage=50`,
          auth
        );
      } catch (e) {
        r.erro = e.message || String(e);
      }
      enviar(r);
      return;
    }
  });
})();
