// ------------------------------------------------------------
// CSS
// Só o verde/vermelho das notas muda cores do RCO; o resto herda o
// visual dele (botões clonados) ou imita os componentes dele.
// ------------------------------------------------------------
function injetarEstilos() {
  if (document.getElementById("rco-previsao-style")) return;
  const style = document.createElement("style");
  style.id = "rco-previsao-style";
  style.textContent = `
    .rco-verde, .rco-verde *       { color: #2e7d32 !important; }
    .rco-vermelho, .rco-vermelho * { color: #d32f2f !important; }

    /* ---------- botões clonados do RCO ---------- */
    .rco-hdr-btn { margin-left: 6px; vertical-align: middle; }
    .rco-hdr-btn[hidden], .rco-exportar-btn[hidden], .rco-switch[hidden] { display: none !important; }
    .rco-hdr-btn:disabled { opacity: 0.35 !important; cursor: not-allowed !important; }
    /* lápis do próprio RCO travados durante a edição de uma coluna */
    .rco-rco-travado { opacity: 0.35 !important; pointer-events: none !important; cursor: not-allowed !important; }
    .rco-hdr-btn svg, .rco-exportar-btn svg { width: 1em; height: 1em; vertical-align: -0.125em; }

    /* reservas, quando não há botão do RCO para copiar */
    .rco-btn-reserva, .rco-btn-reserva-azul {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      min-height: 2.3em;
      padding: 0 0.8em;
      font: inherit;
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
    }
    .rco-btn-reserva { color: #9e9e9e; border: 1px solid #78909c; }
    .rco-btn-reserva-azul { min-width: 2.3em; padding: 0 0.6em; color: #1e88e5; border: 1px solid #1e88e5; }
    .rco-btn-reserva:focus-visible, .rco-btn-reserva-azul:focus-visible { outline: 2px solid #1e88e5; outline-offset: 1px; }

    /* ---------- campos de nota durante a edição ---------- */
    /* ficam por cima do texto do RCO; o texto continua no DOM, invisível */
    td.rco-td-editando { position: relative; overflow: visible; color: transparent !important; }
    td.rco-td-editando > :not(.rco-nota-wrap),
    td.rco-td-editando > :not(.rco-nota-wrap) * { color: transparent !important; }
    .rco-nota-wrap {
      position: absolute;
      left: 4px;
      top: 3px;
      bottom: 3px;
      z-index: 3;
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }
    .rco-nota-input {
      width: 4.5em;
      height: 100%;
      min-height: 1.9em;
      box-sizing: border-box;
      padding: 2px 8px;
      text-align: left;
      font: inherit;
      font-variant-numeric: tabular-nums;
      color: inherit;
      background: transparent;
      border: 1px solid rgba(128, 128, 128, 0.55);
      border-radius: 4px;
    }
    .rco-nota-input:focus { outline: none; border-color: #1e88e5; box-shadow: 0 0 0 2px rgba(30, 136, 229, 0.3); }
    .rco-nota-input:disabled { opacity: 0.45; }

    /* aviso ao lado do campo, igual ao do RCO */
    .rco-campo-erro {
      padding: 2px 6px;
      font-size: 0.78em;
      line-height: 1.4;
      color: #fff;
      background: #e53935;
      border-radius: 2px;
    }
    .rco-campo-erro[hidden] { display: none; }

    /* ---------- faixa de aviso (visual da faixa do RCO) ---------- */
    /* no fluxo da página, no mesmo lugar e com as mesmas cores da faixa
       "Sucesso ao alterar Avaliação" do RCO */
    .rco-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      box-sizing: border-box;
      margin: 0 0 16px;
      padding: 12px 20px;
      font: inherit;
      color: #b6fadf;
      background: #00813a;
      border: 1px solid #00ea9e;
      border-radius: 2px;
    }
    .rco-banner-icone { display: inline-flex; flex-shrink: 0; }
    .rco-banner-texto { flex: 1; }
    .rco-banner-acao {
      padding: 2px 12px;
      font: inherit;
      font-weight: 600;
      color: inherit;
      background: transparent;
      border: 1px solid currentColor;
      border-radius: 3px;
      cursor: pointer;
    }
    .rco-banner-acao:hover { background: rgba(255, 255, 255, 0.12); }
    .rco-banner-fechar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      padding: 0;
      color: #fff;
      background: none;
      border: 0;
      opacity: 0.4;
      cursor: pointer;
    }
    .rco-banner-fechar:hover { opacity: 0.75; }
    .rco-banner button:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

    /* ---------- colunas do 1º/2º trimestre ---------- */
    table:not(.rco-modo-previsao) .rco-cel { display: none; }

    table.rco-sem-meta .rco-cel[data-col="meta"],
    table.rco-sem-media .rco-cel[data-col="media"] { display: none; }

    /* modo ligado: números das colunas em negrito (opção do painel) */
    table.rco-modo-previsao.rco-negrito td.rco-cel,
    table.rco-modo-previsao.rco-negrito td.rco-td-somatoria,
    table.rco-modo-previsao.rco-negrito td.rco-td-somatoria * { font-weight: 700 !important; }

    /* ---------- barra acima da tabela ---------- */
    .rco-barra-previsao {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px 16px;
      padding: 8px 4px 10px;
    }
    .rco-exportar-btn { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; }
    /* toggle no padrão do RCO ("Somente ativos"): trilho contornado,
       bolinha à esquerda; ligado fica azul com a bolinha escura à direita */
    .rco-switch {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 2px 0;
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }
    .rco-switch:focus-visible { outline: none; }
    .rco-switch:focus-visible .rco-trilho { box-shadow: 0 0 0 3px rgba(0, 105, 191, 0.35); }
    .rco-trilho {
      position: relative;
      box-sizing: border-box;
      width: 2em;
      height: 1.15em;
      max-width: 30px;
      max-height: 17px;
      min-width: 28px;
      min-height: 16px;
      border-radius: 2em;
      border: 1px solid color-mix(in srgb, currentColor 70%, transparent);
      background: color-mix(in srgb, currentColor 5%, transparent);
      transition: background-color 0.15s, border-color 0.15s;
      flex-shrink: 0;
    }
    .rco-bolinha {
      position: absolute;
      top: 50%;
      left: 2px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: color-mix(in srgb, currentColor 70%, transparent);
      transform: translateY(-50%);
      transition: transform 0.15s, background-color 0.15s;
    }
    .rco-switch[aria-checked="true"] .rco-trilho { background: #0069bf; border-color: #0069bf; }
    .rco-switch[aria-checked="true"] .rco-bolinha { background: #323a40; transform: translate(12px, -50%); }
    .rco-aviso { color: #b26a00; }
    .rco-resumo { display: inline-flex; flex-wrap: wrap; gap: 4px 16px; opacity: 0.9; }
    .rco-resumo[hidden] { display: none; }
    @media (prefers-reduced-motion: reduce) {
      .rco-trilho, .rco-bolinha { transition: none; }
    }
  `;
  document.head.appendChild(style);
}
