// ------------------------------------------------------------
// HISTÓRICO LOCAL DAS NOTAS ALTERADAS
// Cada salvamento feito pela extensão fica registrado só neste
// computador (chrome.storage.local). A página historico.html mostra
// a lista. Nada é enviado para fora.
// ------------------------------------------------------------
const CHAVE_HISTORICO = "rcoHistorico";

// entrada = { quando, acao: "alteracao"|"desfazer", turma, disciplina,
//             periodo, avaliacao, mudancas: [{ num, nome, de, para }] }
async function registrarHistorico(entrada) {
  if (!opcoes.historico) return;
  try {
    const r = await chrome.storage.local.get(CHAVE_HISTORICO);
    const lista = Array.isArray(r[CHAVE_HISTORICO]) ? r[CHAVE_HISTORICO] : [];
    lista.unshift({ quando: new Date().toISOString(), ...entrada });
    if (lista.length > CONFIG.maxHistorico) lista.length = CONFIG.maxHistorico;
    await chrome.storage.local.set({ [CHAVE_HISTORICO]: lista });
  } catch (e) {
    console.warn("[Boletim+] não foi possível gravar o histórico", e);
  }
}
