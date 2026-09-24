# README — Web Development | Sprint 3

## Pelé Academia — TF3-Sprint3

A Sprint 3 de Web Development foi construída com JavaScript Vanilla, manipulação direta do DOM e eventos do navegador.

## Manual de Interatividade

### `assets/js/main.js`

- `applyFilters()` — atualiza a listagem de atletas sem reload.
- `validCPF()` / `maskCPF()` — validação e máscara de CPF.
- Eventos `click`, `input`, `change` e `submit` — controlam as interações.
- Favoritos — alternância de estado e persistência.
- Votos — contador dinâmico e feedback.
- Perfil — atualização de dados, endereço e posições.
- Peneiras — criação, inscrições, vagas e posições permitidas.
- Localidade — modal de confirmação de endereço.
- Conversas — busca de pessoas, envio e renderização de mensagens.
- Toasts — feedbacks de sucesso e erro.

### Fluxos

**Atleta**: login → perfil → atualizar dados/endereço → peneiras → inscrição → conversa → avaliação.

**Funcionário**: login → banco de atletas → filtros → abrir perfil → avaliação/comentário → criar peneira → conversar.

## Banco de dados demonstrativo

Nesta versão de front-end, o estado do produto é persistido em `localStorage` para permitir a demonstração dos fluxos sem depender de um backend externo. A camada está organizada para ser substituída por API/banco de produção no MVP seguinte.

## Acessibilidade

- Foco visível.
- Labels nos formulários.
- Feedback de validação.
- Navegação por teclado nos controles.
- Alt text para a logo.

## Execução

```bash
npm install
npm run dev
```

## Links e contribuições

Preencher antes da entrega:

- GitHub: `[INSERIR LINK]`
- Deploy: `(https://tf-3-sprint3.vercel.app)`
- Figma: `[INSERIR LINK]`

| Integrante | RM | Branch | PR | Funcionalidades |
|---|---|---|---|---|
| `[Arthur Bergami]` | `[570679]` | `[Main]` | `#[PR]` | `[login dos usarios]` |
| `[Davi Martins]` | `[572699]` | `[branch]` | `#[PR]` | `[funcionalidades]` |
| `[Felipe Braga]` | `[573529]` | `[branch]` | `#[PR]` | `[funcionalidades]` |
| `[Marcos Vinícios]` | `[571080]` | `[branch]` | `#[PR]` | `[funcionalidades]` |
| `[Victor Lopes]` | `[571315]` | `[branch]` | `#[PR]` | `[funcionalidades]` |
