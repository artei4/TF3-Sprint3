# Roteiro de teste com usuários — Sprint 4

> Modelo. Aplicar com **≥ 5 participantes externos** à equipe, alinhados às personas. Observar **sem intervir**: não explique a interface, não aponte botões, não corrija o caminho. Se o participante travar por mais de 2 min, anote "travamento" e só então ofereça a próxima tarefa.

## Preparação
- Ambiente: link de produção, `[navegador/dispositivo]`, tela gravada com consentimento.
- Perfis de participante:
  - **Atleta/responsável:** 12–20 anos, ou responsável por um atleta de base.
  - **Funcionário:** treinador, olheiro ou pessoa da área esportiva.
- Contas: o atleta cria a própria conta (tarefa A1). O funcionário usa `treinador@academiapele.com`.
- Antes de cada sessão: criar 1 peneira compatível com o perfil que o atleta vai cadastrar.

## Fala de abertura (ler igual para todos)
"Estamos testando o site, não você. Não existe resposta errada. Pense em voz alta enquanto usa. Eu não vou poder ajudar durante as tarefas; ao final, conversamos."

## Cenário
"Você quer participar de uma peneira da Pelé Academia na sua posição."

## Tarefas — atleta
| # | Tarefa (ler ao participante) | Sucesso quando |
|---|---|---|
| A1 | Crie sua conta de jogador. | Chega ao painel logado |
| A2 | Encontre uma peneira para a sua posição e se inscreva. | Card mostra "Inscrição confirmada" |
| A3 | Desista dessa inscrição. | Vaga liberada e toast de confirmação |
| A4 | Mande uma mensagem para um treinador. | Mensagem aparece na conversa |

## Tarefas — funcionário
| # | Tarefa | Sucesso quando |
|---|---|---|
| F1 | Crie uma peneira Sub-17 para meio-campistas no dia `[data]`. | Peneira aparece na lista |
| F2 | Encontre os atacantes canhotos de São Paulo. | Filtros aplicados corretamente |
| F3 | Avalie um atleta inscrito na sua peneira. | Avaliação salva no perfil |
| F4 | Cancele a peneira avisando o motivo. | Peneira some da lista; o inscrito vê o motivo |

## Perguntas pós-teste
1. O que você achou que esse site faz, em uma frase?
2. Qual tarefa foi mais difícil? Por quê?
3. Teve algum momento em que você não sabia se a ação tinha funcionado?
4. Algo te pareceu falso, confuso ou desnecessário?
5. Você usaria isso para `[se inscrever em peneiras / encontrar atletas]`? O que faltaria?
6. Aplicar o questionário SUS (`sus.md`).
