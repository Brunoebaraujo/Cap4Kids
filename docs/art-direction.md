# Direção de arte — Cap4Kids

Documento de **critério de compra**. Antes de pagar por qualquer pack no itch.io,
confira este arquivo item por item. Um pack que falhe nos itens da seção 1 custa
mais para adaptar do que custa comprar outro.

---

## 1. Requisitos eliminatórios

Se o pack falhar em qualquer um destes, **não compre**.

| # | Requisito | Como verificar |
|---|-----------|----------------|
| 1 | **Projeção dimetrica 2:1** | O tile de chão tem exatamente o dobro de largura que de altura (128×64, 256×128, 64×32). Meça um PNG de grama. Packs "isométricos" em 30° verdadeiro (proporção 1.73:1) não encaixam. |
| 2 | **PNG com canal alpha** | `file grama.png` deve indicar RGBA. JPG é eliminatório — foi exatamente o bug do sprite anterior da Maya. |
| 3 | **Luz constante** | Abra 5 sprites diferentes. A sombra tem que cair sempre para o mesmo lado. Pack montado de fontes diferentes tem luz brigando. |
| 4 | **Licença comercial + redistribuição em build web** | O jogo é público no GitHub Pages, então os PNGs ficam acessíveis. Muitos packs proíbem redistribuição de asset "cru". Leia o `license.txt`. |
| 5 | **Culturas com estágios de crescimento** | A maioria dos packs de fazenda entrega **um** sprite de trigo. Precisamos de **4 estágios**. Se não vier, é custo extra de arte. |

---

## 2. Requisitos fortes (negociáveis, com custo)

| Requisito | Se faltar |
|-----------|-----------|
| Âncora bottom-center | Dá para corrigir no manifesto com offset por sprite. Custo baixo. |
| Sem sombra de contato assada | Se vier assada em todos, tudo bem — o problema é vir em alguns sim e outros não. |
| Tile ≥ 128×64 | 64×32 funciona com escala 2×, mas fica macio. Prefira nativo. |
| Paleta coesa | Harmonizável via script de matiz/saturação. Custo médio. |

---

## 3. Convenções travadas do projeto

Estas já estão implementadas em `src/game/iso/projection.ts` e comprovadas por
teste automatizado. O pack se adapta a elas, não o contrário.

- **Tile de chão:** 128 × 64 px.
- **Origem do sprite no Phaser:** `setOrigin(0.5, 1)`.
- **Ponto de ancoragem:** a aresta inferior do canvas do sprite coincide com o
  **vértice inferior** do losango de base.
- **Footprint:** declarado em tiles no manifesto. Um celeiro 2×2 tem base de
  256 × 128 px e ancora no vértice inferior do bloco.
- **Luz:** vinda de **noroeste**. Face esquerda clara, face direita escura.
- **Ordenação de profundidade:** painter's algorithm pela coordenada Y da âncora
  (`depthFor`). Não use `tx + ty` — quebra com footprints diferentes.

---

## 4. Lista de slots a preencher

O manifesto (`src/game/assets/isoManifest.ts`) já declara todos os slots abaixo,
hoje preenchidos por placeholders procedurais. Trocar o pack = trocar os arquivos
e ajustar dimensões neste único arquivo.

**Chão (128×64, 9 slots)**
`grass_00` `grass_01` `grass_02` `grass_03` `dirt` `path` `soil_plowed` `soil_planted` `water`

**Construções (5 slots)**
| Slot | Footprint |
|------|-----------|
| `farmhouse` | 2×2 |
| `barn` | 2×2 |
| `silo` | 1×1 |
| `shipping_bin` | 1×1 |
| `well` | 1×1 |

**Culturas (4 slots — estágios de crescimento)**
`wheat_0` `wheat_1` `wheat_2` `wheat_3`

**Unidades (2 slots)**
`worker_maya` `cow`

**Cenário (3 slots)**
`tree` `fence_ne` `fence_nw`

**Total: 23 slots.** Um pack de fazenda isométrica decente cobre 18–20 deles.
Os buracos previsíveis são os estágios de trigo e a personagem.

---

## 5. Onde a arte comprada NÃO entra

O chrome de interface (painel de comando, molduras, botões, minimapa, ícones de
recurso) é feito em CSS e SVG no próprio código, não em PNG. Não pague por um
pack de UI — o painel atual já está implementado em `src/styles.css` e escala
sem perder nitidez.

---

## 6. Procedimento de troca

1. Descompacte o pack em `tools/incoming/`.
2. Rode o script de normalização (a criar na onda 2) para conferir dimensões,
   alpha e âncora de cada arquivo.
3. Copie os aprovados para `public/assets/iso/{ground,sprites}/`.
4. Ajuste `isoManifest.ts` se as dimensões ou footprints diferirem.
5. `npx vitest run && npm run build`.
6. Confira o resultado no navegador antes de commitar.

Os placeholders continuam versionados e regeneráveis por
`python3 tools/gen_iso_placeholders.py`, então dá para voltar atrás a qualquer
momento e comparar.
