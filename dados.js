// ------------------------------------------------------------
// INTERPRETAÇÃO DOS DADOS DA API
// ------------------------------------------------------------
function normalizarNome(txt) {
  return String(txt || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function paraNumero(v) {
  if (v && typeof v === "object") v = v.valor ?? v.nota ?? v.value ?? null;
  if (typeof v === "number" && isFinite(v)) return v;
  if (typeof v === "string" && /^\s*-?\d+([.,]\d+)?\s*$/.test(v)) return parseFloat(v.replace(",", "."));
  return null;
}

function extrairMaximo(label) {
  const m = String(label || "").match(/\(([\d.,]+)\)/);
  if (!m) return Infinity;
  const n = parseFloat(m[1].replace(",", "."));
  return isNaN(n) ? Infinity : n;
}

function interpretar(p) {
  const campos = Array.isArray(p.campos) ? p.campos : [];

  const avaliacoes = campos
    .filter((c) => /^nota/i.test(c.key))
    .map((c) => {
      const label = String(c.label || "");
      return {
        key: c.key,
        max: extrairMaximo(label),
        rec: /recupera/i.test(label),
        avs: Array.from(label.matchAll(/AV\s*(\d+)/gi)).map((m) => Number(m[1]))
      };
    });

  const chaveFinal =
    campos.find((c) => c.key === "final")?.key ||
    campos.find((c) => /somat/i.test(c.label || ""))?.key ||
    "final";

  const alunos = (p.dados || [])
    .map((r) => ({
      chave: normalizarNome(r.nome),
      nome: String(r.nome || "").trim(),
      num: r.numChamada,
      codMatrizAluno: r.codMatrizAluno,
      situacao: String(r.descrAbrevSituacaoMatricula ?? "").trim(),
      final: paraNumero(r[chaveFinal]),
      notas: Object.fromEntries(avaliacoes.map((a) => [a.key, paraNumero(r[a.key])]))
    }))
    .filter((a) => a.chave);

  return { avaliacoes, alunos };
}

function pontosPendentes(dados) {
  const base = dados.avaliacoes.filter((a) => !a.rec);
  const recs = dados.avaliacoes.filter((a) => a.rec);
  const porAv = new Map(base.map((a) => [a.avs[0], a]));
  const grupos = [];
  const usados = new Set();

  recs.forEach((r) => {
    const bases = r.avs.map((n) => porAv.get(n)).filter((b) => b && !usados.has(b.key));
    if (!bases.length) return;
    bases.forEach((b) => usados.add(b.key));
    grupos.push({ bases, recs: [r] });
  });
  base.forEach((b) => {
    if (!usados.has(b.key)) grupos.push({ bases: [b], recs: [] });
  });

  let total = 0;
  let pendentes = 0;
  let desconhecido = false;

  grupos.forEach((g) => {
    const max = g.bases.reduce((s, b) => s + b.max, 0);
    const aplicada = dados.alunos.some((al) =>
      [...g.bases, ...g.recs].some((x) => al.notas[x.key] != null)
    );
    if (!isFinite(max)) {
      if (!aplicada) desconhecido = true;
      return;
    }
    total += max;
    if (!aplicada) pendentes += max;
  });

  const naoCriadas = desconhecido ? 0 : Math.max(0, CONFIG.notaMaxTrimestre - total);
  return { pendentes: pendentes + naoCriadas, naoCriadas, desconhecido };
}

// ------------------------------------------------------------
// CÁLCULO POR ESTUDANTE
// ------------------------------------------------------------
const fmt = (n) => (n == null ? "—" : (Math.round(n * 100) / 100).toFixed(1));
const ALVO_ANUAL = CONFIG.mediaAprovacao * CONFIG.numTrimestres;

function buscarAluno(dados, chave) {
  if (!dados) return null;
  return (
    dados.alunos.find((a) => a.chave === chave) ||
    dados.alunos.find((a) => a.chave.includes(chave) || chave.includes(a.chave)) ||
    null
  );
}

function classeNota(n) {
  if (n == null || !opcoes.cores) return "";
  return n < CONFIG.mediaAprovacao - EPS ? "rco-vermelho" : "rco-verde";
}

function calcularLinha(chave, parcialTela) {
  const { atual, t1, t2 } = estado;
  const aluno = buscarAluno(atual, chave);
  const carregando = !t1 || !t2;
  const n1 = buscarAluno(t1, chave)?.final ?? null;
  const n2 = buscarAluno(t2, chave)?.final ?? null;
  const n3 = aluno ? aluno.final : parcialTela;

  const vazio = (titulo = "") => ({ texto: carregando ? "…" : "—", classe: "", titulo });
  const linha = {
    t1: carregando ? vazio() : { texto: fmt(n1), classe: classeNota(n1), titulo: "Somatória do 1º trimestre" },
    t2: carregando ? vazio() : { texto: fmt(n2), classe: classeNota(n2), titulo: "Somatória do 2º trimestre" },
    meta: vazio(),
    media: vazio()
  };
  if (carregando) return linha;

  if (aluno?.situacao && aluno.final == null) {
    linha.meta.titulo = linha.media.titulo = aluno.situacao;
    return linha;
  }
  if (n1 == null || n2 == null) {
    linha.meta.titulo = linha.media.titulo = "Sem nota em um dos trimestres anteriores";
    return linha;
  }

  const { meta, parcial, falta, media, situacao } = calcularAnual(n1, n2, n3);
  linha.meta.texto = fmt(meta);
  if (situacao === "atingiu") {
    linha.meta.classe = opcoes.cores ? "rco-verde" : "";
    linha.meta.titulo = "Já atingiu a meta";
  } else if (situacao === "nao-alcanca") {
    linha.meta.classe = opcoes.cores ? "rco-vermelho" : "";
    linha.meta.titulo = "Acima de 10: não alcança só com o 3º trimestre";
  } else {
    linha.meta.titulo = `Faltam ${fmt(falta)} (já tem ${fmt(parcial)} no 3º)`;
  }

  linha.media = {
    texto: fmt(media),
    classe: classeNota(media),
    titulo: `(${fmt(n1)} + ${fmt(n2)} + ${fmt(parcial)}) ÷ 3, com o 3º trimestre até agora`
  };
  return linha;
}

// Meta, média e situação de um estudante no ano.
// Meta: quanto precisa somar no 3º para a média anual chegar a 6,0.
// Média: média dos três trimestres, com o 3º como está agora.
function calcularAnual(n1, n2, n3) {
  const meta = Math.max(0, ALVO_ANUAL - n1 - n2);
  const parcial = n3 ?? 0;
  const falta = Math.max(0, meta - parcial);
  const media = (n1 + n2 + parcial) / CONFIG.numTrimestres;
  let situacao = "em-aberto";
  if (falta <= EPS) situacao = "atingiu";
  else if (meta > CONFIG.notaMaxTrimestre + EPS) situacao = "nao-alcanca";
  return { meta, parcial, falta, media, situacao };
}

// Contagem da turma no 3º trimestre (estudantes ativos com 1º e 2º tri).
function resumoTurma() {
  if (!estado?.atual || !estado.t1 || !estado.t2) return null;
  const r = { atingiu: 0, "em-aberto": 0, "nao-alcanca": 0 };
  estado.atual.alunos.forEach((a) => {
    if (a.situacao && a.final == null) return;
    const n1 = buscarAluno(estado.t1, a.chave)?.final;
    const n2 = buscarAluno(estado.t2, a.chave)?.final;
    if (n1 == null || n2 == null) return;
    r[calcularAnual(n1, n2, a.final).situacao]++;
  });
  return r;
}

// ------------------------------------------------------------
// NOTAS DIGITADAS NA EDIÇÃO
// ------------------------------------------------------------
function formatarNota(v) {
  if (v == null || v === "" || v === "-") return "";
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? "" : n.toFixed(1);
}

// Máximo como o RCO escreve no aviso: 1.0 → "1", 2.5 → "2.5"
function fmtMaximo(max) {
  return String(Number(Number(max).toFixed(1)));
}

// Ponto decimal automático: os dígitos digitados viram nota com uma casa
// decimal ("10" → "1.0", "25" → "2.5", "100" → "10.0").
function mascararNota(txt) {
  const digitos = String(txt).replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  if (!digitos) return "";
  return (parseInt(digitos, 10) / 10).toFixed(1);
}

// Lê a nota digitada; retorna { vazio } | { nota:"x.y", acima? } | { erro }
function lerEntrada(txt, max) {
  const t = String(txt).trim().replace(",", ".");
  if (t === "" || t === "-") return { vazio: true };
  if (!/^\d+(\.\d+)?$/.test(t)) return { erro: "número inválido" };
  const n = parseFloat(t);
  if (isFinite(max) && n > max + 1e-9) return { nota: n.toFixed(1), acima: true, max };
  return { nota: n.toFixed(1) };
}
