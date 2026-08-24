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
- **B** Comprar semente · **C** Alterna câmera livre / seguir

## Estado atual

Onda 1 concluída:

- Renderer isométrico dimetrico 2:1, com projeção própria coberta por testes
- Picking por mouse, hover e seleção de tile
- Painel de comando estilo Age of Empires em CSS, com minimapa funcional
- Barramento de comandos tipado entre React e Phaser
- Manifesto de assets como contrato único para a troca de arte
- Placeholders isométricos procedurais e regeneráveis

## Próximas ondas

2. Mercado com preço endógeno, inflação e juros sobre a dívida
3. Sistema de gado
4. Camada pedagógica (explicar *por que* o preço mudou)
5. Troca dos placeholders pelo pack comprado (ver `docs/art-direction.md`)

## Documentação

- `docs/technical-architecture.md`
- `docs/art-direction.md`
