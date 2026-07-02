# Streaming Setup

## Objetivo

Preparar a infraestrutura de streaming da Bar Radio Engine para desenvolvimento Windows e producao Ubuntu, sem implementar upload, Supabase, AutoDJ, Player ou frontend.

## Arquivos principais

- `server/config/icecast.xml`
- `config/ffmpeg.json`
- `server/install/install-icecast.ps1`
- `server/install/install-ffmpeg.ps1`
- `server/scripts/validate-streaming.ps1`
- `server/scripts/start-streaming.ps1`
- `server/scripts/stop-streaming.ps1`
- `server/scripts/restart-streaming.ps1`
- `server/install/install-icecast.sh`
- `server/install/install-ffmpeg.sh`
- `server/scripts/validate-streaming.sh`
- `server/scripts/start-streaming.sh`
- `server/scripts/stop-streaming.sh`
- `server/scripts/restart-streaming.sh`

## Windows

Validar ambiente:

```powershell
.\server\scripts\validate-streaming.ps1
```

Preparar FFmpeg:

```powershell
.\server\install\install-ffmpeg.ps1
```

Preparar Icecast:

```powershell
.\server\install\install-icecast.ps1
```

Iniciar:

```powershell
.\server\scripts\start-streaming.ps1
```

Parar:

```powershell
.\server\scripts\stop-streaming.ps1
```

Reiniciar:

```powershell
.\server\scripts\restart-streaming.ps1
```

## Ubuntu

Dar permissao de execucao:

```bash
chmod +x server/install/*.sh server/scripts/*.sh
```

Instalar FFmpeg:

```bash
server/install/install-ffmpeg.sh
```

Instalar Icecast:

```bash
server/install/install-icecast.sh
```

Validar:

```bash
server/scripts/validate-streaming.sh
```

Iniciar:

```bash
server/scripts/start-streaming.sh
```

Parar:

```bash
server/scripts/stop-streaming.sh
```

Reiniciar:

```bash
server/scripts/restart-streaming.sh
```

## Icecast

Configuracao base:

```text
server/config/icecast.xml
```

Valores padrao:

- Hostname: `localhost`
- Porta: `8000`
- Mount: `/radio`
- Admin user: `admin`
- Admin password: `admin`
- Source password: `hackme`
- Relay password: `relay`

Em producao, altere todas as senhas antes de expor o servico.

## FFmpeg

Configuracao:

```text
config/ffmpeg.json
```

Campos:

- `executablePath`
- `codec`
- `bitrate`
- `sampleRate`
- `channels`
- `buffer`
- `format`
- `extraArgs`
- `logLevel`

## Validacao

Os scripts validam:

- Icecast instalado.
- FFmpeg instalado.
- Porta 8000 livre.
- Configuracao encontrada.
- Pasta de musicas encontrada.
- Pasta de logs encontrada.
- Engine preparada.

## Observacoes

Esta sprint prepara infraestrutura. Streaming real, AutoDJ operacional, upload, Supabase e frontend ficam fora do escopo desta etapa.
