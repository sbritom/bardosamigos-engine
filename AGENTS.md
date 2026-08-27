# Politica De Continuidade Do Projeto

## Classificacao

### Finalizadas E Protegidas

- Home `/`
- TV `/tv`
- Radio publica `/radio`

Essas paginas nao podem sofrer alteracoes futuras sem autorizacao explicita da Mayara.

### Em Desenvolvimento

- `/radio/admin`
- Sistema de pedidos musicais
- Integracao pontual do formulario `PEDIR MUSICA` da `/radio` com o backend real

A unica excecao atual para a `/radio` e conectar/manter o formulario `PEDIR MUSICA` ao backend real, sem redesenhar ou alterar o restante da pagina publica.

### Congeladas

- Todas as demais paginas e rotas que ainda nao foram revisadas explicitamente.

## Regras Permanentes

- Alterar somente arquivos estritamente necessarios para cada tarefa.
- Nao fazer refatoracoes globais sem autorizacao explicita.
- Nao alterar arquivos compartilhados que possam afetar paginas protegidas ou congeladas sem informar antes.
- Nao remover funcionalidades antigas apenas porque parecem nao utilizadas.
- Nao modificar Home, `/tv`, `/radio`, player MxCast do topo, header, catalogo de canais, stream ou metadados, exceto mediante pedido explicito.
- Antes de concluir qualquer tarefa futura, executar `git diff --name-only` e confirmar que apenas arquivos do escopo autorizado foram alterados.
- Nao fazer commit nem push automaticamente, salvo quando solicitado.
