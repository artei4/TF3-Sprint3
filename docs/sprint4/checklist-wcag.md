# Checklist WCAG 2.1 AA — Pelé Academia

Marque ✅ / ❌ / N/A após verificar **em produção**. A coluna "Implementado" diz o que o código já faz; a coluna "Verificado" é da equipe.

Ferramentas: Lighthouse (DevTools), axe DevTools, navegação só por teclado (Tab, Shift+Tab, Enter, Espaço, Esc) e leitor de tela (NVDA ou VoiceOver).

| Critério | O que conferir | Implementado | Verificado |
|---|---|---|---|
| 1.1.1 Conteúdo não textual | Logo com alt; logo decorativa com `alt=""`; ícones com `aria-hidden` e botões só de ícone com `aria-label` | sim | ✅ axe: 0 violações (image-alt, button-name) |
| 1.3.1 Informação e relações | Landmarks header/nav/main/footer; headings em ordem; labels nos campos; fieldset nas posições | sim | ✅ axe: 0 violações (landmarks, headings, label) |
| 1.3.5 Propósito do campo | `autocomplete` em nome, e-mail, telefone, CEP | sim | ✅ campos da própria pessoa com `autocomplete` (os do responsável e do local da peneira não são dados de quem preenche) |
| 1.4.1 Uso de cor | Estados (erro, lotada, inscrito) também têm texto | sim | ✅ prints 07/08: "Inscrito" e "vagas livres" em texto |
| 1.4.3 Contraste (texto) | ≥ 4.5:1; menor par medido 6.2:1 (`danger` sobre `raised`) | sim | ✅ axe color-contrast: 0 violações; Lighthouse Acessibilidade 100 |
| 1.4.4 Redimensionar texto | 200% de zoom sem perder conteúdo | | ✅ 683 px (200% de 1366 px): sem scroll lateral em 7 telas |
| 1.4.10 Reflow | 320 px sem scroll horizontal | sim | ✅ 320 px: sem scroll lateral em 7 telas |
| 1.4.11 Contraste não textual | Borda de campo `line-strong` 4.0:1; anel de foco 11.6:1 | sim |  |
| 1.4.12 Espaçamento de texto | Sem cortes ao aumentar entrelinha e espaçamento | | ✅ sem scroll lateral com o espaçamento do critério (390 px); conferir cortes no olho |
| 2.1.1 Teclado | Todo o fluxo (login → inscrição → conversa) só com teclado | | ✅ parcial: login → painel → Peneiras → modal só com teclado; falta inscrição e conversa |
| 2.1.2 Sem armadilha | Modais prendem o Tab, mas Esc fecha | sim | ✅ 30 Tabs dentro do modal sem sair; Esc fecha |
| 2.4.1 Pular blocos | Skip link "Pular para o conteúdo" | sim | ✅ 1º Tab foca o skip link; Enter leva o foco ao `main` |
| 2.4.2 Título da página | `<title>` descritivo | sim (muda por rota) | ✅ título por rota (ex.: "Peneiras · TIER ZERO | Pelé Academia") |
| 2.4.3 Ordem de foco | Ordem lógica; foco vai para o modal e volta a quem o abriu | sim | ✅ Esc devolve o foco ao botão que abriu o modal |
| 2.4.6 Cabeçalhos e rótulos | Títulos descrevem a seção; botões nomeiam a ação | sim |  |
| 2.4.7 Foco visível | Contorno de 2px `focus` em todos os interativos | sim | ✅ 25 Tabs no login: todos com contorno ou sombra de foco |
| 2.5.3 Rótulo no nome | Nome acessível contém o texto visível | |  |
| 3.1.1 Idioma da página | `lang="pt-BR"` (vira `es` no toggle) | sim | ✅ axe html-has-lang / valid-lang |
| 3.2.2 Na entrada | Filtros mudam a lista sem trocar de página ou de foco | sim |  |
| 3.3.1 Identificação de erro | Mensagens de erro em texto, com `role="alert"` | sim | ✅ prints 02 (login) e 04 (cadastro) |
| 3.3.2 Rótulos ou instruções | Todos os campos com label visível | sim | ✅ axe label: 0 violações |
| 3.3.3 Sugestão de erro | Erro diz como corrigir (ex.: CPF, data) | |  |
| 4.1.2 Nome, função, valor | `aria-pressed`, `aria-current`, `aria-busy`, `aria-modal` | sim | ✅ axe aria-*: 0 violações |
| 4.1.3 Mensagens de status | Toasts em `role="status" aria-live="polite"` | sim |  |
| Movimento | `prefers-reduced-motion` desliga animações | sim |  |

Resultado automatizado (axe-core 4, regras WCAG 2.0/2.1 A e AA), **em produção** (tf-3-sprint3.vercel.app, 03/11/2026): 0 violações em login, cadastro, design system, privacidade, termos, sobre, contato e em todas as telas de atleta, funcionário e olheiro (1366 px).

Os itens marcados ✅ foram verificados por script (Playwright + axe-core) em 03/11/2026; a coluna vazia ainda precisa de verificação manual da equipe (leitor de tela NVDA/VoiceOver, contraste de bordas e leitura dos textos). Os itens 1.3.5, 1.4.10 e 2.4.2 foram corrigidos no PR #6 e verificados de novo em produção depois do merge.

Lighthouse em produção (03/11/2026, relatórios em `docs/sprint4/lighthouse/`): celular: Performance 85, Acessibilidade 100, Boas práticas 100, SEO 100; desktop: 96, 100, 100, 100.
