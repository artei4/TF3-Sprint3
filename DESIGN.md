---
name: TIER ZERO | Pelé Academia
description: Plataforma de talentos do futebol de base em forma de álbum de figurinhas; cada atleta é uma figurinha, cada página é uma folha do álbum.
colors:
  brand: "#F2C23A"
  brand-strong: "#FFD45C"
  brand-ink: "#10142A"
  cta: "#F2C23A"
  cta-strong: "#FFD45C"
  album: "#F2C23A"
  album-ink: "#10142A"
  album-soft: "#4A3A06"
  album-ink-hover: "#1E2744"
  paper: "#FFFFFF"
  night: "#0B0F1C"
  panel: "#131A2B"
  raised: "#1A2238"
  sheet: "#10162A"
  stripe: "#0F1424"
  line: "#283352"
  line-strong: "#6E7BA0"
  chalk: "#F1F3F8"
  ink-soft: "#A8B2CC"
  focus: "#FFD45C"
  success: "#78D2A3"
  danger: "#EF8B8B"
  warning: "#FFC85C"
  pos-gk: "#F5A34B"
  pos-def: "#6FB1FF"
  pos-mid: "#57D49A"
  pos-atk: "#FF7B6E"
  rate-1: "#FF6B6B"
  rate-2: "#FFA94D"
  rate-3: "#9AD95F"
  rate-4: "#2FD3A8"
  rate-5: "#5AA8FF"
  grass: "#10291C"
  grass-2: "#133120"
typography:
  display-cover:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.3rem, 1rem + 6.4vw, 6rem)"
    fontWeight: 850
    lineHeight: 0.94
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 125"
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 1.4rem + 3.6vw, 4rem)"
    fontWeight: 850
    lineHeight: 0.94
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 125"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.85rem, 1.3rem + 1.8vw, 2.9rem)"
    fontWeight: 850
    lineHeight: 0.94
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 125"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 1.1rem + .6vw, 1.6rem)"
    fontWeight: 800
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 112"
  numeral:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "'tnum' 1"
    fontVariation: "'wdth' 118"
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
    fontVariation: "'wdth' 100"
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 600
rounded:
  control: "0.75rem"
  card: "1.25rem"
  sheet: "1.5rem"
  pill: "999px"
spacing:
  page: "1.25rem"
  touch: "2.75rem"
  panel: "1.25rem"
  panel-wide: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.cta}"
    textColor: "{colors.brand-ink}"
    rounded: "{rounded.control}"
    padding: "0.75rem 1.1rem"
    height: "2.75rem"
  button-primary-hover:
    backgroundColor: "{colors.cta-strong}"
  button-primary-on-album:
    backgroundColor: "{colors.album-ink}"
    textColor: "{colors.album}"
    rounded: "{rounded.control}"
    padding: "0.75rem 1.1rem"
    height: "2.75rem"
  button-primary-on-album-hover:
    backgroundColor: "{colors.album-ink-hover}"
  button-secondary:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.control}"
    padding: "0.75rem 1.1rem"
    height: "2.75rem"
  button-ghost:
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.control}"
    padding: "0.6rem 0.75rem"
  field:
    backgroundColor: "{colors.night}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.control}"
    padding: "0.7rem 0.85rem"
    height: "2.75rem"
  tag:
    textColor: "{colors.brand}"
    rounded: "{rounded.pill}"
    padding: "0.25rem 0.65rem"
    typography: "{typography.label}"
  panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.card}"
    padding: "{spacing.panel}"
  hero-album:
    backgroundColor: "{colors.album}"
    textColor: "{colors.album-ink}"
    rounded: "{rounded.card}"
  paper-sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.album-ink}"
    rounded: "{rounded.card}"
  sticker:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.album-ink}"
    width: "13.5rem"
  nav-link:
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.control}"
    padding: "0.6rem 0.85rem"
---

# Design System: TIER ZERO | Pelé Academia

## Overview

**Creative North Star: "O Álbum de Figurinhas da Base"**

A plataforma é um álbum de figurinhas: cada atleta é uma figurinha com nota e faixa (Bronze, Prata, Ouro ou base), cada página é uma folha do álbum. O ouro saturado de capa de álbum domina a landing, o cadastro e os heros logados; tudo o que fica sobre ele é escrito em tinta quase preta azulada. Formulários e listas ficam na folha (branca fria no tema claro, azul-tinta no tema noturno). Títulos e números são letreiro de álbum: Archivo expandido, pesado e em caixa-alta.

A densidade é de produto: a capa e os heros são cartazes, mas as telas de trabalho (banco de atletas, peneiras, conversas) são folhas planas, com borda de 1px, para leitura rápida. A materialidade vem de objetos de álbum, não de efeitos de interface: a figurinha com moldura branca recortada e sombra curta de adesivo, o pacote que se rasga na abertura, as fotos coladas com moldura branca, a prancheta tática desenhada em tinta atrás do ouro. O tema noturno é azul-tinta, nunca verde; o único verde do sistema é o gramado do campo tático, que é um objeto físico, e a cor de sucesso.

Esta direção substitui o "Gramado à noite" (fundo verde-escuro, painéis em degradê, Bricolage Grotesque + Instrument Sans). Os nomes de token da Sprint 1 (`brand`, `brand-strong`, `night`, `panel`, `ink-soft`, `success`, `danger`, `radius-card`, `radius-control`, `spacing-page`, `tablet`, `wide`) foram mantidos; os valores evoluíram. O dourado de marca da Sprint 1 continua sendo `brand`, e agora também é o ouro do álbum.

**Key Characteristics:**
- Ouro de álbum chapado como campo dominante da capa e dos heros, tinta por cima.
- Uma só cor de ação: o ouro na folha, a tinta sobre o ouro.
- Archivo variável: largura 125 e peso 850–900 em caixa-alta para títulos e notas; largura 100 para o texto.
- A figurinha do atleta como componente central (perfil, início, capa, modal).
- Superfícies planas com borda de 1px; profundidade só em objetos físicos (figurinha, foto, folha de papel, modal).
- Cores de posição e escala de nota vindas dos games de futebol, remapeadas para tinta escura sobre o ouro.

## Colors

Ouro de álbum e tinta azul-marinho, com folha fria e cores de jogo funcionais.

### Primary
- **Ouro de Álbum** (`brand` / `album` / `cta`): o mesmo dourado da Sprint 1. Campo inteiro da capa, do cadastro, da abertura e dos heros logados; fundo do botão principal na folha; pílula ativa do seletor e da navegação inferior. Na folha clara o texto em ouro troca para o ouro escuro do tema claro (#8A6500) para passar AA.
- **Ouro Aceso** (`brand-strong` / `cta-strong` / `focus`): hover do botão principal e anel de foco no tema noturno.

### Secondary
- **Tinta de Álbum** (`album-ink` / `brand-ink`): todo texto sobre o ouro (11,2:1), o botão principal quando ele está sobre o ouro ou sobre o papel, a lombada e o traço da prancheta tática. Hover em `album-ink-hover`.
- **Tinta Secundária sobre o Ouro** (`album-soft`): legendas e texto de apoio sobre o ouro (6,6:1).

### Tertiary
- **Cores de Posição** (`pos-gk` laranja, `pos-def` azul, `pos-mid` verde, `pos-atk` vermelho): convenção dos games, usadas em sigla, selo e ponto do campo tático. Sobre o ouro viram versões escuras (#6A3500, #0F3672, #094D2D, #7E2216).
- **Escala de Nota** (`rate-1` vermelho < 6 até `rate-5` azul ≥ 9): cor da nota em um relance; também remapeada para tinta escura sobre o ouro.
- **Gramado** (`grass`, `grass-2`): faixas do campo tático "Elenco em campo". É o único verde de superfície.

### Neutral
- **Noite Azul-Tinta** (`night`): fundo do app no tema noturno e fundo dos campos de formulário.
- **Painel** (`panel`), **Elevado** (`raised`), **Folha** (`sheet`): camadas tonais do tema noturno: cartões, modais/toasts e a folha de conteúdo do desktop.
- **Linha** (`line`) para divisórias e bordas decorativas; **Linha Forte** (`line-strong`, ≥ 3:1) para borda de controles.
- **Cal** (`chalk`): texto principal no tema noturno. **Tinta Suave** (`ink-soft`): texto secundário.
- **Papel** (`paper`): folha de login e cadastro (sempre clara em qualquer tema), moldura da figurinha e das fotos coladas.
- **Estados:** `success`, `danger`, `warning`, sempre com versões escuras sobre o ouro e o papel.

O tema claro mantém os mesmos nomes e troca os valores (fundo #EEF0F5, painel #FFFFFF, texto #11162A, ouro de texto #8A6500); os valores completos estão no sidecar.

### Named Rules
**The One Action Rule.** Existe uma só cor de ação. Na folha, o botão principal é ouro com tinta; sobre o ouro ou sobre o papel, ele inverte para tinta com ouro. Nenhuma segunda cor de destaque compete com ela.

**The Ink-on-Gold Rule.** Tudo o que fica sobre o ouro é tinta. Um hero ou bloco `on-album` remapeia os tokens (texto, linhas, posições, notas, estados) para versões escuras com contraste ≥ 5:1 sobre #F2C23A; nunca coloque texto claro ou cor de jogo clara direto no ouro.

**The Navy Night Rule.** O tema noturno é azul-tinta. Verde só no gramado do campo tático e na cor de sucesso.

## Typography

**Display Font:** Archivo variável, largura 125 (com ui-sans-serif, system-ui)
**Body Font:** Archivo variável, largura 100 (com ui-sans-serif, system-ui, -apple-system, Segoe UI)

**Character:** Uma família só, usada em dois eixos: expandida e pesada em caixa-alta é o letreiro do álbum (títulos, notas, nome na figurinha, lombada); na largura normal é o texto de produto, neutro e legível. Carregada do Google Fonts com `wdth 75..125` e `wght 400..900`, `display=swap`.

### Hierarchy
- **Display de capa** (850, clamp 2.3rem → 6rem, 0.94, caixa-alta, máx. 11ch): só o título da capa do álbum.
- **Display** (850, clamp 2.25rem → 4rem, 0.94, caixa-alta): título de página fora da folha de conteúdo e títulos do cadastro.
- **Headline** (850, clamp 1.85rem → 2.9rem, caixa-alta): título de página dentro da folha de conteúdo; no hero sobe para clamp 2rem → 3.4rem.
- **Title** (800, largura 112, clamp 1.25rem → 1.6rem): título de seção e de cartão, em caixa normal. `h2` e `h3` usam largura 108.
- **Numeral** (800, largura 118, algarismos tabulares, altura 1): notas, contagens, vagas, dias. A nota da figurinha (OVR) usa 900 e largura 125.
- **Body** (400–500, 1rem, 1.65): texto corrido com até 65ch; o texto de apoio da capa usa 1.1rem / 1.5 com até 34ch.
- **Label** (600–700, 0.75–0.85rem): rótulos de campo, tags, atributos da figurinha, navegação.

### Named Rules
**The Album Lettering Rule.** Caixa-alta expandida (largura 125, peso 850+) é reservada a títulos de página, nome e nota da figurinha e à lombada. Texto, rótulos e títulos de seção ficam em caixa normal.

**The One Family Rule.** Archivo é a única família. A variação vem dos eixos de largura e peso, não de uma segunda fonte.

## Layout

Mobile primeiro (uso majoritário no celular). Breakpoints: `tablet` 48rem, `lg` 64rem, `wide` 90rem. Espaçamento na base de 4px do Tailwind, `spacing-page` 1.25rem de margem, alvos de toque ≥ 2.75rem (44px).

- **Capa do álbum (login):** ouro em tela cheia. No celular: título, folha de login, fotos coladas e leque de figurinhas em uma coluna. A partir de 64rem, grade de três colunas: lombada vertical à esquerda ("Peneiras · Sub-7 a Sub-20", com fio de 2px em tinta), título enorme com o leque de três figurinhas abaixo, e a folha de papel de login com 27rem à direita. A prancheta tática animada ocupa o fundo do lado direito, nunca sob as letras.
- **Cadastro:** a mesma capa de ouro com a folha de papel (0.8fr / 1.2fr a partir de 64rem).
- **App logado:** celular com navegação inferior fixa (zona do polegar); tablet com navegação no topo; desktop com barra lateral fixa de 15.5rem e o conteúdo numa folha arredondada (1.5rem) separada do fundo.
- **Heros logados:** bloco de ouro no topo da tela. No início, a figurinha do atleta fica à direita, girada 5°, a partir de 48rem; no celular ela aparece menor, acima do cumprimento. No perfil, a figurinha fica no centro do topo, entre as informações e os números (três colunas a partir de 64rem).
- **Filtros de atletas:** bottom sheet abaixo de 64rem, coluna fixa no desktop.

## Elevation & Depth

Híbrido com regra clara: as superfícies de interface são planas (borda de 1px, sem degradê nem brilho interno) e a profundidade fica com objetos físicos do álbum, que recebem sombras curtas e próximas, como papel sobre papel.

### Shadow Vocabulary
- **Adesivo** (`filter: drop-shadow(0 14px 16px rgb(0 0 0 / .28))`): figurinha. O espaço vazio da figurinha usa `drop-shadow(0 10px 12px rgb(16 20 42 / .22))`.
- **Foto colada** (`box-shadow: 0 18px 28px -18px rgb(16 20 42 / .7)`): fotos com moldura branca na capa.
- **Folha de papel** (`box-shadow: 0 28px 56px -30px rgb(16 20 42 / .55)`): folha de login e cadastro sobre o ouro.
- **Botão principal** (`box-shadow: 0 6px 14px -10px rgb(0 0 0 / .55)`): leve apoio do botão.
- **Modal** (`--shadow-modal: 0 32px 64px -24px rgb(0 0 0 / .75)`): modais, toasts, bottom sheet de filtros.

### Named Rules
**The Flat Sheet Rule.** Painéis, cartões e botões secundários são chapados com borda de 1px. Sombra só em objeto físico (figurinha, foto, papel) ou em camada sobreposta (modal, toast, sheet).

**The Physical Object Rule.** O campo tático e o placar são objetos e ficam sempre noturnos, em qualquer tema; o campo mantém o gramado verde em faixas.

## Shapes

- **Controles** com cantos suaves (`radius-control` 0.75rem): botões, campos, alertas, toasts, seletor.
- **Cartões e folhas** (`radius-card` 1.25rem): painéis, heros, folha de papel; a folha de conteúdo do desktop usa 1.5rem; o bottom sheet usa 1.5rem só no topo.
- **Pílulas** (999px) só em tags, chips, contadores e no chip de perfil.
- **Figurinha:** octógono de cantos chanfrados (`clip-path: polygon(12% 0, 88% 0, 100% 7%, 100% 93%, 88% 100%, 12% 100%, 0 93%, 0 7%)`) com moldura branca de 5px recortada no mesmo formato. É a silhueta assinatura do sistema.
- **Foto colada:** retângulo reto, moldura branca de 6px com 22px embaixo, imagem 4:3, girada alguns graus.
- **Espaço vazio da figurinha:** listras diagonais brancas com contorno tracejado de 2px "cole aqui".

## Components

### Buttons
Tácteis e diretos, dizem o que fazem.
- **Shape:** cantos suaves (0.75rem), altura mínima 2.75rem, peso 700, 0.9rem.
- **Primary:** ouro chapado com tinta e borda de 1px #C99A12, padding 0.75rem 1.1rem. Sobre o ouro (hero, cadastro) e sobre o papel (login), inverte para tinta com texto em ouro.
- **Hover / Focus:** hover troca para o ouro aceso (ou #1E2744 na versão em tinta) em 200ms; pressionar reduz para 0.97 em 120ms; foco com contorno de 2px na cor de foco e afastamento de 3px. Carregando: a bola gira no lugar do ícone, com `aria-busy`.
- **Secondary:** painel chapado com borda `line-strong`; hover leva a borda para o ouro. Sobre o ouro fica transparente com borda de tinta a 55%.
- **Ghost:** só texto em tinta suave; hover com véu de 6%.
- **Danger / Incompatível:** texto vermelho com borda vermelha a 45% (contínua) ou 50% (tracejada, para "incompatível").

### Chips
- **Style:** tag em pílula com borda do ouro a 35% e texto em ouro, 0.75rem/700. Variantes `ghost` (tinta suave), `red`, `green`, e `pos-tag` tingida pela cor da posição a 8%.
- **State:** `check-pill` marcado leva a borda para o ouro e o texto para a cor principal.

### Cards / Containers
- **Corner Style:** 1.25rem.
- **Background:** `panel` na folha; ouro nos heros; papel branco nas folhas de login e cadastro.
- **Shadow Strategy:** plano (ver The Flat Sheet Rule).
- **Border:** 1px `line`; no hero a borda some.
- **Internal Padding:** 1.25rem, 1.5rem a partir de 40rem.

### Inputs / Fields
- **Style:** fundo `night`, borda de 1px `line-strong`, 0.75rem, padding 0.7rem 0.85rem, 1rem no celular (evita zoom do iOS).
- **Focus:** borda em ouro e halo de 3px do ouro a 25%.
- **Error / Disabled:** borda `danger` e halo vermelho; somente-leitura mantém o texto em tinta suave sem esmaecer abaixo de AA.

### Navigation
- **Desktop:** barra lateral com marca, links de 0.92rem/600 em tinta suave; ativo com fundo do ouro a 12% e texto principal; botão principal e perfil no pé.
- **Tablet:** links no topo com indicador de 2px em ouro que desliza entre itens.
- **Celular:** navegação inferior flutuante (raio 1.25rem); item atual em pílula de ouro com tinta.

### Figurinha do Atleta (assinatura)
O atleta é uma figurinha de 13.5rem (compacta 10.5rem, grande 16.5rem) com nota (OVR), sigla da posição, categoria, foto redonda, nome em caixa-alta e quatro atributos com lugar fixo.
- **Faixas pela nota:** Ouro (75+), Prata (65–74), Bronze (até 64) em degradês metálicos; carta base (sem nota) em papel branco do álbum, com atributos aguardando avaliação ("—").
- **Verso:** clicar vira a carta (0.75s) e mostra a ficha (dados em lista com divisórias de 1px e tags).
- **Movimento:** inclinação 3D e brilho de foil que segue o ponteiro só com mouse e movimento permitido, e nunca na carta base; ao chegar avaliação nova, a carta gira e acende uma vez.
- **Espaço vazio:** na capa, a figurinha do visitante é um espaço "Sua figurinha · Cole aqui no cadastro" entre duas figurinhas de exemplo.

### Abertura (pacote de figurinhas)
Na primeira visita da sessão, o splash em ouro mostra um pacote em tinta que cai, balança, rasga no topo e solta a carta TIER ZERO girando, com raios de figurinha rara e barra de progresso em tinta. Clique ou Esc pulam.

### Fotos Coladas
Fotos reais de futebol de base (Unsplash) com moldura branca, batendo na capa como figurinha e flutuando devagar. Toda foto em `assets/photos/` carrega a procedência em um `.webp.json` ao lado.

## Do's and Don'ts

### Do:
- **Do** usar o ouro (#F2C23A) como campo dominante da capa, do cadastro e dos heros, e escrever tudo sobre ele em tinta (#10142A).
- **Do** manter uma só cor de ação: ouro na folha, tinta sobre o ouro e sobre o papel.
- **Do** usar Archivo largura 125, peso 850+, caixa-alta para títulos de página e para nota e nome da figurinha; largura 100 para texto.
- **Do** representar o atleta como figurinha com moldura branca chanfrada, faixa pela nota e sombra curta de adesivo.
- **Do** identificar figurinhas e perfis de exemplo como exemplo ("figurinhas de exemplo", "Nota de exemplo", "perfil de exemplo").
- **Do** manter as cores de posição dos games e a escala de nota, usando as versões escuras sobre o ouro.
- **Do** manter o campo tático verde e noturno como objeto físico em qualquer tema.
- **Do** desligar tilt, foil, flutuação, prancheta e abertura com `prefers-reduced-motion`.

### Don't:
- **Don't** voltar ao "Gramado à noite": fundo verde-escuro, painéis com borda em degradê e brilho interno, botão principal em degradê.
- **Don't** usar verde como fundo de tema ou de superfície; verde é só gramado do campo e sucesso.
- **Don't** colocar texto claro ou cor de jogo clara sobre o ouro.
- **Don't** dar sombra a painéis e cartões de interface; sombra é de figurinha, foto, papel e camada sobreposta.
- **Don't** usar degradê decorativo em painéis, cartões e botões; o degradê metálico pertence à figurinha (Ouro, Prata, Bronze) e à carta do pacote.
- **Don't** aplicar foil ou inclinação na carta base nem em quem não usa mouse.
- **Don't** trazer uma segunda família tipográfica.
- **Don't** publicar foto sem o arquivo de procedência ao lado.
