// ============================================================
// Boletim+ – ferramentas para o RCO
//
// Os arquivos de src/ são carregados em ordem pelo manifest.json e
// compartilham o mesmo escopo (content scripts do mesmo grupo).
// Ordem: opcoes-padrao, base, ponte, dados, tabela, periodos, avisos,
// historico, exportar, previsao, edicao, estilos, main.
//
// - Colore as somatórias (verde >= 6, vermelho < 6).
// - No 3º trimestre, mostra na tabela 1º Tri | 2º Tri | 3º Tri |
//   Meta no 3º Tri | Média Anual.
// - Lápis extra para lançar notas direto na tabela (grava no RCO).
// - Exporta a turma em planilha.
// ============================================================
console.log("[Boletim+] carregado");

const CONFIG = {
  mediaAprovacao: 6.0,
  numTrimestres: 3,
  notaMaxTrimestre: 10.0,
  cacheMinutos: 5,        // tempo até buscar de novo o 1º/2º trimestre
  janelaBusca: 12,        // quantos códigos de período olhar para trás
  desfazerSegundos: 20,   // quanto tempo o botão Desfazer fica disponível
  maxHistorico: 300       // quantos salvamentos o histórico guarda
};

const TAG = "rco-previsao";
const EPS = 1e-6;

let opcoes = { ...OPCOES_PADRAO };
let ultimaMensagem = null;
