# Supabase — como funciona e como ativar

## O que o Supabase resolve
Hoje (sem Supabase) cada conta e cada conversa fica guardada só no navegador de quem usa o
site (`localStorage`). Por isso um funcionário no computador e um jogador no celular nunca
veem a mesma conversa: são dois "bancos de dados" diferentes, um em cada aparelho.

O Supabase é um banco de dados na nuvem gratuito. Quando ele está ativo, contas, perfis e
conversas passam a morar lá, e qualquer aparelho que entrar no site enxerga os mesmos dados,
em tempo real.

## As 3 peças que você me mandou
- **URL do projeto** (`https://delhjdfecknikusehrga.supabase.co`) e a **publishable key**
  (`sb_publishable_...`): já estão coladas em `assets/js/config.js`. Essas duas são seguras
  de deixar no código do site — sozinhas elas não abrem o banco, quem protege é a regra de
  segurança (RLS) que a migração cria.
- **A connection string com senha** (`postgresql://postgres:[SUA-SENHA]@...`) e o comando
  `supabase login` / `supabase init` / `supabase link`: são para você rodar no **seu**
  computador, fora deste projeto — eu não tenho acesso à internet neste ambiente para rodar
  isso por você, e nunca devo saber a senha do seu banco. A boa notícia é que **você não
  precisa da CLI para nada disto funcionar** — o passo a passo abaixo usa só o navegador.

## Passo a passo (5 minutos, sem terminal)
1. Entre em [supabase.com](https://supabase.com), abra o projeto `delhjdfecknikusehrga`.
2. No menu à esquerda, clique em **SQL Editor** → **New query**.
3. Abra o arquivo `supabase/migrations/20260921120000_contas_e_conversas.sql` (está na pasta
   do projeto que te mandei), copie o conteúdo inteiro e cole no editor.
4. Clique em **Run**. Ele cria as tabelas de contas, perfis e conversas, já com as regras de
   segurança e o tempo real ligados. Pode rodar de novo no futuro sem quebrar nada.
5. No menu **Authentication → Providers**, confirme que **Email** está habilitado (vem assim
   por padrão). Em **Authentication → Settings**, eu recomendo desligar "Confirm email"
   enquanto vocês estão testando — assim a conta já entra na hora, sem precisar confirmar
   e-mail. Antes de ir para produção de verdade, vale ligar de novo.
6. Pronto. Abra o site normalmente (sem nada extra na URL) — ele detecta o Supabase sozinho.

## Como o site decide "local" ou "online"
- Ao abrir, o site tenta se conectar ao Supabase. Se conseguir, tudo (contas, perfis,
  conversas) passa a vir do banco na nuvem, e sincroniza entre aparelhos.
- Se não conseguir (sem internet, banco fora do ar, ou você não configurou nada ainda), o
  site cai sozinho para o modo local de antes, sem travar — só que aí volta a ficar só no
  navegador de cada um.
- Para forçar o modo local mesmo com o Supabase configurado (por exemplo, para testar), abra
  o site com `?local=1` no fim do endereço.

## O que muda pro jogador e pro funcionário
- **Cadastro/login** passam a ser de verdade (senha com Supabase Auth), então **as senhas de
  teste antigas não existem mais no banco** — quem quiser usar as contas demo precisa
  primeiro criar uma conta com aquele e-mail (ou eu posso pré-cadastrar para você).
- **Quem vira funcionário** é decidido pela tabela `staff_allowlist` (dentro da migração), não
  mais por e-mail digitado no cadastro. Hoje ela tem `funcionario@academiapele.com` e
  `treinador@academiapele.com`. Para adicionar outro e-mail de funcionário, rode no SQL
  Editor:
  ```sql
  insert into public.staff_allowlist (email) values ('novo.funcionario@academiapele.com');
  ```
  (precisa ser feito **antes** da pessoa criar a conta).
- **CPF, telefone e endereço** ficam numa tabela separada que só o próprio dono enxerga
  (`profile_private`); posição, cidade, perna dominante etc. ficam visíveis para a equipe.

## Se algo der errado
- Erro "O banco ainda não foi configurado": o SQL da migração ainda não foi rodado (passo 3-4).
- Erro de e-mail "já cadastrado" com CPF diferente: o CPF já está em uso por outra conta.
- Qualquer erro de conexão: o site avisa e continua funcionando no modo local automaticamente.
