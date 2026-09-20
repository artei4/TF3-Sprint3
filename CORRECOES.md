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
