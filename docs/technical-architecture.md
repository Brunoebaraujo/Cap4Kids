# Arquitetura técnica

## Diagnóstico atual

O projeto é um protótipo web em React, TypeScript e Phaser. React controla HUD e painéis; Phaser controla o mundo. A separação é adequada, mas o estado ainda vive no navegador. A versão atual demonstra o loop econômico e concorrentes simulados; ela não deve ser tratada como multiplayer seguro.

## Arquitetura-alvo

```text
React HUD + Phaser Client
        | WebSocket (commands/snapshots)
        v
Authoritative Game Server
  rooms | economy | market | admin events | anti-cheat
        | jobs/events
        v
PostgreSQL + Redis
        |
        v
Admin Console + Analytics
```

### Cliente

- React: autenticação, lobby, mercado, tutorial, relatórios e console admin.
- Phaser: mapa isométrico, seleção, câmera, animações e feedback de ações.
- Nunca decide saldo, preço, colheita ou permissão administrativa.
- Envia comandos com `commandId`; renderiza snapshots confirmados pelo servidor.

### Servidor autoritativo

Recomendação: Node.js + TypeScript + Colyseus. Uma `Room` representa uma partida/aula. O servidor valida ações, executa ticks, resolve concorrência, mantém o mercado e transmite deltas. Alternativa madura: Nakama, se autenticação social, matchmaking e recursos prontos forem prioridade.

### Dados

- PostgreSQL: usuários, famílias/turmas, partidas, inventário persistente, ledger e progresso pedagógico.
- Redis: presença, filas, rate limiting e recuperação rápida de salas.
- Object storage/CDN: mapas, sprites, áudio e versões dos assets.
- Ledger imutável: toda alteração de moedas registra origem, destino, motivo e `commandId`.

### Segurança do admin

- Papel `admin` vem do token do servidor, nunca de um botão local.
- Evento administrativo exige validação de esquema, escopo da sala e cooldown.
- Audit log guarda autor, horário, parâmetros, jogadores afetados e reversão.
- Eventos destrutivos têm prévia, confirmação e limites configuráveis.

## Modelo econômico

- Produção cria bens; venda converte bens em moeda e mede riqueza criada.
- Oferta, demanda e decisões dos concorrentes movimentam preços.
- Inflação altera preços e custos, mostrando perda de poder de compra.
- Custos recorrentes forçam planejamento e explicitam custo de oportunidade.
- Falência deve virar recuperação educativa, não punição irreversível.

## Isometria

O protótipo aplica uma apresentação isométrica à base lógica existente. A produção deve migrar o mapa para Tiled, projeção 2:1 (tiles 64x32), ordenação por profundidade `x + y`, colisões lógicas em grid e pathfinding A*. A simulação continua em coordenadas cartesianas; apenas a projeção é isométrica.

## Multiplayer em fases

1. Extrair `EconomySystem` e regras puras para pacote compartilhado.
2. Criar servidor de sala e protocolo tipado.
3. Substituir concorrentes simulados por jogadores conectados.
4. Adicionar reconnect, idempotência e persistência.
5. Habilitar admin autenticado, auditoria e replay de eventos.
6. Testes de carga e telemetria antes de turmas reais.
