# Checklist WCAG 2.1 AA — Pelé Academia

Marque ✅ / ❌ / N/A após verificar **em produção**. A coluna "Implementado" diz o que o código já faz; a coluna "Verificado" é da equipe.

Ferramentas: Lighthouse (DevTools), axe DevTools, navegação só por teclado (Tab, Shift+Tab, Enter, Espaço, Esc) e leitor de tela (NVDA ou VoiceOver).

| Critério | O que conferir | Implementado | Verificado |
|---|---|---|---|
| 1.1.1 Conteúdo não textual | Logo com alt; logo decorativa com `alt=""`; ícones com `aria-hidden` e botões só de ícone com `aria-label` | sim | |
| 1.3.1 Informação e relações | Landmarks header/nav/main/footer; headings em ordem; labels nos campos; fieldset nas posições | sim | |
| 1.3.5 Propósito do campo | `autocomplete` em nome, e-mail, telefone, CEP | não verificado | |
| 1.4.1 Uso de cor | Estados (erro, lotada, inscrito) também têm texto | sim | |
| 1.4.3 Contraste (texto) | ≥ 4.5:1; menor par medido 6.2:1 (`danger` sobre `raised`) | sim | |
| 1.4.4 Redimensionar texto | 200% de zoom sem perder conteúdo | | |
| 1.4.10 Reflow | 320 px sem scroll horizontal | sim (390 px testado) | |
| 1.4.11 Contraste não textual | Borda de campo `line-strong` 4.0:1; anel de foco 11.6:1 | sim | |
| 1.4.12 Espaçamento de texto | Sem cortes ao aumentar entrelinha e espaçamento | | |
| 2.1.1 Teclado | Todo o fluxo (login → inscrição → conversa) só com teclado | | |
| 2.1.2 Sem armadilha | Modais prendem o Tab, mas Esc fecha | sim | |
| 2.4.1 Pular blocos | Skip link "Pular para o conteúdo" | sim | |
| 2.4.2 Título da página | `<title>` descritivo | parcial (fixo) | |
| 2.4.3 Ordem de foco | Ordem lógica; foco vai para o modal e volta a quem o abriu | sim | |
| 2.4.6 Cabeçalhos e rótulos | Títulos descrevem a seção; botões nomeiam a ação | sim | |
| 2.4.7 Foco visível | Contorno de 2px `focus` em todos os interativos | sim | |
| 2.5.3 Rótulo no nome | Nome acessível contém o texto visível | | |
| 3.1.1 Idioma da página | `lang="pt-BR"` (vira `es` no toggle) | sim | |
| 3.2.2 Na entrada | Filtros mudam a lista sem trocar de página ou de foco | sim | |
| 3.3.1 Identificação de erro | Mensagens de erro em texto, com `role="alert"` | sim | |
| 3.3.2 Rótulos ou instruções | Todos os campos com label visível | sim | |
| 3.3.3 Sugestão de erro | Erro diz como corrigir (ex.: CPF, data) | | |
| 4.1.2 Nome, função, valor | `aria-pressed`, `aria-current`, `aria-busy`, `aria-modal` | sim | |
| 4.1.3 Mensagens de status | Toasts em `role="status" aria-live="polite"` | sim | |
| Movimento | `prefers-reduced-motion` desliga animações | sim | |

Resultado automatizado (axe-core 4, regras WCAG 2.0/2.1 A e AA, local, 16/10/2026): 0 violações em login, cadastro, design system, painel, atletas, peneiras, conversas e modal de atleta. **Repetir em produção e anexar o print ao PDF.**
