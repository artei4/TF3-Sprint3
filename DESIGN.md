# Design — Pelé Academia (Sprint 4)

Direção: **"Gramado à noite"**. A plataforma é o vestiário e a prancheta do treinador sob os refletores.

- **Conceito:** campo de treino à noite. Fundo verde-escuro com faixas de gramado cortado (o único ornamento), texto em "cal" da marcação e o dourado da marca como luz de refletor.
- **Tom:** direto, esportivo, sem floreio. Botões dizem o que fazem ("Inscrever-se", "Salvar avaliação").
- **Tipografia:** uma família variável, **Archivo** (eixos `wdth` 62–100 e `wght` 400–800, `display=swap`). Títulos e números em largura condensada (75%/70%), como os números das camisas. Texto corrido em largura normal, até 65ch.
- **Paleta (tokens):** `night #0D1612`, `panel #15211B`, `raised #1B2A22`, `chalk #EEF1E8`, `ink-soft #A7B5AA`, `brand #D8B05C`, `brand-strong #E6C56E`, `success #78D2A3`, `danger #EF8B8B`. Todos os pares de texto passam AA (o menor é 6.2:1). As bordas de campo usam `line-strong` (4.0:1).
- **Raios:** `radius-card` 1.25rem para superfícies e `radius-control` .75rem para controles; pílulas só em tags e chips.
- **Sombras:** só onde há elevação real: `shadow-lift` no CTA primário, `shadow-modal` em modais e toasts.
- **Espaçamento:** base de 4px do Tailwind, `spacing-page` 1.25rem, alvos de toque ≥ 44px (2.75rem).
- **Movimento:** press em 120ms (escala .97), hover em 200ms e estados em 250ms com `ease-out`. Nada se move sozinho além dos indicadores de loading. `prefers-reduced-motion` zera tudo.
- **Breakpoints:** mobile (< 48rem), tablet (`tablet` 48rem) e desktop (`lg` 64rem, `wide` 90rem).

Fonte da verdade dos tokens: `assets/js/styles.css` (`@theme static`). Tudo ao vivo em `#/design-system`.
