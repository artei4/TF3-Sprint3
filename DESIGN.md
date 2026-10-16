# Design — Pelé Academia (Sprint 4)

Direção: **"Gramado à noite"**. A plataforma é o vestiário e a prancheta do treinador sob os refletores.

- **Conceito:** campo de treino à noite. Fundo verde-escuro com a marcação do meio-campo em cal quase invisível, luz de refletor dourada no topo e o **10 vazado** (a camisa do Pelé) como elemento gráfico dos heros.
- **Tom:** direto, esportivo, sem floreio. Botões dizem o que fazem ("Inscrever-se", "Salvar avaliação").
- **Tipografia:** **Bricolage Grotesque** nos títulos e números (eixo óptico, peso 500–700, tracking −0.035em) e **Instrument Sans** no texto (400–600). Ambas variáveis, `display=swap`.
- **Paleta (tokens):** `night #0D1612`, `panel #15211B`, `raised #1B2A22`, `chalk #EEF1E8`, `ink-soft #A7B5AA`, `brand #D8B05C`, `brand-strong #E6C56E`, `success #78D2A3`, `danger #EF8B8B`. Todos os pares de texto passam AA (o menor é 6.2:1). As bordas de campo usam `line-strong` (4.0:1).
- **Cores de futebol:** posições como nos games de futebol (goleiro `#F5A34B`, defesa `#6FB1FF`, meio `#57D49A`, ataque `#FF7B6E`) e escala de nota de 0 a 10 (`rate-1` vermelho < 6 → `rate-5` azul ≥ 9). Todas com contraste ≥ 5.4:1.
- **Componentes do domínio:** carta de atleta (nota + sigla da posição), placar da peneira, campo tático "Elenco em campo" com cada atleta na sua zona, loader de bola quicando (boot, listas e botões) e skeleton com faixas de gramado.
- **Marca:** TIER ZERO é a marca principal, com o selo "Em parceria com a Pelé Academia". Símbolo "O da prancheta": na prancheta o treinador marca o jogador com um O (o zero) e o movimento com uma seta; a corrida em curva sai da abertura do O ("do zero para a frente"). No login o O se desenha. Favicon simplificado (O + bola) em `assets/brand/tier-zero.svg`.
- **Layout logado:** barra lateral fixa no desktop (marca, navegação, CTA, selo e perfil), conteúdo numa folha (`--color-sheet`) separada do fundo em grade de pontos; tablet com navegação no topo; celular com barra inferior.
- **Raios:** `radius-card` 1.25rem para superfícies e `radius-control` .75rem para controles; pílulas só em tags e chips.
- **Sombras:** só onde há elevação real: `shadow-lift` no CTA primário, `shadow-modal` em modais e toasts.
- **Espaçamento:** base de 4px do Tailwind, `spacing-page` 1.25rem, alvos de toque ≥ 44px (2.75rem).
- **Movimento:** transição entre telas (View Transitions nativas), título que entra palavra por palavra, cards com reveal em cascata ao rolar, contadores nos números, spotlight dourado que segue o cursor, barra de vagas que preenche, toasts e modais com mola, indicador da navegação que desliza, número de camisa com drift ligado ao scroll (CSS scroll-driven). Rolagem suave com Lenis só em mouse/trackpad. `prefers-reduced-motion` desliga tudo.
- **Responsivo:** navegação inferior fixa no celular (zona do polegar) e filtros de atletas em bottom sheet abaixo de 64rem.
- **Breakpoints:** mobile (< 48rem), tablet (`tablet` 48rem) e desktop (`lg` 64rem, `wide` 90rem).

Fonte da verdade dos tokens: `assets/js/styles.css` (`@theme static`). Tudo ao vivo em `#/design-system`.
