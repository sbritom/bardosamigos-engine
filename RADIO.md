# Rádio IMORTAL0800

## Fonte oficial

- Stream: `https://s01.svrdedicado.org:7956/stream`
- Player persistente: `https://player.svrdedicado.org/player-topo-moderno1/7956/060A11`
- Metadados: `/api/radio/stats`
- Pedidos: `/api/radio/requests`

## Fluxo público

A página `/radio` oferece player, faixa atual, ouvintes e pedidos musicais. Visitantes podem enviar pedidos informando identificação; usuários autenticados usam a identidade da conta.

## Painel

O painel `/radio/admin` recebe os pedidos enviados pela API e é protegido por cargo administrativo/locutor.

## Princípios

1. A porta 7956 é a fonte oficial do áudio.
2. O portal não deve manter streams antigos como fallback.
3. Toda identificação pública da estação deve ser **Rádio IMORTAL0800**.
4. Novas integrações devem reutilizar as APIs existentes sempre que possível para respeitar o limite de funções serverless da hospedagem.
