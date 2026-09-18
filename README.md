# Academia Pelé — TF3-Sprint3

Aplicação front-end da Sprint 3 do Challenge Academia Pelé.

## Stack

- Vite
- Tailwind CSS
- JavaScript Vanilla
- HTML semântico
- LocalStorage para persistência local da experiência demonstrativa

## Executar pelo navegador — sem npm

A aplicação também funciona como site estático. Para abrir no endereço `http://127.0.0.1:5500/index.html`, use a extensão **Live Server** do VS Code e abra `index.html` com **Open with Live Server**. Não é necessário executar nenhum comando no terminal.

> O modo Live Server carrega o Tailwind pelo CDN e mantém toda a interatividade em JavaScript Vanilla.
> O código usa **ES Modules** (`<script type="module">`), portanto é preciso abrir por um servidor (Live Server, `npm run dev`, GitHub Pages). Abrir o `index.html` com duplo clique (`file://`) não funciona.

## Contas de teste

| Tipo | E-mail | Senha |
|---|---|---|
| Funcionário (olheira) | `funcionario@academiapele.com` | `Academia123!` |
| Funcionário (treinador) | `treinador@academiapele.com` | `Academia123!` |
| Jogador | `gabriel@academiapele.com` | `Demo123!` |

Novos jogadores criados em "Criar conta de jogador" entram automaticamente no banco de atletas.
Para zerar os dados de teste, limpe o `localStorage` do navegador (F12 → Application → Local Storage → Clear).

## Executar com Vite (opcional)

```bash
npm install
npm run dev
```

Para gerar produção:

```bash
npm run build
npm run preview
```

## Funcionalidades

- Login como jogador ou funcionário.
- Cadastro de jogador com validação de CPF e senha.
- Perfil com atualização de endereço, posição principal e posição secundária.
- Banco de atletas com filtros por nome, posição, região e idade sem reload.
- Favoritos e votos com feedback visual.
- Criação/agendamento de peneiras.
- Popup de confirmação de localidade.
- Limitação de posições nas peneiras.
- Inscrição em peneiras com validação de posição.
- Comentários e notas de olheiros.
- Conversas bidirecionais entre atleta e profissional.
- Layout responsivo para mobile, tablet e desktop.
- Foco visível e navegação acessível.

## Identidade visual

A logo fornecida da **Academia Pelé** está em `assets/brand/simbolo.jpg` e é utilizada no cabeçalho e nas telas de acesso.

## Documentação acadêmica

- `README_FRONTEND.md` — entrega de Front-End Design.
- `README_WD.md` — entrega de Web Development.
- `integrantes.txt` — nomes e RMs.
- `PROMPTS.md` — registro de prompts de IA utilizados.

## GitHub e deploy

Preencher os links reais do repositório público, Figma e deploy antes da submissão.

- Repositório: `[INSERIR LINK]`
- Deploy: `[INSERIR LINK]`
- Figma: `[INSERIR LINK]`
