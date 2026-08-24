# Arquitetura técnica — Cap4Kids

## Princípio central: simulação separada do render

A simulação **nunca vê pixels**. Ela trabalha em coordenadas de tile e em números.
Somente o render e o picking passam pela projeção isométrica.

```
React (HUD)  ──sendCommand()──▶  commandBus  ──▶  IsoFarmScene
     ▲                                                 │
     └──────────onState() / onNotice()◀────────────────┘
                                                       │
                                          consome (sem conhecer Phaser)
                                                       ▼
                          EconomySystem · FieldSystem · GameClockSystem · TaskSystem
```

Consequência prática: trocar o renderer (ortogonal → isométrico, como foi feito
na onda 1) não toca em uma linha da simulação. O inverso também vale — dá para
testar toda a economia em Node, sem browser.

## Camadas

| Caminho | Responsabilidade | Depende de Phaser? |
|---------|------------------|--------------------|
| `src/game/systems/` | Regras: economia, campos, relógio, fila de tarefas | Não |
| `src/game/iso/` | Projeção isométrica, âncoras, profundidade | Não |
| `src/game/assets/` | Contrato de assets (manifesto) | Não |
| `src/game/commandBus.ts` | Ponte React ↔ cena | Só o EventEmitter |
| `src/game/scenes/` | Render, câmera, input, picking | Sim |
| `src/App.tsx` | HUD, painel de comando, minimapa | Não |

Tudo que não depende de Phaser é testável com `vitest` sem DOM.

## Projeção isométrica

Implementada em `src/game/iso/projection.ts` e coberta por 10 testes.

```
tileToWorld(tx, ty) = ( (tx - ty) * 64 , (tx + ty) * 32 )
```

Devolve o **centro** do losango. A inversa é exata (verificado para 48×48 tiles).

Nota: as helpers nativas do Phaser (`IsometricTileToWorldXY` /
`IsometricWorldToTileXY`) usam convenções assimétricas — a ida devolve um vértice
de referência, a volta subtrai meio tile antes de inverter. Roundtrip de (0,0) não
retorna (0,0). Por isso o projeto tem a sua própria projeção: 20 linhas, simétrica
e testável sem browser.

## Ancoragem e profundidade

- Sprites: `setOrigin(0.5, 1)`, posicionados no **vértice inferior** do losango de base.
- `spriteAnchor(tx, ty, footprint)` calcula esse ponto para qualquer footprint.
- Profundidade: `depthFor(anchorY)` — painter's algorithm pela Y da âncora.
  Usar `tx + ty` quebra quando há footprints diferentes na mesma cena.
- Chão: depth fixo `-100000`. Os losangos casam exatamente, sem sobreposição.

## Barramento de comandos

O HUD nunca chama métodos da cena e nunca sintetiza eventos de teclado. Ele emite
comandos tipados:

```ts
sendCommand({ type: 'queueTask', task: 'Plant Wheat' });
```

A cena registra um único handler (`handleCommand`). Atalhos de teclado chamam os
mesmos métodos internos, então existe um caminho de código só — teclado e botão
não podem divergir.

## Assets

`src/game/assets/isoManifest.ts` é a única ponte entre arte e código. Nenhuma cena
referencia caminho de arquivo. Trocar os placeholders pelo pack pago = editar
somente esse arquivo. Ver `docs/art-direction.md`.

Placeholders são gerados por `tools/gen_iso_placeholders.py` (determinístico,
seed fixa) e ficam versionados para permitir comparação e rollback.

## Persistência

`localStorage`, chave `cap4kids.save.v2`. Cada sistema tem `serialize()`/`load()`,
então o save é a composição dos sistemas — não um dump do estado do renderer.
Save corrompido cai silenciosamente em jogo novo.

## Comandos

```bash
npm run dev      # servidor de desenvolvimento
npm run test     # vitest
npm run build    # tsc + vite build
```

## Dívida técnica conhecida

- Bundle único de ~1,65 MB (Phaser inteiro). Resolver com `manualChunks`.
- Sem pathfinding: a trabalhadora anda em linha reta até o alvo.
- Economia ainda é aritmética: preço fixo, dívida sem juros, sem inflação.
  É o escopo da onda seguinte.
- Sem camada pedagógica.
