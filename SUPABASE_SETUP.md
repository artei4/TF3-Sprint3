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
   por padrão). Em **Authentication → Sign In / Providers → Email**, deixe **"Confirm email" ligado**.
   Motivo: as duas contas de teste viram funcionário pelo e-mail (tabela `staff_allowlist`). Sem a
   confirmação, qualquer pessoa poderia criar a conta com um desses e-mails antes do dono e
   entrar como funcionário. (Convites não têm esse problema: o link só vale para o e-mail convidado.)
6. Rode também, na ordem, `20261016120000_peneiras.sql`, `20261019120000_seguranca.sql`,
   `20261020120000_locais.sql`, `20261021120000_equipe.sql`,
   `20261022120000_descricao_peneira.sql` e `20261023120000_responsavel.sql`. A de segurança trava a última vaga das peneiras e limita o envio
   de mensagens a 8 por minuto. A de locais cria o cadastro de locais (aba **Peneiras → Locais**),
   fecha as inscrições no horário de início e guarda quem criou/alterou locais e peneiras na
   tabela `audit_log` (consulta pelo Table Editor). A de equipe cria os convites de funcionário e o
   papel de administrador (veja abaixo); a de descrição adiciona o texto "Sobre a peneira"; a de responsável exige a autorização de um
   responsável legal para atletas com menos de 18 anos (veja abaixo). Nenhuma delas apaga dados. Se rodar de novo
   uma migration antiga, rode as mais novas depois dela.
7. Pronto. Abra o site normalmente (sem nada extra na URL) — ele detecta o Supabase sozinho.

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
- **Quem vira funcionário** é decidido no servidor, nunca pelo navegador. Funcionário novo entra
  **por convite**: um administrador abre **Meu perfil → Gerenciar equipe → Convidar funcionário**,
  informa o e-mail e recebe um link (vale 7 dias, só para aquele e-mail, uma vez). O banco guarda
  só o hash do código. A pessoa abre o link, cria a senha e já entra como funcionário.
- **Administrador**: a migration de equipe torna `funcionario@academiapele.com` administrador.
  Administradores convidam, cancelam convites, desativam/reativam funcionários e dão ou tiram o
  acesso de administrador (ninguém altera a própria conta, então sempre sobra um administrador).
  Funcionário desativado perde todas as permissões no banco e não consegue mais entrar.
  Tudo fica em `audit_log` e aparece no **Histórico** da tela de equipe. Para promover outra
  pessoa direto pelo SQL Editor:
  ```sql
  update public.profiles set is_admin = true where lower(email) = 'nome@dominio.com' and role = 'staff';
  ```
- A tabela `staff_allowlist` continua só para as duas contas de teste (`funcionario@` e
  `treinador@academiapele.com`); não precisa adicionar e-mails nela.
- **Menores de 18 anos**: a conta só é criada com o responsável legal e a autorização marcada no
  cadastro (tabela `guardians`, com data e versão do texto). Sem autorização (ou se ela for
  revogada no perfil), o banco recusa a inscrição em peneiras. A equipe vê o contato do
  responsável. É uma declaração: o banco não confere documentos. A data de nascimento não muda
  mais pelo site depois do cadastro; para corrigir, pelo SQL Editor:
  ```sql
  update public.profiles set data = data || '{"birth":"2010-05-20"}' where lower(email) = 'atleta@dominio.com';
  ```
- **CPF, telefone e endereço** ficam numa tabela separada que só o próprio dono enxerga
  (`profile_private`); posição, cidade, perna dominante etc. ficam visíveis para a equipe.

## Se algo der errado
- Erro "O banco ainda não foi configurado": o SQL da migração ainda não foi rodado (passo 3-4).
- Erro de e-mail "já cadastrado" com CPF diferente: o CPF já está em uso por outra conta.
- Qualquer erro de conexão: o site avisa e continua funcionando no modo local automaticamente.
