# Pelé Academia — TIER-ZERO (Sprint 4)

Plataforma que conecta atletas de base (Sub-7 a Sub-20) às peneiras da Pelé Academia. Funcionários (treinadores e olheiros) buscam atletas, avaliam, conversam e abrem peneiras; atletas montam o perfil e se inscrevem nas peneiras compatíveis com a posição e a categoria.

- **Deploy:** [tf-3-sprint3.vercel.app](https://tf-3-sprint3.vercel.app) <!-- confirmar o link ativo antes da banca -->
- **Design system ao vivo:** [`/#/design-system`](https://tf-3-sprint3.vercel.app/#/design-system)
- **Figma:** `[inserir link do Figma]`
- **Repositório:** [github.com/artei4/TF3-Sprint3](https://github.com/artei4/TF3-Sprint3)

## Modelo de MVP: FUNCIONAL

O fluxo principal roda de ponta a ponta com back-end real (Supabase: Postgres, Auth e RLS):

1. O funcionário cria uma peneira (data, local, categoria, posições e vagas).
2. O atleta vê a peneira, confere se é compatível e se inscreve. O servidor recusa a inscrição se não houver vaga ou se a peneira estiver cancelada.
3. O funcionário vê os inscritos, abre o perfil, registra a avaliação e conversa com o atleta.
4. Se a peneira for cancelada, o inscrito vê o motivo na própria tela de peneiras.

**Bastidores:**
- Contas, perfis, avaliações, peneiras, inscrições e mensagens ficam no Supabase. As regras de acesso estão nas policies RLS de `supabase/migrations/`.
- Só e-mails da tabela `staff_allowlist` viram funcionário.
- As conversas não usam Realtime (custo). A tela busca mensagens novas a cada 8 s enquanto está aberta e visível.
- Notificações, favoritos e votos ficam no navegador (`localStorage`).
- Sem Supabase, ou com `?local=1` na URL, o app roda em **modo local**: tudo fica no navegador, com dados de exemplo identificados como "Perfil de exemplo".

Cada tela do fluxo tem estados reais: carregando (skeleton), vazio (com próxima ação), erro (mensagem e "Tentar de novo") e sucesso (toast e estado confirmado no card).

## Stack

Vite 8 · Tailwind CSS 4 (`@tailwindcss/vite`, tokens em `@theme`) · JavaScript puro (ES Modules) · Supabase (supabase-js via CDN com versão fixa).

## Rodar localmente

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # gera dist/
npm run preview    # serve o build
```

> Desde a Sprint 4 o Tailwind é compilado pelo Vite. O modo "Live Server sem npm" foi removido porque o Tailwind via CDN derrubava a performance e gerava aviso no console.

### Banco de dados (uma vez por projeto Supabase)

No painel do Supabase → **SQL Editor**, rode em ordem os arquivos de `supabase/migrations/`:
1. `20260921120000_contas_e_conversas.sql`
2. `20260930120000_disable_message_realtime.sql`
3. `20261016120000_peneiras.sql`

URL e chave publicável ficam em `assets/js/config.js`. Detalhes em `SUPABASE_SETUP.md`.

### Contas de teste

| Tipo | E-mail | Senha |
|---|---|---|
| Funcionário | `treinador@academiapele.com` | `Academia123!` |
| Jogador | `gabriel@academiapele.com` | `Demo123!` |

## Telas e rotas

| Rota | Quem acessa | O que faz |
|---|---|---|
| `#/login`, `#/register`, `#/reset-password` | público | entrar, criar conta de jogador, recuperar senha |
| `#/dashboard` | todos | visão geral (atleta: próxima peneira e atividade; funcionário: indicadores e radar) |
| `#/athletes` | funcionário | banco de atletas com filtros em tempo real, perfil, avaliação, exportação CSV |
| `#/profile` | atleta | perfil, endereço e posições |
| `#/tryouts` | todos | peneiras: criar, inscrever-se, ver inscritos, cancelar |
| `#/messages` | todos | conversas entre atleta e funcionário |
| `#/design-system` | público | tokens e componentes em todos os estados |

## Design system

Direção **"Gramado à noite"** (ver `DESIGN.md`). Os tokens da Sprint 1 (`brand`, `brand-strong`, `night`, `panel`, `ink-soft`, `success`, `danger`, `radius-card`, `radius-control`, `spacing-page`, breakpoints `tablet`/`wide`) foram preservados e evoluídos em `assets/js/styles.css`. Os novos tokens são `chalk`, `raised`, `line`, `line-strong`, `brand-ink`, `focus`, `warning`, escalas de texto, sombras e movimento. Todos os pares de texto passam o contraste AA.

## Acessibilidade e performance

- Landmarks (`header`, `nav`, `main`, `footer`), skip link, `aria-current` na navegação e foco visível em todos os interativos.
- Modais com título acessível, foco inicial, Tab preso, Esc e foco devolvido.
- Labels em todos os campos, toasts anunciados (`aria-live`), `prefers-reduced-motion` respeitado e alvos de toque ≥ 44px.
- Uma família de fonte variável com `display=swap`. CSS compilado de cerca de 10 KB gzip, sem Tailwind CDN.
- Checklist: `docs/sprint4/checklist-wcag.md`. As pontuações Lighthouse de produção entram no PDF.

## Equipe e contribuições (Sprint 4)

| Integrante | RM | Branch(es) Sprint 4 | PR(s) | Telas/Componentes |
|---|---|---|---|---|
| Felipe Braga Terzella | RM573529 | `[branch]` | `#[PR]` | `[preencher]` |
| Arthur Bergami Lucas | RM570679 | `[branch]` | `#[PR]` | `[preencher]` |
| Davi Martins Herculano | RM572699 | `[branch]` | `#[PR]` | `[preencher]` |
| Victor Lopes Tavares da Fonseca | RM571315 | `[branch]` | `#[PR]` | `[preencher]` |
| Marcos Vinícios Corrêa dos Santos | RM571080 | `feat/sprint4-tokens-base`, `feat/sprint4-design-system`, `feat/sprint4-redesign-home`, `feat/sprint4-fluxo-mvp`, `feat/sprint4-a11y-perf`, `docs/sprint4-readme-entrega` | `#[PR]` | tokens, design system, redesign, peneiras/conversas no Supabase, acessibilidade, documentação |

> Cada integrante precisa de pelo menos uma branch própria mergeada via PR na Sprint 4.

## Entregáveis da Sprint 4

- Validação com usuários: `docs/sprint4/roteiro-teste.md`, `metricas.md`, `sus.md`, `ajustes.md`
- Retrospectiva: `docs/sprint4/retrospectiva.md`
- Roteiro do vídeo: `docs/sprint4/roteiro-video.md`
- Esqueleto do PDF: `docs/sprint4/pdf-esqueleto.md`
- Integrantes: `integrantes.txt` · Uso de IA: `PROMPTS.md`
