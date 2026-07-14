# Plano de execução

## Fase 0 — fundação demonstrável (entregue neste repositório)

- Mundo Phaser integrado ao HUD React.
- Loop plantar, colher, estocar, vender e pagar custos.
- Preços, inflação e riqueza criada visíveis.
- Dois concorrentes simulados e placar.
- Console admin com seca, chuva, subsídio, choque inflacionário e gafanhotos.
- Apresentação isométrica inicial e deploy por GitHub Pages.

## Fase 1 — vertical slice de produção (3–5 semanas)

- Definir faixa etária, duração da partida e objetivos pedagógicos mensuráveis.
- Novo mapa 2:1 no Tiled; sprites e construções isométricas finais.
- Mercado por oferta/demanda e contratos entre fazendas.
- Tutorial, feedback de conceitos e recuperação de falência.
- Testes unitários das regras econômicas e playtests com 6–10 crianças.

Critério de saída: uma partida local de 20 minutos ensina produção, troca, concorrência e inflação sem explicação externa.

## Fase 2 — multiplayer autoritativo (4–6 semanas)

- Backend TypeScript/Colyseus, PostgreSQL e Redis.
- Login, lobby, salas privadas, reconexão e snapshots.
- Ledger transacional e comandos idempotentes.
- 2–8 fazendas por sala, chat seguro por frases predefinidas.
- Deploy de staging e testes de carga.

Critério de saída: 8 jogadores completam uma sessão com reconexão e nenhum saldo decidido pelo cliente.

## Fase 3 — diretor/admin (2–3 semanas)

- Autorização real por papéis.
- Criador de eventos com intensidade, duração, alvo e prévia.
- Audit log, desfazer evento e replay da partida.
- Painel pedagógico com decisões, patrimônio e conceitos experimentados.

## Fase 4 — piloto e lançamento (3–5 semanas)

- Consentimento parental/escolar, privacidade e política de retenção.
- Acessibilidade, localização PT-BR/EN e moderação.
- Piloto com 2 turmas, telemetria e balanceamento.
- Backups, alertas, runbooks e orçamento de escala.

## Backlog posterior

- Cooperativas, empréstimos, seguros, especialização e cadeias produtivas.
- Temporadas e cenários históricos sem propaganda partidária.
- Editor de cenários para professores.
