# Publicação do TF3-Sprint3 no GitHub

O projeto local já está inicializado em `main` e contém o workflow de GitHub Pages.

## 1. Criar o repositório

No GitHub, crie um repositório **público** chamado exatamente:

`TF3-Sprint3`

Não crie README, .gitignore ou licença pelo site, porque esses arquivos já estão no projeto local.

## 2. Conectar o projeto local

Dentro da pasta do projeto:

```bash
git remote add origin https://github.com/artei4/TF3-Sprint3.git
git push -u origin main
```

## 3. Ativar o deploy

Em **Settings → Pages → Source**, selecione **GitHub Actions**.

O workflow `.github/workflows/deploy.yml` executará `npm install`, `npm run build` e publicará `dist`.

Como o Vite está configurado com `base: './'` e a navegação usa hash routing, a aplicação pode ser publicada como projeto do GitHub Pages.

## 4. Fluxo de branches para a Sprint 3

Depois do push inicial, cada integrante deve trabalhar em uma branch própria e abrir um Pull Request para `main`.

Exemplo:

```bash
git checkout -b feat/cadastro-jogador
git add .
git commit -m "Adiciona cadastro de jogador"
git push -u origin feat/cadastro-jogador
```

As branches não devem ser apagadas após o merge, pois fazem parte da evidência da sprint.
