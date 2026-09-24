# Boletim+

**Ferramentas para o RCO** · Versão 0.13.2 · Extensão para Google Chrome

> Extensão independente, criada por um professor da rede. **Não tem vínculo com a SEED-PR** nem com o RCO oficial.

Extensão para o **Registro de Classe Online (RCO)** da rede estadual do Paraná. Na página de **Avaliação**, ela:
- colore as somatórias;
- permite **lançar notas direto na tabela**, com Desfazer e histórico;
- no 3º trimestre, mostra as notas do 1º e do 2º trimestre, a meta de cada estudante no 3º e a média anual;
- exporta as notas da turma em **planilha (.xlsx)**.

A **única** função que grava no RCO é a edição de notas, e só quando você clica no disquete. Todo o resto apenas lê.

Na primeira instalação, abre uma página de boas-vindas explicando as funções.

Tudo pode ser ligado e desligado num **painel de opções**, que abre ao clicar no ícone da extensão.

---

## O que a extensão faz

### 0. Painel de opções

Clique no ícone do Boletim+ na barra do Chrome (as barrinhas azuis com um +). Se não aparecer, clique no ícone de peça 🧩 e fixe a extensão.

| Opção | O que faz | Padrão |
|---|---|---|
| **Cores nas notas** | Verde a partir de 6,0 e vermelho abaixo, em todos os trimestres (também controla as cores da coluna Meta) | Ligada |
| **Previsão no 3º trimestre** | Mostra o botão "Mostrar 1º e 2º trimestre" acima da tabela | Ligada |
| ↳ **Abrir já ligada** | O botão começa ligado ao abrir a página | Desligada |
| ↳ **Esconder avaliações** | Oculta AV1, AV2 e recuperações no modo ligado | Ligada |
| ↳ **Coluna Meta no 3º Tri** | Mostra ou esconde essa coluna | Ligada |
| ↳ **Coluna Média Anual** | Mostra ou esconde essa coluna | Ligada |
| ↳ **Resumo da turma** | Quantos já atingiram a média, quantos ainda precisam de nota e quantos não alcançam só com o 3º | Desligada |
| ↳ **Números em negrito** | Deixa os números das colunas em negrito | Ligada |
| **Editar notas** | Lápis extra em cada coluna para lançar notas direto na tabela | Ligada |
| ↳ **Guardar histórico** | Registra, só neste computador, cada nota alterada pela extensão. Tem o link **Ver histórico** | Ligada |
| **Exportar planilha** | Botão acima da tabela que baixa as notas da turma em .xlsx | Ligada |

- **As mudanças valem na hora**, na página do RCO que estiver aberta, sem recarregar.
- **As opções com ↳** só ficam disponíveis com a opção de cima ligada.
- **Como usar**, no rodapé do painel, abre de novo a página de boas-vindas.
- **Com a previsão desligada**, a extensão não faz nenhuma consulta extra ao RCO.
- **Restaurar padrão** volta tudo para a tabela acima.
- **As escolhas ficam salvas** na sua conta do Chrome e valem em todos os computadores em que você estiver conectado.


### 1. Cores nas somatórias

Em qualquer página de avaliação (1º, 2º ou 3º trimestre), o número da coluna **Somatória** ganha cor:

| Cor | Quando |
|---|---|
| 🟢 Verde | 6,0 ou mais |
| 🔴 Vermelho | menos de 6,0 |
| Sem cor | sem nota (`-`) |

Só a cor do texto muda. O restante do visual do RCO (fundos, fontes e bordas) continua igual.

No 3º trimestre, a somatória é parcial, então fica vermelha enquanto não chega a 6,0.

### 2. Editar e salvar notas

Ao lado do lápis de cada coluna de avaliação (AV1, AV2, recuperações), a extensão acrescenta **um segundo lápis**, com o mesmo visual do botão do RCO. Ele permite lançar as notas direto na tabela, sem abrir o formulário do RCO.

- **Ao clicar no lápis**, as notas daquela coluna viram campos digitáveis, e o lápis é trocado por dois botões: o **disquete** (Alterar, grava as notas) e **Limpar** (descarta a edição).
- **Enquanto uma coluna está em edição**, os lápis das outras colunas e os lápis do próprio RCO ficam sem função até você clicar no disquete ou em Limpar.
- **Ponto decimal automático:** basta digitar os números. `10` vira `1.0`, `25` vira `2.5`, `100` vira `10.0`. Vírgula e ponto digitados são ignorados.
- **Teclado:** Enter ou seta para baixo passa ao próximo estudante, seta para cima volta, Esc descarta.
- **Valor acima do máximo** da avaliação (ex.: 2.1 numa AV de 1.0) mostra, ao lado do campo, o mesmo aviso do RCO: *"O campo Nota precisa ser 1 ou menor."*. Enquanto houver um aviso desses, **nada é salvo**.
- **Estudantes transferidos ou concluídos** ficam sem campo; a célula continua como o RCO mostra.
- **Na tabela do formulário do próprio RCO** (a que abre pelo lápis original, com a coluna "Somatória (Prévia*)"), a extensão não entra: ali vale o fluxo normal do RCO.

Ao clicar no disquete, a extensão grava as notas no RCO e atualiza na própria tela a coluna editada, a Somatória, as cores e (no 3º trimestre) a Média Anual, sem recarregar a página. Uma faixa verde igual à "Sucesso ao alterar Avaliação" do RCO (mesma cor e mesmo lugar, acima do título *AVALIAÇÃO*) confirma: *"2 notas salvas no RCO."* A página rola até ela, como o RCO faz. Todas as outras mensagens da extensão usam essa mesma faixa verde; só o ícone muda.

**Desfazer:** a faixa de sucesso traz o botão **Desfazer** por 20 segundos. Ele devolve as notas da coluna ao que eram antes do salvamento.

**Histórico:** cada salvamento (e cada Desfazer) fica registrado só neste computador, com data, turma, disciplina, trimestre, avaliação e as notas de antes e de depois. Para ver, use **Ver histórico** no painel. A página tem o botão **Apagar histórico**. Guarda os 300 salvamentos mais recentes.

**Como ela salva com segurança:**
- **Mesmo formato do RCO.** Parte da avaliação atual, troca **apenas** as notas que você editou e mantém todas as outras.
- **Conferência depois de gravar.** A extensão lê as notas de volta do RCO e compara com o que foi enviado. Se alguma não bateu, aparece uma faixa de aviso com o nome dos estudantes para conferir.
- **Proteção contra mudanças no RCO.** Antes de gravar, confere se as respostas do RCO têm o formato esperado e se cada coluna da tela corresponde à avaliação certa (quantidade e nome das colunas). Se algo não bater, **não grava** e desliga a edição naquela página; as outras funções continuam.
- **Proteção contra alteração simultânea.** Se a avaliação foi alterada em outro lugar desde que a página abriu, a extensão para e pede para recarregar.
- **Prazo encerrado.** Se o período estiver fora do prazo de edição, o RCO recusa e a extensão mostra o motivo; nenhuma nota é gravada.

A edição de notas é a única função que **grava** no RCO; todo o resto apenas lê.

### 3. Botão "Mostrar 1º e 2º trimestre"

Na página de avaliação do **3º trimestre**, aparece um botão liga/desliga logo acima da tabela.

- **Ele começa desligado** (a menos que a opção *Abrir já ligada* esteja ativa). Ao abrir ou recarregar a página, a tabela aparece exatamente como o RCO a mostra, com as colunas de avaliação e os lápis de edição.
- **Ligado**, a mesma tabela do RCO passa a mostrar:

| Nº | Nome | Situação | 1º Tri | 2º Tri | 3º Tri | Meta no 3º Tri | Média Anual |
|---|---|---|---|---|---|---|---|

Nesse modo:
- as colunas de avaliação (AV1, AV2, recuperações etc.) ficam escondidas, se a opção *Esconder avaliações* estiver ativa;
- a coluna **Somatória** do RCO aparece com o título **3º Tri**;
- **1º Tri** e **2º Tri** são adicionadas antes dela;
- **Meta no 3º Tri** e **Média Anual** são adicionadas depois dela.

Todos os números dessas cinco colunas aparecem em **negrito** (opção *Números em negrito*). As colunas Meta e Média Anual podem ser escondidas no painel.

Desligando o botão, a tabela volta ao normal na hora.

Com a opção **Resumo da turma** ligada, ao lado do botão aparece a contagem da turma, por exemplo: *"18 já atingiram a média, 9 ainda precisam de nota, 3 não alcançam só com o 3º"*.

### 4. As colunas do modo ligado

| Coluna | O que mostra | Cor |
|---|---|---|
| **1º Tri** | Somatória final do 1º trimestre | 🟢 ≥ 6,0 · 🔴 < 6,0 |
| **2º Tri** | Somatória final do 2º trimestre | 🟢 ≥ 6,0 · 🔴 < 6,0 |
| **3º Tri** | Somatória atual do 3º trimestre (a coluna original do RCO) | 🟢 ≥ 6,0 · 🔴 < 6,0 |
| **Meta no 3º Tri** | Quanto o estudante precisa somar no 3º trimestre para passar | 🟢 já atingiu · 🔴 acima de 10 · sem cor: em aberto |
| **Média Anual** | Média dos três trimestres, usando a nota atual do 3º | 🟢 ≥ 6,0 · 🔴 < 6,0 |

**Dicas ao passar o mouse:**
- **Meta no 3º Tri** mostra quanto ainda falta, por exemplo *"Faltam 1.5 (já tem 5.0 no 3º)"*.
- **Média Anual** mostra a conta feita, por exemplo *"(4.0 + 7.5 + 5.0) ÷ 3"*.

**Casos especiais do modo ligado:**
- **Estudantes com situação** (por exemplo, *Transf*) e sem nota no 3º trimestre aparecem com `—` em Meta e Média, e a situação aparece ao passar o mouse.
- **Estudantes sem nota** no 1º ou no 2º trimestre também aparecem com `—`.
- **Enquanto as notas carregam**, as células mostram `…`.


### 5. Exportar planilha

O botão **Exportar planilha**, acima da tabela e em qualquer trimestre, baixa as notas da turma aberta em .xlsx (abre no Excel, no LibreOffice e no Google Planilhas). O arquivo vem com:
- título com disciplina, trimestre e turma, e a data da exportação;
- Nº, nome, situação, cada avaliação e a somatória;
- no 3º trimestre, com a previsão carregada: 1º Tri, 2º Tri, Meta no 3º Tri e Média Anual;
- as mesmas cores verde/vermelho da tela, se *Cores nas notas* estiver ligada, e cabeçalho fixo ao rolar.

O nome do arquivo segue o padrão `Boletim+ - FISICA - <turma> - 3º Trimestre.xlsx`. A planilha é montada no próprio navegador; nada é enviado para fora.

---

## Como os cálculos são feitos

A aprovação considera **média anual 6,0**, que equivale a **18,0 pontos na soma dos três trimestres**.

```
Média Anual    = (1º Tri + 2º Tri + 3º Tri) ÷ 3
Meta no 3º Tri = 18,0 − (1º Tri + 2º Tri)          (nunca menor que 0)
Falta          = Meta no 3º Tri − 3º Tri atual     (mostrado ao passar o mouse)
```

**Leitura da Meta:**
- **Meta ≤ 3º Tri atual:** o estudante já garantiu a média (🟢).
- **Meta > 10,0:** não é possível alcançar só com o 3º trimestre (🔴).
- **Caso contrário:** a meta ainda está em aberto.

**Arredondamento:** os valores são exibidos com uma casa decimal e usam as somatórias exatamente como o RCO as informa. Se o RCO arredondar a média final de outro jeito, pode haver diferença de 0,1 em casos de fronteira.

**Personalização:** os critérios ficam em `src/base.js`:

```js
const CONFIG = {
  mediaAprovacao: 6.0,
  numTrimestres: 3,
  notaMaxTrimestre: 10.0,
  cacheMinutos: 5,
  janelaBusca: 12,
  desfazerSegundos: 20,
  maxHistorico: 300
};
```

---

## Como funciona por dentro

### De onde vêm os dados

Ao abrir a avaliação de uma turma, o RCO consulta a API da SEED:

```
GET https://apigateway-educacao.paas.pr.gov.br/seed/rcdig/estadual/v1/classe/v1/relatorios/avaliacaoParcialAlunos
    ?codClasse=<turma/disciplina>
    &codPeriodoAvaliacao=<período>
```

Essa consulta exige dois cabeçalhos, `Authorization: Bearer <token de login>` e `consumerid: RCDIGWEB`.

A resposta traz:
- **no corpo:** uma lista de estudantes, com `numChamada`, `nome`, `descrAbrevSituacaoMatricula`, as notas de cada avaliação (`nota<código>`) e a somatória (`final`);
- **no cabeçalho `fields`:** os rótulos das colunas, como `"AV1\n(4.0)"` e `"Somatória"`.

### Passo a passo

1. **Observa a consulta do RCO.** O `injetado.js` roda dentro da página e percebe quando o RCO faz a consulta `avaliacaoParcialAlunos`, seja por `fetch` ou por `XMLHttpRequest`. Ele guarda o endereço e os cabeçalhos dessa consulta.
2. **Descobre os trimestres da turma.** Os scripts da extensão pedem ao `injetado.js` que repita a consulta para os códigos de período próximos ao atual (do código atual −12 até +3). Os períodos que retornam estudantes são os trimestres da turma. Em 2026, por exemplo, são 9, 10 e 11, ou seja, 1º, 2º e 3º.
3. **Identifica o 3º trimestre.** Se o período aberto é o último dos três, a página é do 3º trimestre. Se a turma não tiver exatamente três períodos, a extensão usa o texto "3º Trimestre" da tela e os dois períodos anteriores.
4. **Lê as notas.** Do 1º e do 2º trimestre, usa o campo `final` (somatória). Do 3º, usa a própria consulta que o RCO acabou de fazer.
5. **Monta as colunas na tabela.** A tabela do RCO é localizada pelos títulos "Nome" e "Somatória", e as colunas extras são inseridas nela.
6. **Mantém tudo sincronizado.** Se o RCO redesenhar a tabela (depois de salvar uma nota, trocar de aba ou ordenar), as colunas e as cores são recolocadas automaticamente. Se o RCO fizer uma nova consulta, os dados são atualizados.

### Cache

- **Períodos da turma:** a descoberta é guardada por 30 minutos.
- **Notas do 1º e 2º trimestre:** são guardadas por 5 minutos.
- **Escopo:** o cache vive só na aba aberta; ao recarregar a página, tudo é buscado de novo. O único registro que fica no computador é o histórico de notas alteradas (veja abaixo).

---

## Privacidade e segurança

- **O login não sai da página.** O token e o `consumerid` ficam apenas no `injetado.js`, que roda no próprio RCO. Os outros scripts da extensão nunca os recebem.
- **Só o servidor do RCO.** Todas as consultas vão para o mesmo servidor da API do RCO (`apigateway-educacao.paas.pr.gov.br`), com o login da sessão aberta.
- **Nada é enviado para fora.** Não há servidores externos, rastreamento nem coleta de dados.
- **O que fica guardado:** as escolhas do painel (`chrome.storage.sync`, na sua conta do Chrome) e, se *Guardar histórico* estiver ligado, o histórico de notas alteradas (`chrome.storage.local`, só neste computador). O histórico tem nomes de estudantes e notas: não deixe ligado num computador compartilhado sem senha. Ele pode ser apagado a qualquer momento pela página do histórico.
- **Só grava quando você manda.** Fora do botão Alterar da edição, a extensão só faz leituras (`GET`). Ao salvar, ela envia o mesmo `PUT` que o RCO enviaria, apenas com as notas que você editou.
- **Permissões mínimas.** A extensão só roda em `https://rco.paas.pr.gov.br/*` e pede apenas `storage`, para as preferências e o histórico.
- **Política completa:** veja `PRIVACIDADE.md`, no projeto.

---

## Instalação

1. Extraia o arquivo `.zip`.
2. No Chrome, abra `chrome://extensions`.
3. Ative o **Modo do desenvolvedor**, no canto superior direito.
4. Clique em **Carregar sem compactação** e escolha a pasta que contém o `manifest.json`.
5. Confira se o card mostra **Boletim+ – ferramentas para o RCO 0.13.2**.
6. Clique no ícone de peça 🧩 da barra do Chrome e fixe a extensão, para o painel ficar sempre à mão.
7. Abra ou recarregue o RCO com **F5**.

**Requisito:** Chrome 111 ou mais recente.

**Para atualizar:** substitua os arquivos na mesma pasta e clique no ícone de **recarregar** no card da extensão. Depois, dê F5 no RCO.

---

## Arquivos

| Arquivo | Função |
|---|---|
| `manifest.json` | Configuração da extensão (Manifest V3) |
| `injetado.js` | Roda no contexto da página (`world: MAIN`): observa a consulta de notas, repete a consulta para outros trimestres e **grava as notas editadas** no RCO, com o login da sessão |
| `src/` | Scripts da página, carregados em ordem pelo manifest e com o mesmo escopo: `opcoes-padrao`, `base` (configuração), `ponte` (conversa com o injetado), `dados` (cálculos), `tabela` (leitura da tabela do RCO), `periodos` (1º/2º tri), `avisos` (faixa no visual do RCO), `historico`, `exportar` (planilha), `previsao` (barra e colunas), `edicao`, `estilos`, `main` (início) |
| `background.js` | Abre as boas-vindas na primeira instalação |
| `popup.html` / `popup.js` | Painel de opções que abre ao clicar no ícone da extensão |
| `boasvindas.html` | Página de boas-vindas (Como usar) |
| `historico.html` / `historico.js` | Página do histórico de notas alteradas |
| `paginas.css` | Estilo das páginas de boas-vindas e histórico |
| `icones/` | Ícones da extensão (16, 32, 48 e 128 px) |
| `README.md` | Este documento |

---

## Limitações conhecidas

- **Depende do formato atual do RCO.** A extensão foi feita a partir do comportamento do RCO em setembro de 2026: a consulta `avaliacaoParcialAlunos`, o cabeçalho `fields` e a tabela com as colunas "Nome" e "Somatória". Mudanças no sistema podem exigir ajustes.
- **Pressupõe três trimestres.** Turmas com outra organização (semestral, por exemplo) só funcionam se a tela indicar "3º Trimestre".
- **Estudantes são associados pelo nome** entre os trimestres. Um nome escrito de forma diferente entre os trimestres pode não ser encontrado.
- **A média anual usa a nota parcial do 3º trimestre.** Ela vai subindo conforme as avaliações são lançadas.
- **Recuperações não entram na meta.** A extensão não considera recuperações futuras nem regras especiais (conselho de classe, recuperação final).
- **A sessão pode expirar.** Se o login do RCO expirar, a busca falha. Nesse caso aparece um aviso ao lado do botão; basta recarregar a página.

---

## Solução de problemas

| Sintoma | O que fazer |
|---|---|
| O botão não aparece | Confira no painel se **Previsão no 3º trimestre** está ligada, se a página é do **3º trimestre** e se o card da extensão mostra a versão 0.13.2. Recarregue o RCO. |
| Aparece um aviso ao lado do botão | Recarregue a página. Se o aviso falar em sessão expirada, entre no RCO de novo. |
| O lápis extra da edição não aparece | Confira no painel se **Editar notas** está ligada e recarregue a página. Se ainda assim não aparecer, pode ser que o RCO tenha mudado as colunas: a extensão esconde a edição por segurança. |
| Faixa dizendo que uma nota não ficou gravada | Recarregue a página e confira a nota do estudante indicado. Se o problema se repetir, lance essa nota pelo lápis do próprio RCO. |
| As colunas de avaliação não somem no modo ligado | Confira no painel se **Esconder avaliações** está ligada. Se estiver, o cabeçalho do RCO pode ter mudado. Tire um print só do cabeçalho da tabela. |
| Nada funciona | Abra o Console (F12), recarregue e procure mensagens com o prefixo `[Boletim+]`. |

---

## Histórico de versões

| Versão | Mudanças |
|---|---|
| **0.13.2** | Todas as mensagens da extensão (sucesso, aviso e erro) usam a faixa verde do RCO, com o mesmo × para fechar. |
| 0.13.1 | Números não ficam mais duplicados sob os campos de edição. Faixa de sucesso dentro da página, acima do título, na mesma cor da faixa do RCO. Botão "Mostrar 1º e 2º trimestre" com o mesmo toggle do RCO. Durante a edição, os lápis do próprio RCO ficam sem função, e o lápis extra nunca some. |
| 0.13.0 | Na tabela do formulário do RCO, nada da extensão. Nota acima do máximo mostra o aviso do RCO e não salva. Faixa de sucesso no visual do RCO, com Desfazer. Histórico local das notas alteradas. Conferência após gravar. Edição desligada se o formato do RCO mudar. Exportar planilha (.xlsx). Resumo da turma (opcional). Página de boas-vindas. Código separado em módulos, com testes automáticos. |
| 0.12.0 | Edição direto no cabeçalho: lápis só com ícone (visual do RCO), trocado por disquete e Limpar durante a edição; outras colunas travadas enquanto uma é editada; ponto decimal automático; removida a faixa de texto acima da tabela. |
| 0.11.1 | Correção: o botão "Alterar aqui" volta a funcionar após salvar ou cancelar uma edição. |
| 0.11.0 | Edição sem tocar no DOM do RCO: os campos ficam sobrepostos ao texto e a atualização troca só o valor dos nós de texto, o que corrige o visual quebrado e o liga/desliga instável. Sem recarregar a página após salvar. |
| 0.10.4 | Após salvar, a página é recarregada em vez de reescrever a tabela do RCO, que quebrava o visual. A consulta de matrícula passa a usar a mesma data de referência do RCO. |
| 0.10.3 | Correção do erro 500: o salvamento agora reproduz exatamente o PUT do RCO — só estudantes ativos, notas preservadas a partir da tabela, campo de nota omitido para quem nunca teve, e os objetos de turma e período incluídos. |
| 0.10.2 | Botão renomeado para "Alterar aqui", posicionado ao lado do lápis do RCO. Salvamento envia a nota de todos os estudantes, incluindo vazias, como o RCO faz. |
| 0.10.1 | Botões Alterar/Limpar no estilo do RCO, com ícone. Correção do erro 500: o salvamento envia apenas os campos que o RCO espera. |
| 0.10.0 | Edição de notas: botão "Editar" por coluna, campos digitáveis com aviso de máximo, salvamento direto no RCO e atualização da tabela. Nova opção no painel. |
| 0.9.2 | Novo nome: **Boletim+ – ferramentas para o RCO**. Ícone com o sinal de +. Aviso de extensão independente. |
| 0.9.1 | Correção: com *Cores nas notas* desligada, a coluna Meta no 3º Tri também fica sem cor. |
| 0.9.0 | Painel de opções no ícone da extensão, com liga/desliga para cores, previsão, abrir já ligada, esconder avaliações, colunas Meta e Média Anual e negrito. Ícones próprios. |
| 0.8.1 | Números das colunas 1º Tri, 2º Tri, 3º Tri, Meta no 3º Tri e Média Anual em negrito. Correção: o título "Somatória" agora é trocado de verdade por "3º Tri", então sai certo ao copiar a tabela. |
| 0.8.0 | Botão começa sempre desligado. Colunas renomeadas para 1º Tri, 2º Tri, 3º Tri, Meta no 3º Tri e Média Anual. Nova coluna Média Anual. Retirada a frase informativa. Mantidas as cores originais do RCO, exceto verde/vermelho nas notas. |
| 0.7.0 | Colunas do 1º e 2º trimestre dentro da própria tabela do RCO, com botão liga/desliga. Volta das cores nas somatórias. |
| 0.6.0 | Reescrita com base na API real do RCO (`avaliacaoParcialAlunos`, `codPeriodoAvaliacao`). |
| 0.5.0 | Tentativa de busca automática por detecção genérica da API. |
| 0.4.0 | Quadro de resumo anual com notas salvas ao visitar cada trimestre. |
| 0.3.1 | Versão original: notas editáveis e somatória recalculada com cores. |
