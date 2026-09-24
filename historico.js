// Boletim+ | página do histórico (lê chrome.storage.local)
const CHAVE_HISTORICO = "rcoHistorico";
const lista = document.getElementById("lista");
const contagem = document.getElementById("contagem");
const apagar = document.getElementById("apagar");

const nota = (v) => (v == null || v === "" ? "—" : v);

function el(tag, props = {}, ...filhos) {
  const e = document.createElement(tag);
  Object.assign(e, props);
  e.append(...filhos);
  return e;
}

function desenhar(registros) {
  lista.replaceChildren();
  apagar.hidden = !registros.length;
  if (!registros.length) {
    contagem.textContent = "";
    lista.append(el("p", { className: "vazio suave",
      textContent: "Nenhuma nota alterada ainda. Quando você salvar notas pelo lápis extra da tabela, elas aparecem aqui." }));
    return;
  }
  contagem.textContent = registros.length === 1 ? "1 salvamento" : `${registros.length} salvamentos, do mais recente ao mais antigo`;

  registros.forEach((r) => {
    const quando = new Date(r.quando).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
    const titulo = [r.disciplina, r.avaliacao].filter(Boolean).join(", ") || "Avaliação";
    const onde = [r.turma?.replace(/\s+/g, " "), r.periodo].filter(Boolean).join(", ");

    const meta = el("p", { className: "meta suave" }, `${quando}${onde ? " · " + onde : ""}`);
    if (r.acao === "desfazer") meta.append(" · ", el("span", { className: "desfeito", textContent: "desfeito" }));

    const corpo = el("tbody");
    (r.mudancas || []).forEach((m) => {
      corpo.append(el("tr", {},
        el("td", { className: "num", textContent: m.num ?? "" }),
        el("td", { textContent: m.nome || "" }),
        el("td", { className: "nota", textContent: nota(m.de) }),
        el("td", { className: "nota", textContent: nota(m.para) })
      ));
    });
    const tabela = el("table", {},
      el("thead", {}, el("tr", {},
        el("th", { className: "num", textContent: "Nº" }),
        el("th", { textContent: "Estudante" }),
        el("th", { className: "nota", textContent: "Antes" }),
        el("th", { className: "nota", textContent: "Depois" })
      )),
      corpo
    );

    lista.append(el("section", { className: "registro" }, el("h3", { textContent: titulo }), meta, tabela));
  });
}

async function carregar() {
  const r = await chrome.storage.local.get(CHAVE_HISTORICO);
  desenhar(Array.isArray(r[CHAVE_HISTORICO]) ? r[CHAVE_HISTORICO] : []);
}

apagar.addEventListener("click", async () => {
  if (!confirm("Apagar todo o histórico de notas alteradas deste computador?")) return;
  await chrome.storage.local.remove(CHAVE_HISTORICO);
  carregar();
});

chrome.storage.onChanged.addListener((mudancas, area) => {
  if (area === "local" && mudancas[CHAVE_HISTORICO]) carregar();
});

carregar();
