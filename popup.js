// Painel de opções da extensão. Salva em chrome.storage.sync;
// os scripts da página escutam as mudanças e aplicam na hora.
// CHAVE_OPCOES e OPCOES_PADRAO vêm de src/opcoes-padrao.js.
const form = document.getElementById("opcoes");
const sub = document.getElementById("subopcoes");
const subEditar = document.getElementById("subeditar");
const diario = document.getElementById("diario");
const status = document.getElementById("salvo");

function mostrar(opcoes) {
  for (const [nome, valor] of Object.entries(opcoes)) {
    const input = form.elements[nome];
    if (input) input.checked = Boolean(valor);
  }
  sub.disabled = !opcoes.previsao;
  subEditar.disabled = !opcoes.editar;
  diario.classList.toggle("sem-cor", !opcoes.cores);
}

function lerFormulario() {
  const opcoes = {};
  for (const nome of Object.keys(OPCOES_PADRAO)) opcoes[nome] = form.elements[nome].checked;
  return opcoes;
}

let timerStatus;
async function salvar(opcoes, mensagem) {
  mostrar(opcoes);
  try {
    await chrome.storage.sync.set({ [CHAVE_OPCOES]: opcoes });
    status.textContent = mensagem;
  } catch (e) {
    status.textContent = "Não foi possível salvar. Tente de novo.";
  }
  clearTimeout(timerStatus);
  timerStatus = setTimeout(() => (status.textContent = "As mudanças valem na hora."), 2500);
}

form.addEventListener("change", () => salvar(lerFormulario(), "Salvo."));

document.getElementById("restaurar").addEventListener("click", () =>
  salvar({ ...OPCOES_PADRAO }, "Padrão restaurado.")
);

chrome.storage.sync.get(CHAVE_OPCOES).then((r) => {
  mostrar({ ...OPCOES_PADRAO, ...(r[CHAVE_OPCOES] || {}) });
});
