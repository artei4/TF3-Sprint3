# README — Front-End Design | Sprint 3

## Academia Pelé — TF3-Sprint3

A aplicação utiliza Tailwind CSS como camada principal de estilo e traduz o design system definido nas sprints anteriores para tokens de tema: cores institucionais, tipografia, espaçamento, raios e breakpoints.

### Funcionalidades entregues

- Login por jogador ou funcionário.
- Cadastro de jogador e validação de CPF.
- Atualização de dados e endereço.
- Posição principal e posição secundária.
- Banco de atletas com filtros.
- Criação de peneiras com popup de localidade.
- Limitação de posições por peneira.
- Avaliações, notas e comentários de olheiros.
- Conversas entre atletas e profissionais.
- Responsividade mobile/tablet/desktop.
- Identidade visual da Academia Pelé aplicada ao produto.

### Design system

Os tokens estão em `assets/js/styles.css`, dentro de `@theme` do Tailwind CSS. Classes utilitárias consomem esses tokens nos componentes.

### Componentização

Os componentes visuais são criados por funções reutilizáveis no JavaScript (`athleteCard`, `tryoutCard`, `messageBubble`, `input`, `review`, `shell` etc.), evitando duplicação estrutural extensa.

### Acessibilidade

O projeto mantém foco visível com `:focus-visible`, labels associados aos campos, landmarks semânticos e feedback visual para estados de sucesso/erro.

### GitHub / deploy / Figma

Preencher os links reais antes da entrega:

- GitHub: `[INSERIR LINK]`
- Deploy: `[INSERIR LINK]`
- Figma: `[INSERIR LINK]`

### Responsividade validada

- Mobile: `[largura/teste]`
- Tablet: `[largura/teste]`
- Desktop: `[largura/teste]`

### Contribuições

| Integrante | RM | Branch | PR | Entregas |
|---|---|---|---|---|
| `[Nome]` | `[RM]` | `[branch]` | `#[PR]` | `[entregas]` |
| `[Nome]` | `[RM]` | `[branch]` | `#[PR]` | `[entregas]` |
| `[Nome]` | `[RM]` | `[branch]` | `#[PR]` | `[entregas]` |
