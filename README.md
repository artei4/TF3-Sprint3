# Pelé Academia — TIER-ZERO (Sprint 4)

Plataforma que conecta atletas de base (Sub-7 a Sub-20) às peneiras da Pelé Academia. Funcionários (treinadores e olheiros) buscam atletas, avaliam, conversam e abrem peneiras; atletas montam o perfil e se inscrevem nas peneiras compatíveis com a posição e a categoria. Olheiros de clubes parceiros (só por convite) veem a vitrine dos atletas que a ativaram e pedem contato pela equipe da academia.

- **Deploy:** [tf-3-sprint3.vercel.app](https://tf-3-sprint3.vercel.app) (Vercel, a cada push na `main`)
- **Design system ao vivo:** [tf-3-sprint3.vercel.app/design-system](https://tf-3-sprint3.vercel.app/design-system) (redireciona para `/#/design-system`)
- **Figma:** `[inserir link do Figma]`
- **Vídeo demonstrativo:** [youtu.be/R5p4qm1ZnNw](https://youtu.be/R5p4qm1ZnNw)
- **Repositório:** [github.com/artei4/TF3-Sprint3](https://github.com/artei4/TF3-Sprint3)

## Modelo de MVP: FUNCIONAL

O fluxo principal roda de ponta a ponta com back-end real (Supabase: Postgres, Auth e RLS):

1. O funcionário cria uma peneira (data, local, categoria, posições e vagas).
2. O atleta vê a peneira, confere se é compatível e se inscreve. O servidor recusa a inscrição se não houver vaga ou se a peneira estiver cancelada.
3. O funcionário vê os inscritos, abre o perfil, registra a avaliação e conversa com o atleta.
4. Se a peneira for cancelada, o inscrito vê o motivo na própria tela de peneiras.

**Bastidores:**
- Contas, perfis, avaliações, peneiras, inscrições e mensagens ficam no Supabase. As regras de acesso estão nas policies RLS de `supabase/migrations/`.
- Funcionário novo só entra por convite de um administrador (link de uso único, vale 7 dias, preso ao e-mail). Administrador é verificado no banco (`is_admin()`), não pela tela.
- As conversas não usam Realtime (custo). A tela busca mensagens novas a cada 8 s enquanto está aberta e visível.
- Notificações e a lista de observação (atletas salvos pelo funcionário) ficam no navegador (`localStorage`).
- Atleta com menos de 18 anos precisa da autorização de um responsável legal para criar a conta e se inscrever em peneiras (verificado no banco). O perfil permite atualizar ou revogar a autorização e baixar uma cópia dos próprios dados.
- Não há votos nem curtidas: a nota do atleta vem só das avaliações registradas pela equipe.
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
npm test           # regras do banco (Postgres em WASM) e validações de CPF/data
```

> Desde a Sprint 4 o Tailwind é compilado pelo Vite. O modo "Live Server sem npm" foi removido porque o Tailwind via CDN derrubava a performance e gerava aviso no console.

### Banco de dados (uma vez por projeto Supabase)

No painel do Supabase → **SQL Editor**, rode **em ordem de nome** todos os arquivos de `supabase/migrations/` (13 arquivos, de `20260921120000_contas_e_conversas.sql` a `20261028120000_avisos.sql`). O que cada um faz está em `SUPABASE_SETUP.md`.

URL e chave publicável vêm de `VITE_SUPABASE_URL` e `VITE_SUPABASE_KEY` (ver `.env.example`; na Vercel, em Settings → Environment Variables). Sem elas o app abre em modo local.

### Contas de teste

| Tipo | E-mail | Senha |
|---|---|---|
| Funcionário (administrador) | `funcionario@academiapele.com` | `Academia123!` |
| Funcionário | `treinador@academiapele.com` | `Academia123!` |
| Jogador | `gabriel@academiapele.com` | `Demo123!` |

Na tela de login, o botão **Entrar com o Google** é uma demonstração identificada na própria tela: entra na conta de exemplo da aba escolhida (Jogador, Olheiro ou Funcionário) e não fala com o Google.

## Telas e rotas

| Rota | Quem acessa | O que faz |
|---|---|---|
| `#/login`, `#/register`, `#/reset-password` | público | entrar, criar conta de jogador, recuperar senha |
| `#/dashboard` | todos | visão geral (atleta: próxima peneira e atividade; funcionário: indicadores e radar; olheiro: vitrine e pedidos) |
| `#/athletes` | funcionário, olheiro | banco de atletas com filtros em tempo real, perfil, avaliação, exportação CSV (olheiro: só a vitrine) |
| `#/profile` | atleta, olheiro | perfil, endereço, posições, foto e responsável legal |
| `#/tryouts` | todos | peneiras: criar (com descrição), ver detalhes ao clicar no card, inscrever-se, ver inscritos, cancelar |
| `#/ao-vivo/<id>` | funcionário | peneira ao vivo: chamada, presença e nota rápida |
| `#/messages` | atleta, funcionário | conversas entre atleta e funcionário |
| `#/team` | administrador | convidar funcionários, cancelar convites, desativar e dar acesso de administrador |
| `#/privacidade`, `#/termos` | público | quais dados a plataforma usa, para quê, quem vê, regras para menores e como pedir correção, cópia ou exclusão |
| `#/sobre`, `#/contato` | público | a plataforma e a parceria; Fale conosco (mensagem gravada no servidor, lida pela equipe) |
| `#/convite/<código>` | público | criar a conta de funcionário pelo link do convite |
| `#/design-system` | público | tokens e componentes em todos os estados |

## Design system

Direção **"Álbum de figurinhas"** (ver `DESIGN.md`; substituiu a primeira direção da Sprint 4, "Gramado à noite"). Os tokens da Sprint 1 (`brand`, `brand-strong`, `night`, `panel`, `ink-soft`, `success`, `danger`, `radius-card`, `radius-control`, `spacing-page`, breakpoints `tablet`/`wide`) foram preservados e evoluídos em `assets/js/styles.css`. Os novos tokens são `chalk`, `raised`, `line`, `line-strong`, `brand-ink`, `focus`, `warning`, escalas de texto, sombras e movimento. Todos os pares de texto passam o contraste AA.

## Acessibilidade e performance

- Landmarks (`header`, `nav`, `main`, `footer`), skip link, `aria-current` na navegação e foco visível em todos os interativos.
- Modais com título acessível, foco inicial, Tab preso, Esc e foco devolvido.
- Labels em todos os campos, toasts anunciados (`aria-live`), `prefers-reduced-motion` respeitado e alvos de toque ≥ 44px.
- Uma família de fonte variável com `display=swap`. Tailwind compilado pelo Vite (sem Tailwind CDN).
- Varredura axe-core (WCAG 2.0/2.1 A e AA) em todas as rotas e nos três papéis, a 1366 px: 0 violações. Sem scroll lateral a 390, 768 e 1366 px (português e espanhol).
- Título da aba por página, `autocomplete` nos campos de dados pessoais e reflow sem scroll lateral a 320 px.
- Checklist preenchido: `docs/sprint4/checklist-wcag.md`.
- **Lighthouse em produção (03/11/2026):** celular: Performance 85, Acessibilidade 100, Boas práticas 100, SEO 100 · desktop: 96, 100, 100, 100. Relatórios HTML em `docs/sprint4/lighthouse/`.

## Equipe e contribuições (Sprint 4)

Turma 1ESSRA.

| Integrante | RM | Branch(es) Sprint 4 | PR(s) | Telas/Componentes |
|---|---|---|---|---|
| Felipe Braga Terzella | RM573529 | `[branch]` | `#[PR]` | `[preencher]` |
| Arthur Bergami Lucas | RM570679 | `[branch]` | `#[PR]` | `[preencher]` |
| Davi Martins Herculano | RM572699 | `[branch]` | `#[PR]` | `[preencher]` |
| Victor Lopes Tavares da Fonseca | RM571315 | `[branch]` | `#[PR]` | `[preencher]` |
| Marcos Vinícios Corrêa dos Santos | RM571080 | `feat/sprint4-tokens-base`, `feat/sprint4-design-system`, `feat/sprint4-redesign-home`, `feat/sprint4-fluxo-mvp`, `feat/sprint4-a11y-perf`, `docs/sprint4-readme-entrega`, `feat/conversas`, `feat/peneira-ao-vivo`, `feat/avisos-servidor`, `chore/conformidade-sprint4`, `fix/wcag-reflow-autocomplete-titulo` | [#5](https://github.com/artei4/TF3-Sprint3/pull/5), [#6](https://github.com/artei4/TF3-Sprint3/pull/6) | tokens, design system, redesign, peneiras/conversas no Supabase, acessibilidade, documentação |

> Cada integrante precisa de pelo menos uma branch própria mergeada via PR na Sprint 4.

## Entregáveis da Sprint 4

- Validação com usuários: 5 participantes, NPS 80, CSAT 100%, CES 4,8/5 (`docs/sprint4/metricas.md`); melhorias propostas em `ajustes.md`; roteiro e SUS para a próxima rodada em `roteiro-teste.md` e `sus.md`
- Prints das telas em 390, 768 e 1366 px (com estados de erro, vazio e sucesso), tirados em produção: `docs/sprint4/prints/`
- Relatórios Lighthouse de produção: `docs/sprint4/lighthouse/`
- Retrospectiva: `docs/sprint4/retrospectiva.md`
- Documentos das sprints anteriores: `docs/sprint3/`
- Roteiro do vídeo: `docs/sprint4/roteiro-video.md`
- PDF de entrega: `docs/sprint4/entrega-sprint4.pdf` (gerado de `entrega.html`; para atualizar depois de preencher os testes: `python docs/sprint4/gerar-entrega.py`, abrir `entrega.html` no Chrome e salvar como PDF)
- Integrantes: `integrantes.txt` · Uso de IA: `PROMPTS.md` (prompts completos em `docs/prompts/`)
