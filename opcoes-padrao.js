// ============================================================
// Boletim+ | opções padrão
// Usado pela página do RCO (content scripts) e pelo painel (popup).
// ============================================================
const CHAVE_OPCOES = "rcoOpcoes";

const OPCOES_PADRAO = {
  cores: true,             // verde/vermelho nas notas
  previsao: true,          // botão "Mostrar 1º e 2º trimestre" no 3º trimestre
  iniciarLigado: false,    // esse botão já começa ligado
  ocultarAvaliacoes: true, // esconde AV1, AV2... com a previsão ligada
  colunaMeta: true,        // coluna "Meta no 3º Tri"
  colunaMedia: true,       // coluna "Média Anual"
  negrito: true,           // números das colunas em negrito
  resumo: false,           // resumo da turma ao lado do botão da previsão
  editar: true,            // lápis extra para lançar notas na tabela
  historico: true,         // guarda no computador o histórico das notas alteradas
  exportar: true           // botão "Exportar planilha" acima da tabela
};
