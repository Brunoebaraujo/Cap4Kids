# Desenho econômico — Cap4Kids

Documento do que o jogo ensina e de como cada mecânica sustenta a lição.
Todos os números aqui são cobertos por teste em `src/game/systems/`.

## Princípio

Nunca explicar no vazio. Uma lição só aparece quando a criança **acabou de causar
o efeito com as próprias mãos** — é nesse instante que a explicação gruda.
`PedagogySystem` não dispara nada por tempo decorrido, apenas por evento.

## 1. Oferta e procura — `MarketSystem`

O preço não é uma constante de tabela. Ele responde ao que o jogador faz.

```
pressão  = estoque / saturação
multipl. = clamp(1 - 0,65 × pressão, 0,4 , 1,7)
preço    = max(1, round(base × multipl.))
```

**Precificação marginal.** Cada unidade vendida pressiona o preço da unidade
seguinte, dentro da mesma venda. Isso é essencial: se o preço só caísse para
vendas futuras, despejar tudo de uma vez sairia de graça no ato e a criança não
ligaria causa a efeito. Vender 24 de trigo de uma vez rende visivelmente menos
por unidade que vender 6.

O mercado absorve 28% do estoque por dia — recupera em cerca de uma semana.

| Produto | Base | Saturação | Absorção/dia |
|---------|------|-----------|--------------|
| Trigo   | 10   | 46        | 28%          |
| Leite   | 16   | 22        | 32%          |

Base 10 e não 3: com arredondamento inteiro, base 3 só produz preços de 1 a 5 e
vendas pequenas não moviam nada. A lição não chegava.

## 2. Inflação — `InflationSystem`

Índice começa em 100 e cresce **0,7% ao dia, de forma composta** (~23% em 30 dias).
Multiplica tanto o valor base das mercadorias quanto os custos (semente e despesa
da casa).

A lição: receita nominal sobe, poder de compra não acompanha. Ter mais moedas não
é ser mais rico.

## 3. Juros compostos — `EconomySystem`

Dívida inicial de 400, juros de **0,8% ao dia sobre o saldo devedor**.

Comprovado por simulação de 30 dias (`balance.check.test.ts`):

| Estratégia | Dívida final | Juros pagos |
|------------|--------------|-------------|
| Ignorar a dívida | 507 | 107 |
| Abater 40 quando sobra caixa | 0 (zerada no dia 20) | 15 |

Abater cedo economiza 92 moedas. É a lição de juros compostos em números que a
criança vê no painel.

## 4. Lucro e prejuízo

`todayRevenue` e `todayExpenses` fecham todo dia em `lastDay*`, alimentando o
painel de Indicadores. Vender não basta: se o custo de produzir supera a receita,
a fazenda perde dinheiro.

## Tempo e ritmo

**Toda a simulação é expressa em dias de jogo.** `GameClockSystem` é o único
lugar que sabe quantos segundos reais dura um dia (`REAL_SECONDS_PER_DAY = 60`).

Antes do refactor, o crescimento da lavoura (72s) e a duração do dia (180s) eram
constantes independentes em segundos reais. Encurtar o dia para melhorar o ritmo
fazia os custos diários baterem 3× mais vezes por colheita e destruía o
balanceamento. Agora a duração do dia é um botão de ritmo puro: `clock.test.ts`
prova que a lavoura leva o mesmo número de **dias** em qualquer velocidade.

Controle de velocidade: pausa, 1×, 2×, 3× (barra de espaço pausa). Multiplicar o
tempo não altera nenhuma proporção, então acelerar nunca muda o resultado
econômico de uma estratégia — só quanto o jogador vê por sessão.

| Sessão | Dias | Inflação sentida | Estações |
|--------|------|------------------|----------|
| 20 min a 1× | 20 | 15% | 2 |
| 20 min a 2× | 40 | 32% | 4 |
| 20 min a 3× | 60 | 52% | 6 |

Antes, 20 minutos rendiam ~7 dias e 5% de inflação — imperceptível. O conceito
mais difícil de ensinar simplesmente não chegava ao jogador.

## Estações como capítulos

Dez dias formam uma estação. Ao fechar, o jogo **pausa sozinho** e mostra o
balanço: receita, despesas, lucro, juros pagos, variação da dívida e quanto os
preços subiram. É o momento pedagógico mais forte do jogo, porque conecta as
decisões da estação inteira a um número só.

## Balanceamento

A partida **precisa ser vencível**. Uma primeira calibragem tinha a dívida
crescendo em todas as estratégias — isso ensina desamparo, não economia. Os
números atuais permitem quitar a dívida com jogo competente, e punem quem ignora
os juros ou despeja mercadoria em mercado saturado.

`balance.check.test.ts` roda três partidas simuladas de 30 dias a cada `npm test`,
então uma regressão de balanceamento quebra o build em vez de passar despercebida.

## Próximos conceitos

- **Custo de oportunidade** — exige 2+ culturas com retornos e ciclos diferentes
- **Investimento / CAPEX** — comprar trator: gasto hoje, produtividade amanhã
- **Risco** — clima e praga introduzem variância
