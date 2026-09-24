// ------------------------------------------------------------
// COMUNICAÇÃO COM injetado.js
// O injetado.js roda no contexto da página (tem o login do RCO);
// este lado pede consultas e salvamentos por postMessage.
// ------------------------------------------------------------
const aguardando = new Map();
let seqPedido = 0;

const RESPOSTAS = new Set(["resposta", "salvo", "avaliacoes-resp", "contexto-resp"]);

window.addEventListener("message", (ev) => {
  if (ev.source !== window || !ev.data || typeof ev.data !== "object") return;
  const tipo = ev.data[TAG];
  if (tipo === "alunos") {
    aoReceberAlunos(ev.data);
    return;
  }
  if (RESPOSTAS.has(tipo)) {
    const fn = aguardando.get(ev.data.reqId);
    if (fn) {
      aguardando.delete(ev.data.reqId);
      fn(ev.data);
    }
  }
});

// Envia um pedido ao injetado.js e espera a resposta.
// Em caso de erro, o Error carrega a resposta completa em .dados.
function pedirInj(tipo, dados = {}, ms = 25000) {
  return new Promise((resolve, reject) => {
    const reqId = `${tipo}-${++seqPedido}-${Date.now()}`;
    const timer = setTimeout(() => {
      aguardando.delete(reqId);
      reject(new Error("o RCO demorou a responder"));
    }, ms);
    aguardando.set(reqId, (d) => {
      clearTimeout(timer);
      if (d.erro) {
        const e = new Error(d.erro);
        e.dados = d;
        reject(e);
      } else {
        resolve(d);
      }
    });
    window.postMessage({ [TAG]: tipo, reqId, ...dados }, location.origin);
  });
}

function pedirPeriodo(codClasse, codPeriodo) {
  return pedirInj("buscar", { codClasse, codPeriodo }, 20000).then((d) => ({
    campos: d.campos,
    dados: Array.isArray(d.dados) ? d.dados : []
  }));
}
