# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Atletas de base** (Sub-7 a Sub-20; menores com responsável): criam conta, mantêm perfil (posição, perna, cidade) e se inscrevem em peneiras compatíveis.
- **Funcionários da Pelé Academia** (treinadores, olheiros): buscam e filtram o banco de atletas, abrem perfis, registram avaliações, conversam com atletas e criam/cancelam peneiras.

## Product Purpose
Conectar talentos de base às oportunidades de avaliação da Pelé Academia. Sucesso = peneira criada → atleta compatível inscrito → funcionário vê inscritos e avalia, sem intermediário.

## Capabilities and Constraints
- MVP **funcional**: contas, perfis, avaliações e conversas no Supabase (RLS); fallback local com `?local=1`.
- Stack fixa: Vite + Tailwind CSS 4 + JavaScript puro, SPA com rotas por hash, deploy GitHub Pages.
- Interface em pt-BR (toggle opcional para espanhol).
- Entrega acadêmica FIAP Sprint 4: WCAG 2.1 AA, Lighthouse A11y ≥ 90 e Performance ≥ 80, rota `/design-system`.

## Brand Commitments
- Nome "Pelé Academia" e logo em `assets/brand/` (uma logo nova está por vir; a paleta não deve depender dela).
- Dourado de marca herdado dos tokens da Sprint 1 (`--color-brand`).

## Evidence on Hand
- Nenhum depoimento, métrica ou resultado real. Atletas e peneiras de exemplo são fictícios e precisam ser identificados como exemplo. Não inventar números.

## Product Principles
1. Toda ação leva a um resultado real ou não existe na tela.
2. O atleta sempre sabe se é compatível com a peneira antes de tentar.
3. O funcionário decide rápido: dados escaneáveis e filtros sem recarregar a página.
4. Honestidade sobre dados de exemplo e prazos.

## Accessibility & Inclusion
WCAG 2.1 AA; público jovem e responsáveis, uso majoritário no celular.
