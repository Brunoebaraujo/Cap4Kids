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

## Tempo — calendário real

**Um dia de jogo = um dia de calendário real.** A virada acontece na meia-noite
local, não 24h após a primeira sessão — assim "volte amanhã" significa
literalmente amanhã.

O dia **não corre durante a sessão**. A criança entra, vê o que aconteceu, decide,
e sai. Nada fica esperando timer.

| Unidade | Duração real |
|---------|--------------|
| Dia | 1 dia |
| Estação | 7 dias (uma semana) |
| Ano | 28 dias (~um mês) |
| Ciclo de lavoura | 4 dias |

### Proteção contra ausência

`MAX_CATCHUP_DAYS = 5`. Quem some por três semanas volta e só tem 5 dias
cobrados; o resto é perdoado e a lavoura pronta não estraga. Punir criança por
não abrir o app não ensina economia, ensina que o jogo é hostil.

## Tecnologia — investir em eficiência

Tecnologia aumenta **quanto você trabalha por dia**, nunca a velocidade da
planta. Trator não faz trigo crescer mais rápido. Dinheiro compra produtividade,
não biologia.

Cada tarefa custa pontos de trabalho: preparar 3, plantar 1, colher 3,
entregar 1 — ciclo completo de campo = 8.

| Nível | Capacidade/dia | Campos para não desperdiçar | Custo |
|-------|----------------|------------------------------|-------|
| Manual | 4 | 2 | — |
| Ferramentas simples | 6 | 3 | 140 |
| Ferramentas médias | 8 | 4 | 320 |
| Ferramentas sofisticadas | 12 | 6 | 700 |
| Mecanização | 18 | 9 | 1500 |

O painel mostra em quantos dias cada upgrade se paga. É a conta de retorno sobre
investimento num formato que a criança faz de cabeça.

## Terra e ferramenta são capitais complementares

Este foi o achado mais importante do desenho. Com 2 campos e lavoura de 4 dias, o
teto biológico é 2,5 trigo/dia — e ferramentas médias já saturam esse teto.
Investir em mecanização daria **retorno zero**, e a lição de investimento
nasceria quebrada.

A correção foi tornar a terra comprável, com a escada fechando exata: 9 campos
suportam exatamente a capacidade da mecanização. A criança precisa equilibrar os
dois e descobrir sozinha que trator sem terra é dinheiro parado. O painel avisa
quando a capacidade está sobrando.

Coberto por teste: `technology.test.ts` garante que cada nível exige mais campos
e que a fazenda tem campos suficientes para o topo.

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
