# Retrospectiva: evolução do design (Sprint 1 → Sprint 4)

Pelé Academia · TIER-ZERO · FIAP 2026. Baseada no histórico do repositório; os trechos entre `[ ]` dependem da equipe.

## Linha do tempo

| Sprint | O que aconteceu no design | Evidência |
|---|---|---|
| 1 | Identidade dourado e preto da Pelé Academia e os primeiros tokens: `brand`, `night`, `panel`, `ink-soft`, raios, espaçamento e breakpoints `tablet`/`wide`. | tokens em `d656cca^:assets/js/styles.css` |
| 2 | `[completar: protótipo no Figma e o que mudou em relação à Sprint 1]` | `[link do Figma]` |
| 3 | Aplicação em Vite + Tailwind 4 + JavaScript puro com os fluxos de atleta e funcionário (17 a 24/09). Avaliação dos atletas, chat no celular, espanhol e recuperação de senha. Em 18/09 o build do Tailwind foi trocado pelo CDN para abrir no Live Server, e os tokens `@theme` saíram do código. | commits `b867920`, `d656cca`; PRs #1 a #4 |
| 4 | Tokens da Sprint 1 restaurados (16/10). Primeira direção, "Gramado à noite" (verde-escuro e degradês), trocada em 19 a 21/10 pela direção "Álbum de figurinhas": cada atleta é uma figurinha, ouro `#F2C23A` com tinta `#10142A`, uma família tipográfica (Archivo). MVP funcional no Supabase, rota `/design-system`, acessibilidade WCAG 2.1 AA. | `DESIGN.md`, PRs #5 e seguintes |

## O que funcionou
- **Componentes como funções** (`athleteCard`, `tryoutCard`, `input`, `selectField`) deixaram trocar a direção visual inteira em poucos commits, e a rota `/design-system` usa as mesmas funções do app: o que aparece lá é o que está nas telas.
- **Tokens com o mesmo nome desde a Sprint 1.** Os valores mudaram duas vezes (Gramado → Álbum), os nomes não. Nenhuma tela quebrou na troca, e o tema claro só redefine os mesmos tokens.
- **Regra "toda ação leva a um resultado real".** Ela cortou os votos e curtidas, as telas que só simulavam e os dados sem identificação. Os perfis de exemplo passaram a ser marcados como exemplo.
- **Medir em vez de estimar.** Contraste calculado por script, axe-core e Lighthouse rodados em produção (celular 85/100/100/100, desktop 96/100/100/100). Os testes acharam problemas que o olho não pegou: fotos dando 404 em produção, scroll lateral a 768 e a 320 px, título de aba fixo e campos sem `autocomplete`.
- `[completar com a percepção da equipe]`

## O que não funcionou
- **Conveniência que custou o design.** Trocar o build do Tailwind pelo CDN para abrir no Live Server apagou os tokens e derrubou a performance. Decisão de ambiente de desenvolvimento precisa passar por revisão de design.
- **A primeira direção da Sprint 4 não durou.** "Gramado à noite" parecia um painel genérico de esportes; foi refeita em dois dias. Pesquisar referências antes de desenhar teria evitado o retrabalho.
- **Dados de exemplo com data fixa** venciam e faziam a tela parecer falsa. As peneiras de exemplo passaram a ter datas relativas ao dia de hoje.
- **Processo de entrega.** Boa parte da Sprint 4 foi integrada por merge local na `main`, sem PR, e as branches remotas foram apagadas. Isso apaga a autoria individual que a disciplina pede; a partir do PR #5 a integração voltou a ser por PR.
- **Deploy sem checagem depois do build.** As fotos não eram copiadas para o `dist/` e ninguém percebeu porque, localmente, o servidor de desenvolvimento servia os arquivos.
- `[completar]`

## O que aprendemos
- O design system só se sustenta se for o mesmo código das telas; uma página de styleguide separada envelhece.
- Acessibilidade não é uma passada final: reflow, título e `autocomplete` falharam em telas que já "passavam" no axe, porque o axe não testa esses critérios.
- `[completar com o que os testes com usuários mostraram: tarefa mais difícil, SUS médio, os 3 ajustes]`

## Próximos passos
- Rodar a validação com 5 usuários externos e aplicar os ajustes de severidade 3 e 4.
- Verificar com leitor de tela (NVDA/VoiceOver) os itens do checklist WCAG que ainda estão em aberto.
- `[completar]`
