# PROMPTS.md — Pelé Academia

Registro de prompts de IA generativa utilizados como apoio ao desenvolvimento.

## Prompt de escopo
> Transformar os requisitos da Sprint 3 em uma aplicação front-end responsiva para a Pelé Academia, mantendo uma identidade visual institucional e implementando Tailwind CSS, JavaScript Vanilla, acessibilidade e fluxos de atletas e funcionários.

## Prompt de interatividade
> Implementar filtros dinâmicos, validação de CPF, login por papel, perfil editável, peneiras com limitação de posições, popup de localidade, avaliações, favoritos, votos e conversas entre atletas e funcionários usando DOM e eventos do navegador.

## Prompt de documentação
> Organizar o projeto, README e estrutura de arquivos de acordo com os requisitos acadêmicos de Front-End Design e Web Development da Sprint 3.

## Sprint 4 — redesign e MVP (Claude Code, Claude Opus)

Ferramenta: Claude Code (agente no terminal), com as skills de design `impeccable` e `frontend-design`. O plano completo está em `docs/prompts/redesign-sprint4.md`.

> Conduzir o redesign da Sprint 4: diagnóstico do projeto, pesquisa de referências (Awwwards, Linear), direção visual e evolução dos tokens Tailwind da Sprint 1, rota /design-system, fluxo MVP de ponta a ponta, acessibilidade WCAG 2.1 AA, kit de validação com usuários e documentação de entrega, sempre via branches e PRs.

Usos concretos:
- Diagnóstico: a IA identificou que os tokens `@theme` da Sprint 1 tinham sido removidos e que o Tailwind CDN derrubava a performance.
- Direção visual "Gramado à noite" e tokens. Os contrastes WCAG foram calculados por script, não estimados.
- Migration de peneiras e inscrições no Supabase (RLS) e reativação das conversas com polling.
- Gerenciador de modais acessível e varredura com axe-core.
- Modelos de documentação (roteiro de teste, SUS, checklist WCAG, retrospectiva, roteiro de vídeo). **Os dados de teste com usuários são coletados pela equipe; a IA não simulou testes.**

Prompt de auditoria e preparação para produção (completo em `docs/prompts/auditoria-producao.md`):
> Auditar o projeto e prepará-lo para a Vercel preservando o visual: validações de cadastro (CPF, datas, menores com responsável), cronômetro independente por peneira, locais cadastrados pelo painel, chamada/presença, cadastro de funcionário só por convite com permissão verificada no servidor, remoção de votos e curtidas, segurança do chat e do banco (RLS), LGPD e testes dos fluxos críticos.

Revisão humana: `[descrever como a equipe revisou as mudanças antes de irem para a main]`
