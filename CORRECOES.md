# Correções realizadas

## Causa principal dos botões "mortos"
`assets/js/main.js` começava com um `import {` **truncado** (só sobrou o miolo da lista e o `} from './validation.js'`).
Isso é um erro de sintaxe: o navegador descartava o arquivo inteiro e **nenhum** clique/formulário era registrado.
Além disso, os scripts eram carregados como scripts comuns (sem `type="module"`) e as funções auxiliares não tinham `export`.

## O que foi corrigido
| Arquivo | Correção |
|---|---|
| `main.js` | Import restaurado; passa a importar `filters.js`, `feed.js`, `messages.js` e `validation.js`. |
| `index.html` | `<script type="module">` único; `#toast-root` fora do `#app` (avisos agora aparecem em login/cadastro/logout); favicon. |
| `validation.js`, `filters.js`, `feed.js`, `messages.js` | `export` nas funções. Antes ficavam soltas e não eram usadas. |
| Cadastro de atleta | CPF era salvo com regex errada, quebrando a checagem de CPF duplicado; validação de e-mail mais rigorosa; o atleta agora ganha `athleteId` e **aparece no banco de atletas** dos funcionários. |
| Login | E-mails demo tinham acento (`academiapelé.com`), o que pode falhar em `type="email"`; trocados por `academiapele.com` (dados antigos do localStorage são migrados). Mensagem clara quando a aba (Jogador/Funcionário) está errada. |
| Conversas | Estavam "de mão única" (funcionário e atleta gravavam em threads diferentes). Agora a conversa é o par atleta+funcionário e os dois lados veem o mesmo histórico. Removida a mensagem falsa de boas-vindas. |
| Votos | Contador não atualizava e dava para votar infinitas vezes; agora 1 voto por usuário/atleta e o número atualiza. |
| Favoritos | Favoritar recarregava a tela e apagava os filtros; agora mantém. |
| Peneiras | Regex do local (`Centro de Treinamento Pelé — São Paulo/SP`) estava quebrada; corrigida. Dashboard não quebra sem peneiras. |
| Perfil | Trocar e-mail agora atualiza inscrições/votos e impede e-mail duplicado. |
| Outros | Tecla ESC fecha modais; login/cadastro redirecionam se já logado; `min-h-18` inválido; fonte com fallback. |
| `ui.js`, `tryouts.js` | **Removidos**: nunca eram carregados e importavam `./state.js`, que não existe (duplicavam código do main.js). |
| Deploy | `vite.config.js` copia `assets/brand` para o `dist` (a logo sumia no GitHub Pages); `package.json` com versões fixas (antes `latest`) e `package-lock.json` alinhado; workflow usa `npm ci`. |

## Como testar
1. `npm install` e `npm run dev` (ou Live Server no `index.html`).
2. Contas de teste estão no `README.md`.

## Atualização 2
- **Pesquisa em Conversas**: o CSS `.conversation-item { display:flex }` anulava o `hidden` do Tailwind, então nenhum item sumia. Agora a busca usa o atributo `hidden` (com regra CSS própria), ignora maiúsculas/acentos ("joao" acha "João") e mostra "Nenhum resultado encontrado".
- **Botão de peneira incompatível**: nova classe `.btn-incompatible` (fundo preto, texto e borda vermelhos) usada quando posição/categoria do jogador não combina com a peneira.

## Atualização 3
- **Jogador pode sair da peneira**: botão "Cancelar minha inscrição" (com confirmação) libera a vaga na hora.
- **Contador de vagas X/Y** em cada peneira (ex.: `10/11`), com "N vagas livres"/"Lotada" e barra de progresso; atualiza ao inscrever, cancelar ou criar peneira.
- **Atualização automática**: quando outra aba/janela do navegador altera peneiras, avisos ou mensagens, a tela é atualizada sozinha (evento `storage`). Como o projeto ainda não tem back-end, isso funciona entre abas do mesmo navegador; entre aparelhos diferentes depende de API/banco.
- **Funcionário pode cancelar peneira**: botão "Cancelar peneira" com motivo opcional; todos os inscritos recebem um aviso automático e a peneira sai da lista.
- **Notificações por usuário** (antes eram globais): sino com contador, aviso ao jogador (cancelamento, inscrição, avaliação) e ao funcionário (nova inscrição, vaga liberada).

## Atualização 4
- **Perna dominante** (Destro / Canhoto / Ambidestro): campo obrigatório no cadastro e no perfil, tag nos cards/perfil do atleta, filtro "Perna dominante" na busca do funcionário e coluna no CSV.
- **Logo → Início**: o logo do cabeçalho leva ao Início (jogador e funcionário), fecha janelas abertas e, se já estiver no Início, rola para o topo. Toda troca de tela agora começa no topo.
- **Exportar seleção**: o CSV agora tem BOM UTF-8 (acentos e o "—" da posição secundária apareciam quebrados no Excel), posição secundária vazia vira "Nenhuma", e inclui Perna dominante, Nota média, nº de avaliações e Votos.
- **Voto**: o funcionário pode **retirar o voto** (o botão vira "Retirar voto").
- **Avaliação completa** (`evaluation.js`): notas 0–10 por característica, estatísticas da partida (gols, assistências, finalizações e no alvo, passes certos/tentados com %, desarmes, minutos; goleiro: defesas e gols sofridos), pontos fortes, comentário, escolha da posição avaliada (principal ou secundária) e **nota final ponderada pela posição**. O autor pode excluir a própria avaliação. A nota do atleta passa a ser a média das avaliações.
- **Inscritos na peneira**: mostram posição principal e secundária, perna dominante e botão "Ver perfil".

### Pesos da nota por posição
| Posição | Pesa muito | Pesa pouco |
|---|---|---|
| Atacante | Finalização, posicionamento, técnica | Marcação |
| Ponta | Técnica, físico/velocidade, finalização | Marcação, posicionamento |
| Meia | Passe, visão, técnica (ataque e defesa equilibrados) | Físico, posicionamento |
| Volante | Marcação, passe (ataque e defesa equilibrados) | Finalização |
| Lateral | Marcação, físico, passe | Finalização |
| Zagueiro | Marcação, posicionamento, físico | Finalização, técnica |
| Goleiro | Defesas/reflexos, jogo aéreo, posicionamento | Físico |

Os pesos ficam na constante `WEIGHTS` em `assets/js/evaluation.js` e podem ser ajustados.

## Atualização 5
- **Estatísticas influenciam a nota (pouco)**: a nota final = nota base (características ponderadas pela posição avaliada, principal ou secundária) **+ ajuste por desempenho de no máximo ±0,6 ponto** (`performanceAdjustment` em `assets/js/evaluation.js`).
  - Cada estatística vale conforme a posição: gols/assistências/finalizações pesam mais para atacante e ponta, quase nada para zagueiro (2 gols de um zagueiro = +0,1); desarmes pesam mais para zagueiro e volante; defesas e gols sofridos valem para goleiro.
  - Precisão de passes só conta com pelo menos 10 passes tentados; poucos minutos em campo reduzem o efeito das estatísticas.
  - Quem não marcou gol não é penalizado; já finalizações fora do alvo, passes errados e gols sofridos podem reduzir um pouco a nota.
  - A avaliação mostra nota base, ajuste e as estatísticas; a nota aparece ao vivo no formulário.
- **Privacidade**: notas, comentários e estatísticas ficam visíveis apenas para o jogador avaliado (no próprio perfil, com aviso na tela) e para a equipe (funcionários). Um jogador não vê avaliações de outro e não acessa o banco de atletas.
- **Painel do funcionário com números reais**: "Atletas ativos" = total de atletas do banco (exemplos + todos os jogadores cadastrados), igual ao número da tela Atletas; "Perfis avaliados" só conta perfis com avaliação; "Mensagens" conta as conversas do próprio funcionário.

## Atualização 6
- **Chat mobile estilo WhatsApp**: no celular, abrir uma conversa preenche a tela inteira e
  esconde a lista de contatos; um botão de seta volta para a lista, e o botão "voltar" do
  celular/navegador também funciona. No computador, o layout lado a lado continua como estava.
  A lista de contatos agora mostra a prévia da última mensagem.
- **Supabase (sincronização entre aparelhos)**: `assets/js/remote.js` conecta contas, perfis
  e conversas a um banco de dados na nuvem (com tempo real), então um funcionário no
  computador e um jogador no celular passam a ver a mesma conversa. A URL e a chave pública
  já estão em `assets/js/config.js`; falta rodar o SQL de `supabase/migrations/` (veja o
  passo a passo em `SUPABASE_SETUP.md`). Sem internet ou sem configurar, o site continua
  funcionando sozinho no modo local de antes (pode ser forçado com `?local=1` na URL).
- **Idioma espanhol**: uma tela de seleção (Português/Español) aparece antes do login na
  primeira vez; a escolha fica salva e pode ser trocada a qualquer momento pelo ícone de
  globo no cabeçalho (ou no rodapé da tela de login). Já estão traduzidas: a tela de idioma,
  login, cadastro, navegação, títulos das páginas principais, os modais de avaliação e de
  criação/cancelamento de peneira, os rótulos dos filtros de atletas, botões de ação (votar,
  inscrever, cancelar peneira, sair etc.) e os toasts mais comuns. **Ainda faltam**: telas de
  perfil e de detalhe de atleta com textos mais longos, e alguns toasts de erro mais
  específicos — a infraestrutura em `assets/js/i18n.js` (função `t('texto em português')`)
  já está pronta para isso, é só continuar envolvendo os textos que faltam.
