# Cap4Kids — Capitalism 4 Kids

Jogo de fazenda isométrico que ensina conceitos econômicos para crianças.
Vite + React + TypeScript + Phaser 3, publicado no GitHub Pages.

React é dono do HUD e do painel de comando. Phaser é dono do mundo isométrico.
A simulação (economia, campos, relógio, tarefas) não depende de nenhum dos dois.

## Live

https://brunoebaraujo.github.io/Cap4Kids/

## Rodar

```bash
npm install
npm run dev
```

## Comandos

```bash
npm run test        # vitest (projeção isométrica)
npm run build       # tsc + vite build
npm run gen:assets  # regenera os placeholders isométricos
```

## Controles

- **Clique esquerdo** — seleciona um tile
- **Botão direito ou do meio, arrastando** — move a câmera
- **Roda do mouse** — zoom
- **1** Preparar solo · **2** Plantar trigo · **3** Colher trigo · **4** Entregar no silo
- **B** Comprar semente · **V** Vender trigo · **C** Alterna câmera
- **Espaço** Pausa / retoma

## Estado atual

Ondas 1 e 2 concluídas.

**Onda 2 — economia que ensina**

- Mercado com preço endógeno e precificação marginal (`MarketSystem`)
- Inflação composta afetando preços e custos (`InflationSystem`)
- Juros compostos sobre a dívida, com ação de abatimento
- Camada pedagógica: lições disparadas por evento, nunca por tempo (`PedagogySystem`)
- Painéis de Indicadores e Mercado com tendência e minigráfico
- Diário de aprendizado
- 38 testes, incluindo 5 partidas simuladas de balanceamento

**Onda 3a — ritmo**

- Toda a simulação em dias de jogo, com uma única autoridade de tempo
- Controle de velocidade (pausa, 1×, 2×, 3×) sem afetar balanceamento
- Estações de 10 dias como capítulos, com balanço ao fechar
- 46 testes

**Onda 1 — fundação isométrica**

- Renderer isométrico dimetrico 2:1, com projeção própria coberta por testes
- Picking por mouse, hover e seleção de tile
- Painel de comando estilo Age of Empires em CSS, com minimapa funcional
- Barramento de comandos tipado entre React e Phaser
- Manifesto de assets como contrato único para a troca de arte
- Placeholders isométricos procedurais e regeneráveis

## Próximas ondas

3. Segunda cultura (habilita custo de oportunidade) e sistema de gado
4. Investimento em equipamento (CAPEX) e risco (clima, praga)
5. Troca dos placeholders pelo pack comprado (ver `docs/art-direction.md`)

## Documentação

- `docs/technical-architecture.md`
- `docs/economy-design.md`
- `docs/art-direction.md`
