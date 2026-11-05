# PLANO DE REDESIGN — Sprint 4 (Front-End Design, FIAP)

## 0. Papel e regras de operação
Você é um desenvolvedor Full-Stack sênior com forte repertório de design de interfaces. Vai conduzir o redesign de um projeto existente para a Sprint 4 da disciplina de Front-End Design.

**Economia de tokens (regra central):**
- Leia só o necessário. Prefira `ls`, `tree -L 2`, `grep` e leitura parcial de arquivos a abrir tudo.
- Não releia arquivos que você mesmo acabou de escrever. Não rode verificações redundantes.
- Rode **no máximo**: 1 build, 1 lint/typecheck ao final de cada fase grande, e nada além disso sem necessidade real.
- Não faça polimento extra, "passes" de revisão ou refatorações fora do escopo.
- Responda de forma curta: diga o que fez em 2–5 linhas por fase.
- Se algo estiver ambíguo e custar pouco perguntar, pergunte uma vez em vez de adivinhar.

**Restrições técnicas inegociáveis:**
- **Não introduzir novos frameworks ou bibliotecas pesadas.** Manter a stack e os padrões atuais do projeto.
- **Tailwind CSS com os tokens da Sprint 1 deve ser mantido.** Abandonar o Tailwind ou remover os tokens zera o critério 3. Evolua os tokens, nunca os remova.
- Idioma da interface e dos textos: português do Brasil.
- Não inventar dados: nada de métricas, resultados de teste, SUS ou pontuações Lighthouse fabricados.

## 1. Caminhos
- Projeto a redesenhar (worktree): `Esta raiz.`
- Projeto de referência (worktree): `C:\Users\User\Documents\GitHub\my-landing-page\`
- Branch base: `main` (nunca commitar direto nela)
- Todos os commits há de vir sem o sufixo do claude.

## 2. Contexto da entrega (resumo do enunciado)
A Sprint 4 transforma o MVP visual anterior em um **MVP real**, entregue ao usuário de ponta a ponta. Prazo: **25/10/2026**.

Critérios (100 pts):
1. **MVP funcional ou concierge (25)**: fluxo principal funcionando de ponta a ponta. Em modelo concierge: canal real monitorado, prazos claros, estados de vazio/loading/erro/sucesso e nenhuma tela falsa ou botão morto.
2. **Validação com usuários (25)**: ≥5 externos, roteiro, métricas (conclusão, tempo, erros, SUS), severidade dos achados e ≥3 ajustes com antes/depois. Sem validação externa = nota zero neste critério.
3. **Design system (20)**: rota `/design-system` ao vivo com componentes e tokens em todos os estados; consistência; layout fluido em 3 breakpoints sem scroll lateral.
4. **Acessibilidade e performance (15)**: WCAG 2.1 AA (semântica, landmarks, foco visível, teclado total, labels, alt), console sem erros, Lighthouse **Acessibilidade ≥ 90** e **Performance ≥ 80**.
5. **Colaboração (15)**: branches/PRs na Sprint 4 (sem commits diretos na main), deploy estável, README completo, retrospectiva e vídeo.

Penalidades relevantes: app fora do ar na banca (zero no critério 5 e teto de 70 pts); repositório privado ou sem identificação (nomes/RM) desclassifica a entrega; integrante sem branch mergeada via PR na Sprint 4 fica com nota individual zero.

## 3. Fase 1 — Reconhecimento enxuto (sem editar nada)
1. No projeto principal: mapeie estrutura de pastas, stack, rotas/páginas, componentes existentes, `tailwind.config.*` (tokens atuais), fontes, e como o fluxo principal funciona hoje. Use `tree -L 2` + leitura dirigida.
2. No projeto de referência: identifique **somente** o que vale reaproveitar como padrão (estrutura de componentes, organização de tokens, convenções, página de design system, se houver). Não copie código cegamente; adapte ao padrão do projeto principal.
3. Entregue um **diagnóstico curto** (máx. ~20 linhas): problemas visuais/UX, botões mortos ou telas fictícias, falhas de acessibilidade evidentes, gargalos de performance prováveis.

## 4. Fase 2 — Skills e pesquisa de referências
**Skills:** liste as skills instaladas e **use as relevantes**, em especial as de design e design thinking (por exemplo `impeccable`, `frontend-design` e equivalentes). Carregue cada skill uma vez, aplique suas diretrizes e não as recarregue.

**Referências de mercado (orçamento limitado: no máximo ~6 consultas web no total):**
- Consulte https://www.awwwards.com/ (seções de Sites of the Day/landing pages) e, se necessário, 2–3 produtos reais em produção com interface reconhecida (ex.: Linear, Stripe, Vercel, Notion, Raycast).
- Extraia **princípios**, não cópias: hierarquia tipográfica, ritmo de espaçamento, uso de cor, micro-interações discretas, densidade de informação, estrutura de hero/CTA/prova social.
- Resuma em no máximo **8 bullets** o que será aplicado ao projeto. Respeite direitos autorais: nada de reproduzir layouts ou textos.
- Filtre por viabilidade: nada que comprometa Lighthouse Performance ≥ 80 (evite animações pesadas, WebGL, vídeos grandes, bibliotecas extras).

## 5. Fase 3 — Direção de design e tokens
1. Defina uma direção visual coerente e distinta (evitar aparência genérica de template). Documente em ~10 linhas: conceito, tom, tipografia, paleta, raios, sombras, espaçamento, movimento.
2. **Evolua os tokens Tailwind existentes** (cores, tipografia, espaçamento, raios, sombras) preservando os nomes e a base da Sprint 1. Garanta contraste AA (4.5:1 para texto normal).
3. Use fontes com carregamento otimizado (`font-display: swap`, poucas famílias/pesos).

## 6. Fase 4 — Implementação (branches e PRs)
Trabalhe em branches pequenas e temáticas, uma por entrega, com PR para a `main`. Sugestão (ajuste ao projeto):
- `feat/sprint4-tokens-base`
- `feat/sprint4-design-system`
- `feat/sprint4-redesign-home` (e demais telas)
- `feat/sprint4-fluxo-mvp`
- `feat/sprint4-a11y-perf`
- `docs/sprint4-readme-entrega`

Regras: commits pequenos e descritivos (Conventional Commits); **nenhum commit direto na main**; preservar histórico de branches/PRs após o merge (sem squash que apague autoria quando possível; sem deletar branches remotas).

### 6.1 Redesign das telas
- Aplicar a direção visual a todas as telas, com consistência de componentes.
- **Layout fluido em 3 breakpoints** (mobile, tablet, desktop), sem scroll horizontal.
- Cada tela do fluxo principal deve ter **estados reais**: vazio, loading (skeleton ou spinner acessível), erro (mensagem clara e ação de recuperação) e sucesso (confirmação inequívoca).

### 6.2 MVP real (funcional ou concierge)
- Eliminar telas fictícias e botões mortos: todo CTA deve executar uma ação real ou ser removido.
- Se o modelo for **concierge**: formulário enviando para canal monitorado de verdade (e-mail, WhatsApp, planilha, webhook, etc., conforme o que o projeto já usa), com **prazo real informado** e tela de confirmação honesta. Descreva os "bastidores" no README.
- Se for **funcional**: garantir o fluxo de ponta a ponta com tratamento de erro.
- Registre qual modelo foi adotado: `{{FUNCIONAL | CONCIERGE}}`.

### 6.3 Rota `/design-system` (styleguide viva)
- Exibir tokens (cores, tipografia, espaçamento, raios, sombras) e componentes (botões, inputs, selects, cards, alertas, modais, navegação, etc.) **em todos os estados reais**: default, hover, focus, active, disabled, loading, erro e sucesso.
- Os componentes mostrados devem ser os **mesmos** usados no app (sem cópias soltas), importados diretamente.
- Rota pública, acessível por teclado e responsiva.

### 6.4 Acessibilidade (WCAG 2.1 AA)
- HTML semântico e landmarks (`header`, `nav`, `main`, `footer`), hierarquia de headings correta.
- Foco visível em todos os interativos, navegação total por teclado, ordem de tab lógica, skip link.
- `label` associado a cada campo, `alt` em imagens relevantes (vazio em decorativas), `aria-*` só quando necessário.
- Respeitar `prefers-reduced-motion`. Contraste AA em todos os pares de cor.

### 6.5 Performance (meta Lighthouse ≥ 80)
- Imagens otimizadas (formato moderno, dimensões, `loading="lazy"` abaixo da dobra, prioridade no LCP).
- Evitar JS desnecessário, dividir código por rota quando o framework já suporta, reduzir fontes e CSS não usado.
- Console limpo: sem erros nem warnings relevantes no build e em produção.

## 7. Fase 5 — Kit de validação com usuários (a LLM prepara, eu executo)
A LLM **não pode** simular testes. Ela deve apenas gerar os **modelos** em arquivos `.md` dentro de `docs/sprint4/`:
- **Roteiro de teste** (tarefas, cenário, perguntas pós-teste), com observação sem intervenção.
- **Planilha/tabela de métricas** por participante: perfil, taxa de conclusão, tempo, erros, travamentos, severidade.
- **Questionário SUS** (10 itens em português) com a fórmula de cálculo.
- **Modelo da tabela de 3 ajustes** (Antes | Depois | Justificativa | Print).
- Eu aplicarei com **≥5 usuários externos** aderentes às personas e preencherei os dados reais.

## 8. Fase 6 — Documentação e entrega
Gerar/atualizar:
- `README.md` final: escopo, modelo de MVP (funcional/concierge e bastidores), setup local, deploy, link do Figma, fluxos e a tabela **Integrante | RM | Branch(es) Sprint 4 | PR(s) | Telas/Componentes**.
- `integrantes.txt` (nomes e RM de todos) e `PROMPTS.md` listando os usos de IA generativa feitos neste trabalho.
- `docs/sprint4/checklist-wcag.md` (checklist WCAG 2.1 AA preenchível) e `docs/sprint4/retrospectiva.md` (modelo de 1 página sobre a evolução do design desde a Sprint 1, com rascunho baseado no histórico do repositório).
- `docs/sprint4/roteiro-video.md`: roteiro de até 3 min cobrindo teste do fluxo e navegação por teclado.
- Rascunho do esqueleto do PDF (capa, links clicáveis, mapa de fluxos, prints, relatório de testes, Lighthouse, grafo de commits, retrospectiva, link do vídeo), pronto para eu preencher com prints e dados reais.

## 9. O que NÃO é responsabilidade da LLM (eu faço)
- Aplicar os testes com usuários reais e coletar SUS.
- Rodar Lighthouse **em produção** e tirar os prints.
- Gravar o vídeo, tirar prints dos breakpoints e do grafo de commits/PRs.
- Confirmar deploy ativo, `main` sincronizada e repositório público.

## 10. Ordem de execução e formato de resposta
Execute fase por fase (1 → 6). Ao final de cada fase, responda com:
1. O que foi feito (2–5 linhas).
2. Arquivos/branches criados.
3. O que precisa de ação minha.

**Não avance para a próxima fase sem concluir a atual. Não repita verificações já feitas.**

## 11. Checklist final (marcar apenas o que foi realmente concluído)
- [ ] Tailwind e tokens da Sprint 1 preservados
- [ ] Nenhum framework novo adicionado
- [ ] Fluxo principal real, sem botões mortos, com estados vazio/loading/erro/sucesso
- [ ] `/design-system` com todos os estados
- [ ] 3 breakpoints sem scroll lateral
- [ ] WCAG 2.1 AA aplicado e console limpo
- [ ] Todo trabalho via branches/PRs, sem commits diretos na main
- [ ] README, `integrantes.txt` e `PROMPTS.md` completos
- [ ] Kit de validação e modelos de entrega gerados