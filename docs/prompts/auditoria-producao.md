# Projeto Academia Pelé — Auditoria, melhorias, segurança e preparação para produção

Quero que você analise e melhore o projeto **Academia Pelé** diretamente nos arquivos do repositório em que está trabalhando. Antes de alterar qualquer coisa, examine a estrutura, os arquivos, as funcionalidades existentes e as tecnologias utilizadas.

O objetivo é transformar o projeto em uma aplicação organizada, funcional, segura e pronta para ser publicada na Vercel, preservando ao máximo o visual, a identidade e as funcionalidades que já existem.

## 1. Regras fundamentais

- Analise o código existente antes de começar a implementar.
- Preserve o design, as cores, a identidade visual, o layout e a experiência atual.
- Não refaça o site do zero nem substitua funcionalidades existentes sem necessidade.
- Modifique somente o que for necessário para corrigir problemas, implementar os requisitos e melhorar a qualidade do projeto.
- Reaproveite componentes, funções e estruturas que já funcionam.
- Não remova funcionalidades válidas apenas para simplificar o código.
- Não invente dados, resultados, avaliações ou informações de jogadores.
- Não considere uma funcionalidade concluída apenas porque sua interface está pronta: verifique se ela realmente funciona.
- Não faça alterações destrutivas no banco de dados nem apague dados reais sem autorização explícita.
- Trabalhe na minha cópia ou fork do repositório, sem modificar o repositório original.
- Se encontrar uma limitação técnica, explique o problema e implemente a melhor solução compatível com a arquitetura existente.

## 2. Auditoria completa do projeto

Antes das alterações, identifique:

- A estrutura de pastas e arquivos.
- As tecnologias, dependências e ferramentas utilizadas.
- As páginas, os componentes e as funcionalidades existentes.
- Como funciona a autenticação e quais são os tipos de usuários.
- Como os jogadores, as peneiras, as avaliações, os locais e os funcionários são armazenados.
- Se os dados são persistidos em banco de dados, armazenamento local ou outra solução.
- Quais funcionalidades são apenas demonstrativas e quais realmente funcionam.
- Problemas de segurança, acessibilidade, responsividade, desempenho e organização.
- Erros de lógica, duplicação de código e possíveis falhas de validação.

Depois, implemente as melhorias necessárias sem comprometer as partes que já funcionam.

## 3. Cadastro de jogadores

Verifique e melhore o cadastro dos jogadores, mantendo os campos e recursos existentes que forem úteis.

O sistema deve:

- Validar os campos obrigatórios.
- Validar os formatos dos dados informados.
- Validar o CPF com base nos dígitos verificadores, rejeitando números inválidos e sequências repetidas.
- Validar o RG conforme as regras aplicáveis, sem assumir que todos os estados utilizam o mesmo formato.
- Evitar cadastros duplicados, especialmente por CPF, quando esse dado fizer parte do cadastro.
- Validar datas e impedir valores incoerentes.
- Tratar erros de preenchimento com mensagens claras.
- Validar arquivos enviados, incluindo formato, tamanho e tipo permitido.
- Armazenar as informações de forma persistente e segura.
- Impedir que usuários não autorizados acessem ou alterem dados restritos.

Caso o cadastro envolva menores de idade, implementar os requisitos necessários para consentimento e participação do responsável legal, quando aplicável.

## 4. Perfil e histórico dos jogadores

Preserve e aprimore as funcionalidades existentes de perfil dos jogadores.

Quando aplicável, permitir:

- Visualizar os dados do jogador.
- Consultar seu histórico de participação em peneiras.
- Consultar avaliações autorizadas.
- Exibir fotos e informações esportivas pertinentes.
- Atualizar os dados permitidos de acordo com as permissões do usuário.

Não disponibilize publicamente informações pessoais sensíveis. Separe os dados públicos dos dados restritos e aplique as permissões adequadas.

## 5. Peneiras e cronômetros independentes

Cada peneira deve ter seu próprio cronômetro ou contagem regressiva, independente das demais.

Implementar:

- Data e horário próprios para cada peneira.
- Contagem regressiva individual, quando houver uma data futura definida.
- Atualização automática do tempo restante na interface.
- Indicação clara quando a peneira estiver próxima, em andamento ou encerrada, conforme suas datas e regras.
- Tratamento de datas ausentes ou inválidas.
- Uso consistente de fuso horário para evitar diferenças inesperadas entre usuários.
- Persistência das datas no banco de dados.

**A contagem de uma peneira não pode alterar nem depender do cronômetro de outra.** Cada cronômetro deve ser calculado a partir dos dados específicos daquela peneira, e não de um contador global compartilhado.

A contagem regressiva é apenas informativa: o servidor deve continuar sendo responsável por verificar se uma inscrição, um check-in ou outra operação ainda é permitida.

## 6. Cadastro e gerenciamento de locais de peneira

Permitir que **funcionários autorizados cadastrem novos locais de peneira diretamente pelo próprio painel**, sem precisar alterar o código ou solicitar a intervenção de um desenvolvedor.

O painel deve permitir, conforme as permissões:

- Cadastrar um local.
- Informar nome do local, endereço completo, cidade, estado e informações complementares.
- Informar dados adicionais relevantes, como referências de localização.
- Editar locais já cadastrados.
- Desativar locais que não estejam mais disponíveis.
- Consultar os locais existentes.
- Associar um local a uma peneira.
- Manter os dados salvos de forma persistente no banco de dados.

Requisitos adicionais:

- Validar os campos obrigatórios.
- Evitar locais duplicados quando possível.
- Pedir confirmação antes de ações que possam afetar registros existentes.
- Não excluir automaticamente peneiras ou históricos associados quando um local for desativado.
- Registrar alterações importantes.
- Impedir que funcionários sem permissão gerenciem locais.

Integrar a funcionalidade à interface atual, seguindo o mesmo padrão visual do restante do sistema.

## 7. Check-in, QR Code e controle de presença

Se essas funcionalidades já existirem ou fizerem parte do fluxo atual do projeto, verificar e implementar corretamente:

- Geração e leitura de QR Code para check-in.
- Identificação do jogador e da peneira correspondente.
- Prevenção de check-ins duplicados.
- Busca manual de jogadores caso o QR Code não funcione.
- Registro correto de presença e ausência.
- Operações em lote, quando necessárias e autorizadas.
- Mensagens claras de sucesso e erro.

Os códigos não devem expor informações pessoais desnecessárias. Caso utilizem tokens, estes devem ser imprevisíveis, validados no servidor e não devem permitir acesso irrestrito aos dados do jogador.

## 8. Cadastro restrito de funcionários

O cadastro de funcionários deve ser controlado e seguro.

- Não permitir que qualquer visitante crie uma conta de funcionário livremente.
- Não permitir que o próprio usuário escolha ou atribua a si mesmo um cargo privilegiado.
- Implementar cadastro por convite, criação por administrador ou outro mecanismo seguro compatível com a arquitetura.
- Definir permissões específicas para funcionários, administradores e demais tipos de usuários.
- Permitir que apenas administradores autorizados criem, aprovem, desativem ou alterem contas privilegiadas.
- Verificar as permissões no servidor, não apenas escondendo botões na interface.
- Proteger as rotas e operações restritas.
- Evitar que um funcionário comum consiga promover a própria conta ou a de outra pessoa.
- Registrar ações administrativas importantes.
- Tratar sessões, autenticação e encerramento de sessão adequadamente.

Se já existir um sistema de funcionários, aproveite sua estrutura e corrija as falhas em vez de criar outro sistema paralelo.

## 9. Avaliações dos jogadores — remover votos e curtidas

Verifique todo o projeto e **remova completamente qualquer sistema de votação, curtidas ou likes nos jogadores**, caso exista.

Não deve haver:

- Botões para votar ou curtir jogadores.
- Contadores de votos, curtidas ou likes.
- Rankings baseados em popularidade.
- Classificação de jogadores baseada no número de curtidas.
- Funções ou rotas exclusivas para registrar votos ou curtidas.
- Referências visuais a essas funcionalidades.
- Consultas ou estruturas de dados que existam exclusivamente para esse sistema, quando for seguro removê-las.

**O sistema deve manter somente as avaliações dos jogadores**, de acordo com os critérios e o fluxo legítimo de avaliação da Academia Pelé.

As avaliações devem:

- Ser registradas por usuários autorizados.
- Respeitar as permissões de cada perfil.
- Ter validação no servidor.
- Ser persistidas corretamente.
- Ser exibidas apenas para quem tiver autorização para consultá-las.
- Não ser confundidas com votos, likes ou manifestações de popularidade.

Não invente critérios de avaliação sem antes verificar o funcionamento atual. Preserve os critérios existentes que forem válidos.

Ao remover votos e curtidas, não apague avaliações legítimas nem dados compartilhados com outras funcionalidades. Faça alterações no banco de dados com cuidado, somente depois de identificar as dependências.

## 10. Chat e comunicação

Caso o projeto possua chat ou mensagens entre usuários, audite e aprimore a funcionalidade sem comprometer o fluxo atual.

- Validar mensagens e limitar entradas abusivas.
- Impedir a execução de conteúdo malicioso.
- Tratar corretamente conteúdo enviado por usuários.
- Aplicar permissões para leitura e envio de mensagens.
- Evitar exposição de dados pessoais.
- Implementar tratamento de erros e estados vazios.
- Considerar mecanismos de denúncia ou moderação, se compatíveis com o projeto.
- Proteger o sistema contra spam e abuso.

Não criar um chat novo se já existir um que possa ser corrigido e aprimorado.

## 11. Banco de dados e persistência

Analise a solução atual de armazenamento e determine se ela é adequada para uma aplicação publicada na Vercel.

- Não depender de armazenamento local do navegador como única fonte de dados compartilhados entre usuários.
- Garantir que informações importantes sejam persistidas de forma confiável.
- Evitar que dados sejam perdidos quando a aplicação for republicada.
- Implementar validações e regras de integridade.
- Evitar registros duplicados e inconsistências.
- Aplicar controle de acesso no banco de dados e no servidor.
- Proteger dados pessoais.
- Não deixar credenciais ou segredos expostos no código.
- Não substituir o banco atual sem necessidade técnica justificada.

Se o projeto utilizar Supabase ou outro serviço semelhante, verificar as políticas de acesso, permissões, autenticação e regras de segurança existentes. Corrigir políticas excessivamente permissivas e garantir que usuários não consigam acessar registros de terceiros sem autorização.

## 12. Privacidade e proteção de dados

Adequar o tratamento dos dados pessoais aos requisitos aplicáveis da LGPD.

- Coletar apenas dados necessários.
- Informar a finalidade do tratamento de maneira clara.
- Tratar adequadamente consentimento e dados de menores, quando aplicável.
- Restringir o acesso a informações sensíveis.
- Evitar expor CPF, RG, contatos e dados privados em páginas públicas, URLs ou logs.
- Proteger uploads e arquivos.
- Não registrar senhas, tokens ou informações sensíveis em logs.
- Prever mecanismos adequados para correção de dados e atendimento aos direitos dos titulares.
- Não afirmar que o sistema está juridicamente em conformidade sem uma avaliação apropriada.

## 13. Preparação profissional para a Vercel

Prepare o projeto para publicação na Vercel, respeitando sua estrutura e tecnologia atuais.

Verificar e corrigir:

- Scripts de instalação, desenvolvimento e build.
- Comando de build e diretório de saída.
- Configurações de roteamento, quando necessárias.
- Variáveis de ambiente.
- Integrações com banco de dados e serviços externos.
- Compatibilidade com o ambiente de execução da Vercel.
- Configurações de produção e desenvolvimento.
- Tratamento de erros.
- Dependências desnecessárias ou vulneráveis.
- Arquivos temporários e dados de teste.
- Configurações de segurança e exposição de informações.

Requisitos de segurança:

- Não inserir senhas, chaves privadas ou tokens diretamente no código.
- Criar ou atualizar `.gitignore` para excluir arquivos sensíveis, dependências e artefatos que não devam ser versionados.
- Disponibilizar um `.env.example` apenas com os nomes das variáveis necessárias e valores fictícios ou vazios, sem segredos reais.
- Garantir que variáveis privadas não sejam enviadas ao navegador.
- Usar HTTPS e as configurações de segurança adequadas ao ambiente.
- Não presumir que arquivos locais serão persistentes no ambiente de produção.
- Não colocar credenciais reais em commits ou no repositório.
- Não executar migrações destrutivas nem apagar dados de produção automaticamente.

Se houver dependências de serviços externos, documente as configurações necessárias para que o deploy funcione.

## 14. Qualidade e organização do código

Melhore a qualidade do código sem reescrever desnecessariamente o projeto.

- Remover código morto e duplicações comprovadas.
- Corrigir funções com responsabilidades confusas.
- Organizar componentes e módulos quando isso trouxer benefício real.
- Utilizar nomes claros e consistentes.
- Tratar erros adequadamente.
- Evitar funções gigantes e lógica repetida.
- Centralizar validações que precisem ser reutilizadas.
- Evitar dependências adicionais sem justificativa.
- Manter o código compatível com as tecnologias existentes.
- Não alterar arquivos apenas por preferência estética se não houver benefício prático.

Se houver testes automatizados, aproveitá-los e ampliá-los. Caso não existam, criar testes proporcionais à arquitetura e à complexidade das funcionalidades críticas.

## 15. Interface, responsividade e acessibilidade

Preservar a aparência original do Academia Pelé.

- Manter cores, tipografia, identidade visual, espaçamentos e componentes sempre que possível.
- Garantir que as novas funcionalidades sigam o padrão visual existente.
- Não fazer redesign completo sem necessidade.
- Corrigir problemas de layout em celulares, tablets e computadores.
- Garantir que formulários sejam compreensíveis e apresentem erros claramente.
- Verificar navegação por teclado, foco visível, rótulos de campos e contraste.
- Evitar componentes que causem confusão entre ações semelhantes.
- Exibir estados de carregamento, sucesso, erro e ausência de dados.
- Não deixar botões sem ação nem criar interfaces que simulem funcionalidades inexistentes.

## 16. Testes obrigatórios

Depois de implementar as melhorias, testar os principais fluxos.

### Cadastro e autenticação
- Cadastro de jogador válido.
- CPF inválido e CPF com dígitos verificadores incorretos.
- Campos obrigatórios ausentes.
- Tentativa de cadastro duplicado.
- Tentativa de acesso a uma área restrita sem autorização.
- Tentativa de criar uma conta privilegiada sem convite ou autorização.

### Funcionários e locais
- Cadastro de local por funcionário autorizado.
- Tentativa de cadastrar ou editar local por usuário sem permissão.
- Edição e desativação de locais.
- Persistência dos dados após recarregar a aplicação.
- Associação correta de locais às peneiras.

### Peneiras e cronômetros
- Duas ou mais peneiras com datas diferentes.
- Verificação de que cada contagem regressiva é independente.
- Datas inválidas ou ausentes.
- Peneiras encerradas e futuras.
- Persistência dos dados e consistência dos horários.

### Avaliações e presença
- Registro de avaliação por usuário autorizado.
- Bloqueio de avaliações por usuários sem permissão.
- Garantia de que avaliações não sejam tratadas como curtidas ou votos.
- Ausência de botões, contadores e rankings de curtidas.
- Check-in autorizado e prevenção de duplicidade, caso exista essa funcionalidade.

### Produção
- Build de produção.
- Verificação de erros no console.
- Verificação de rotas e variáveis de ambiente.
- Verificação de permissões no servidor e no banco de dados.
- Teste de persistência e acesso entre diferentes usuários.
- Verificação de que não há credenciais ou dados sensíveis expostos.

Não afirme que os testes passaram se não tiver executado os testes correspondentes.

## 17. Entrega final

Ao terminar, apresente um relatório objetivo contendo:

1. Problemas encontrados na auditoria.
2. Arquivos alterados e motivo das mudanças.
3. Funcionalidades implementadas, corrigidas ou removidas.
4. Como funciona o cadastro restrito de funcionários.
5. Como funcionários autorizados cadastram e gerenciam locais de peneira.
6. Como funciona o cronômetro independente de cada peneira.
7. Como as avaliações foram preservadas e os votos/curtidas removidos.
8. Melhorias de segurança e privacidade.
9. Testes executados e seus resultados reais.
10. Pendências que ainda dependam de configuração externa, credenciais ou decisões minhas.
11. Instruções para configurar as variáveis de ambiente e publicar na Vercel.
12. Confirmação de que o design original foi preservado, indicando eventuais mudanças visuais necessárias.

**Ordem de prioridade:** segurança e integridade dos dados; funcionamento real das funcionalidades; cadastro e permissões; locais de peneira e cronômetros independentes; manutenção exclusiva das avaliações; qualidade do código; preparação para produção; ajustes visuais pontuais.

Faça as alterações diretamente nos arquivos do projeto, respeitando essas regras. Não se limite a explicar como eu poderia fazer: implemente o que for possível no repositório disponível, teste o resultado e informe com transparência o que foi ou não concluído.