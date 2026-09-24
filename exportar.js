// ------------------------------------------------------------
// EXPORTAR A TURMA EM PLANILHA (.xlsx)
// O .xlsx é um zip de arquivos XML. Ele é montado aqui, sem
// bibliotecas: zip sem compressão (método "store") + CRC-32.
// ------------------------------------------------------------

// ---------- zip (store) ----------
const TABELA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = TABELA_CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// arquivos: [{ nome, dados: Uint8Array }] → Uint8Array do .zip
function zipSemCompressao(arquivos, data = new Date()) {
  const enc = new TextEncoder();
  const hora = (data.getHours() << 11) | (data.getMinutes() << 5) | (data.getSeconds() >> 1);
  const dia = ((data.getFullYear() - 1980) << 9) | ((data.getMonth() + 1) << 5) | data.getDate();

  const partes = [];
  const central = [];
  let offset = 0;

  arquivos.forEach((a) => {
    const nome = enc.encode(a.nome);
    const crc = crc32(a.dados);
    const tam = a.dados.length;

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // nomes em UTF-8
    local.setUint16(8, 0, true);      // sem compressão
    local.setUint16(10, hora, true);
    local.setUint16(12, dia, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, tam, true);
    local.setUint32(22, tam, true);
    local.setUint16(26, nome.length, true);
    local.setUint16(28, 0, true);
    partes.push(new Uint8Array(local.buffer), nome, a.dados);

    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true);
    cd.setUint16(6, 20, true);
    cd.setUint16(8, 0x0800, true);
    cd.setUint16(10, 0, true);
    cd.setUint16(12, hora, true);
    cd.setUint16(14, dia, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, tam, true);
    cd.setUint32(24, tam, true);
    cd.setUint16(28, nome.length, true);
    cd.setUint32(42, offset, true);
    central.push(new Uint8Array(cd.buffer), nome);

    offset += 30 + nome.length + tam;
  });

  const tamCentral = central.reduce((s, p) => s + p.length, 0);
  const fim = new DataView(new ArrayBuffer(22));
  fim.setUint32(0, 0x06054b50, true);
  fim.setUint16(8, arquivos.length, true);
  fim.setUint16(10, arquivos.length, true);
  fim.setUint32(12, tamCentral, true);
  fim.setUint32(16, offset, true);

  const todas = [...partes, ...central, new Uint8Array(fim.buffer)];
  const saida = new Uint8Array(todas.reduce((s, p) => s + p.length, 0));
  let pos = 0;
  todas.forEach((p) => {
    saida.set(p, pos);
    pos += p.length;
  });
  return saida;
}

// ---------- planilha ----------
// estilos (índice em cellXfs): 0 normal, 1 negrito, 2 número 0.0,
// 3 título, 4 número verde, 5 número vermelho
const ESTILO = { normal: 0, negrito: 1, numero: 2, titulo: 3, verde: 4, vermelho: 5 };

const escXml = (s) =>
  String(s).replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c])
    // remove caracteres de controle que o Excel não aceita
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");

function letraColuna(i) {
  let s = "";
  for (i++; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s;
  return s;
}

// linhas: arrays de células; célula = string | number | null | { v, s }
function gerarXlsx(linhas, { larguras = [], congelarAte = 0, nomeAba = "Notas" } = {}) {
  const enc = new TextEncoder();
  const NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
  const NS_R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const NS_PKG = "http://schemas.openxmlformats.org/package/2006/relationships";
  const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

  const linhasXml = linhas.map((linha, r) => {
    const celulas = linha.map((cel, c) => {
      if (cel == null || cel === "") return "";
      const { v, s } = typeof cel === "object" ? cel : { v: cel, s: undefined };
      if (v == null || v === "") return "";
      const ref = letraColuna(c) + (r + 1);
      if (typeof v === "number" && isFinite(v)) {
        return `<c r="${ref}" s="${s ?? ESTILO.numero}"><v>${v}</v></c>`;
      }
      return `<c r="${ref}" t="inlineStr" s="${s ?? ESTILO.normal}"><is><t xml:space="preserve">${escXml(v)}</t></is></c>`;
    });
    return `<row r="${r + 1}">${celulas.join("")}</row>`;
  });

  const cols = larguras.length
    ? `<cols>${larguras.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>`
    : "";
  const painel = congelarAte
    ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${congelarAte}" topLeftCell="A${congelarAte + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`
    : "";

  const planilha = `${XML}<worksheet xmlns="${NS}">${painel}${cols}<sheetData>${linhasXml.join("")}</sheetData></worksheet>`;

  const estilos = `${XML}<styleSheet xmlns="${NS}">` +
    '<numFmts count="1"><numFmt numFmtId="164" formatCode="0.0"/></numFmts>' +
    '<fonts count="5">' +
    '<font><sz val="11"/><name val="Calibri"/></font>' +
    '<font><b/><sz val="11"/><name val="Calibri"/></font>' +
    '<font><b/><sz val="13"/><name val="Calibri"/></font>' +
    '<font><sz val="11"/><color rgb="FF2E7D32"/><name val="Calibri"/></font>' +
    '<font><sz val="11"/><color rgb="FFD32F2F"/><name val="Calibri"/></font>' +
    "</fonts>" +
    '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="6">' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
    '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
    '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
    '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
    '<xf numFmtId="164" fontId="3" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>' +
    '<xf numFmtId="164" fontId="4" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>' +
    "</cellXfs>" +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    "</styleSheet>";

  const arquivos = [
    ["[Content_Types].xml", `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      "</Types>"],
    ["_rels/.rels", `${XML}<Relationships xmlns="${NS_PKG}">` +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      "</Relationships>"],
    ["xl/workbook.xml", `${XML}<workbook xmlns="${NS}" xmlns:r="${NS_R}"><sheets>` +
      `<sheet name="${escXml(nomeAba).slice(0, 31)}" sheetId="1" r:id="rId1"/></sheets></workbook>`],
    ["xl/_rels/workbook.xml.rels", `${XML}<Relationships xmlns="${NS_PKG}">` +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      "</Relationships>"],
    ["xl/styles.xml", estilos],
    ["xl/worksheets/sheet1.xml", planilha]
  ].map(([nome, texto]) => ({ nome, dados: enc.encode(texto) }));

  return zipSemCompressao(arquivos);
}

// ---------- dados da turma ----------
const rotuloAvaliacao = (label) => String(label || "").replace(/\s*\n\s*/g, " ").trim();

function celulaNota(n, colorir) {
  if (n == null) return null;
  if (!colorir || !opcoes.cores) return { v: n, s: ESTILO.numero };
  return { v: n, s: n < CONFIG.mediaAprovacao - EPS ? ESTILO.vermelho : ESTILO.verde };
}

function montarLinhasTurma(ctx, contexto = {}) {
  const campos = (ctx.campos || []).filter((c) => /^nota/i.test(c.key));
  const dados = ctx.interpretado;
  const com3 = !!(estado && estado.tri === 3 && estado.t1 && estado.t2 &&
    String(estado.codClasse) === String(ctx.codClasse) && estado.codPeriodo === ctx.codPeriodo);

  const titulo = [contexto.disciplina, contexto.periodo].filter(Boolean).join(" – ") || "Notas da turma";
  const agora = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  const cabecalho = ["Nº", "Nome", "Situação", ...campos.map((c) => rotuloAvaliacao(c.label)),
    com3 ? "3º Tri (Somatória)" : "Somatória"];
  if (com3) cabecalho.push("1º Tri", "2º Tri", "Meta no 3º Tri", "Média Anual");

  const linhas = [
    [{ v: titulo, s: ESTILO.titulo }],
    [contexto.turma ? contexto.turma.replace(/\s+/g, " ") : ""],
    [`Exportado pelo Boletim+ em ${agora}`],
    [],
    cabecalho.map((v) => ({ v, s: ESTILO.negrito }))
  ];

  dados.alunos.forEach((a) => {
    const linha = [a.num ?? null, a.nome, a.situacao || "",
      ...campos.map((c) => celulaNota(a.notas[c.key], false)),
      celulaNota(a.final, true)];
    if (com3) {
      const n1 = buscarAluno(estado.t1, a.chave)?.final ?? null;
      const n2 = buscarAluno(estado.t2, a.chave)?.final ?? null;
      const inativo = a.situacao && a.final == null;
      if (n1 != null && n2 != null && !inativo) {
        const { meta, media } = calcularAnual(n1, n2, a.final);
        linha.push(celulaNota(n1, true), celulaNota(n2, true), { v: Number(meta.toFixed(2)), s: ESTILO.numero },
          celulaNota(Number(media.toFixed(2)), true));
      } else {
        linha.push(celulaNota(n1, true), celulaNota(n2, true), null, null);
      }
    }
    linhas.push(linha);
  });

  const larguras = [5, 42, 10, ...campos.map(() => 14), 16];
  if (com3) larguras.push(9, 9, 15, 13);
  return { linhas, larguras, congelarAte: 5, titulo };
}

function nomeArquivo(contexto) {
  const partes = ["Boletim+", contexto.disciplina, contexto.turma, contexto.periodo]
    .filter(Boolean)
    .map((p) => p.replace(/\s+/g, " ").trim());
  return partes.join(" - ").replace(/[\\/:*?"<>|]/g, "-").slice(0, 150) + ".xlsx";
}

async function exportarTurma() {
  const ctx = contextoTabela;
  if (!ctx) {
    mostrarBanner("Abra a tabela de notas de uma turma para exportar.", "erro");
    return;
  }
  let contexto = {};
  try {
    contexto = (await pedirInj("contexto", { codClasse: ctx.codClasse, codPeriodo: ctx.codPeriodo }, 5000)).contexto || {};
  } catch {}

  const { linhas, larguras, congelarAte } = montarLinhasTurma(ctx, contexto);
  const bytes = gerarXlsx(linhas, { larguras, congelarAte, nomeAba: "Notas" });
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo(contexto);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  mostrarBanner("Planilha da turma baixada.", "ok", { duracao: 5000 });
}
