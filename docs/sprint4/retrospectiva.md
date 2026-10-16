# Retrospectiva — evolução do design (Sprint 1 → Sprint 4)

> Rascunho baseado no histórico do repositório. A equipe deve revisar, corrigir e completar com a própria percepção (1 página).

## Linha do tempo
| Sprint | O que aconteceu no design | Evidência |
|---|---|---|
| 1 | Identidade dourado e preto e primeiros tokens (`brand`, `night`, `panel`, `ink-soft`, raios, breakpoints). | tokens recuperados de `d656cca^:assets/js/styles.css` |
| 2 | `[completar: protótipo/Figma]` | `[link Figma]` |
| 3 | Aplicação em Vite + Tailwind 4 + JS puro com os fluxos de atleta e funcionário (17–24/09). Em 18/09 o build do Tailwind foi trocado pelo CDN para abrir no Live Server, e os tokens `@theme` saíram do código (`d656cca`). Depois vieram Supabase, tradução para espanhol e recuperação de senha. | commits `b867920`, `d656cca`, `f2b0f95`, `def2e86` |
| 4 | Tokens restaurados e evoluídos para a direção "Gramado à noite". Rota `/design-system`. Peneiras e conversas no servidor. Acessibilidade AA. | branches `feat/sprint4-*` |

## O que funcionou
- `[completar]`
- Componentes como funções (`athleteCard`, `tryoutCard`, `input`) facilitaram aplicar o novo visual de uma vez.

## O que não funcionou
- Remover o build do Tailwind para facilitar o Live Server custou os tokens e a performance. Decisões de conveniência de desenvolvimento precisam passar por revisão de design.
- Dados de exemplo sem identificação e com datas vencidas pareciam telas falsas.
- `[completar]`

## O que aprendemos
- `[completar: o que os testes com usuários mostraram]`

## Próximos passos
- `[completar]`
