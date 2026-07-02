import { useState } from "react";
import { Activity, BarChart3, Database, Gauge, Radio, Settings, UploadCloud, Users } from "lucide-react";

import RadioPlayer from "./RadioPlayer";
import { RadioAdminMenu, RadioDataTable, RadioScheduleGrid, RadioSectionHeader, RadioStatCard, RadioTrackCard, RadioUploadZone } from "./components";
import { useLibrary, useListeners, useStreaming } from "./hooks";
import { RadioEngineProvider, useRadioEngineStore } from "./store/radioStore";
import { formatDateTime, formatDuration, formatStorage } from "./utils/radioFormatters";
import { getCurrentTrack, getNextTrack, getPlaylistDuration } from "./utils/radioSelectors";
import "./styles/radioEngine.css";

function DashboardSection() {
  const { state } = useRadioEngineStore();
  const current = getCurrentTrack(state);
  const next = getNextTrack(state);
  const freeStorage = state.status.storageTotalGb - state.status.storageUsedGb;

  return (
    <>
      <RadioSectionHeader eyebrow="Controle central" title="Dashboard da Radio" description="Visao operacional do AutoDJ, streaming, biblioteca e audiencia." />
      <div className="bar-radio-grid">
        <RadioStatCard label="Status da Radio" value={state.status.online ? "Online" : "Offline"} hint="Stream externo ainda nao conectado" />
        <RadioStatCard label="AutoDJ" value={state.status.autoDj ? "Ativo" : "Inativo"} hint="Configuracoes prontas" />
        <RadioStatCard label="Streaming" value={state.status.streaming ? "Transmitindo" : "Preparado"} hint="Icecast, Shoutcast ou externo" />
        <RadioStatCard label="Musica atual" value={current?.title || "-"} hint={current?.artist} />
        <RadioStatCard label="Proxima musica" value={next?.title || "-"} hint={next?.artist} />
        <RadioStatCard label="Tempo restante" value={formatDuration(state.status.remainingSeconds)} />
        <RadioStatCard label="Musicas" value={state.tracks.length} />
        <RadioStatCard label="Playlists" value={state.playlists.length} />
        <RadioStatCard label="Ouvintes" value={state.status.listenersOnline} hint={`Pico ${state.status.audiencePeak}`} />
        <RadioStatCard label="Armazenamento" value={formatStorage(state.status.storageUsedGb, state.status.storageTotalGb)} hint={`${freeStorage.toFixed(1)} GB livre`} />
        <RadioStatCard label="Ultimo upload" value={formatDateTime(state.status.lastUploadAt)} />
        <RadioStatCard label="Ultimo erro" value={state.status.lastError || "Nenhum"} />
      </div>
    </>
  );
}

function LibrarySection() {
  const library = useLibrary();

  const columns = [
    { key: "title", label: "Titulo" },
    { key: "artist", label: "Artista" },
    { key: "album", label: "Album" },
    { key: "category", label: "Categoria" },
    { key: "year", label: "Ano" },
    { key: "bitrate", label: "Bitrate" },
    { key: "format", label: "Formato" },
    { key: "size", label: "Tamanho" },
    { key: "duration", label: "Duracao", render: (track) => formatDuration(track.duration) },
  ];

  return (
    <>
      <RadioSectionHeader eyebrow="Biblioteca" title="Acervo musical" description="Busca, filtros, modo grade/lista e acoes preparadas." />
      <div className="bar-radio-toolbar">
        <input className="bar-radio-input" onChange={(event) => library.setQuery(event.target.value)} placeholder="Pesquisar musica, artista ou album" value={library.query} />
        <select className="bar-radio-select" onChange={(event) => library.setCategory(event.target.value)} value={library.category}>
          <option value="all">Todas categorias</option>
          {library.categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
        </select>
        <button className="bar-radio-button secondary" onClick={() => library.setView(library.view === "grid" ? "list" : "grid")} type="button">
          Modo {library.view === "grid" ? "lista" : "grade"}
        </button>
      </div>
      {library.view === "grid" ? (
        <div className="bar-radio-track-grid">
          {library.tracks.map((track) => <RadioTrackCard key={track.id} onFavorite={library.toggleFavorite} track={track} />)}
        </div>
      ) : (
        <RadioDataTable columns={columns} rows={library.tracks} />
      )}
    </>
  );
}

function UploadSection() {
  return (
    <>
      <RadioSectionHeader eyebrow="Upload" title="Envio de audio" description="Area drag and drop, fila, progresso e leitura automatica de metadados preparada." />
      <RadioUploadZone />
      <div className="bar-radio-grid">
        <RadioStatCard label="Metadados" value="Automatico" hint="Titulo, artista, album, genero, bitrate e capa" />
        <RadioStatCard label="Upload multiplo" value="Preparado" hint="Fila e cancelamento previstos" />
      </div>
    </>
  );
}

function CategoriesSection() {
  const { state } = useRadioEngineStore();
  return (
    <>
      <RadioSectionHeader eyebrow="Categorias" title="Organizacao editorial" description="Categorias padrao com cor, icone e ordem." />
      <div className="bar-radio-grid">
        {state.categories.map((category) => (
          <article className="bar-radio-card" key={category.id}>
            <span className="bar-radio-badge" style={{ borderColor: category.color }}>{category.order}</span>
            <h3>{category.name}</h3>
            <p>Cor {category.color} - icone {category.icon}</p>
          </article>
        ))}
      </div>
    </>
  );
}

function PlaylistsSection() {
  const { state } = useRadioEngineStore();
  return (
    <>
      <RadioSectionHeader eyebrow="Playlists" title="Programas e blocos musicais" description="Criar, editar, duplicar, ordenar, shuffle e repeticao preparados." />
      <div className="bar-radio-grid">
        {state.playlists.map((playlist) => (
          <RadioStatCard
            key={playlist.id}
            label={playlist.shuffle ? "Shuffle ativo" : "Ordem manual"}
            value={playlist.name}
            hint={`${playlist.trackIds.length} musicas - ${formatDuration(getPlaylistDuration(playlist, state.tracks))}`}
          />
        ))}
      </div>
    </>
  );
}

function ScheduleSection() {
  const { state } = useRadioEngineStore();
  return (
    <>
      <RadioSectionHeader eyebrow="Programacao" title="Calendario semanal" description="Blocos por dia e horario, preparado para drag and drop em sprint futura." />
      <RadioScheduleGrid schedule={state.schedule} />
    </>
  );
}

function StreamingSection() {
  const streaming = useStreaming();
  const fields = ["streamingType", "streamUrl", "mountpoint", "port", "codec", "bitrate", "format"];

  return (
    <>
      <RadioSectionHeader eyebrow="Streaming" title="Configuracao unica" description="Preparado para Icecast, Shoutcast e streaming externo." />
      <div className="bar-radio-grid">
        {fields.map((field) => (
          <label className="bar-radio-card" key={field}>
            <small>{field}</small>
            <input className="bar-radio-input" readOnly value={streaming.config[field] || ""} />
          </label>
        ))}
        <RadioStatCard label="Reconexao automatica" value={streaming.config.autoReconnect ? "Ativa" : "Inativa"} />
      </div>
    </>
  );
}

function ListenersSection() {
  const listeners = useListeners();
  return (
    <>
      <RadioSectionHeader eyebrow="Ouvintes" title="Audiencia em tempo real" description="Online, pico, hoje, ontem, pais, cidade, sistema e navegador." />
      <div className="bar-radio-grid">
        <RadioStatCard label="Online" value={listeners.online} />
        <RadioStatCard label="Pico" value={listeners.peak} />
        <RadioStatCard label="Hoje" value={listeners.today} />
        <RadioStatCard label="Ontem" value={listeners.yesterday} />
      </div>
      <RadioDataTable columns={[{ key: "country", label: "Pais" }, { key: "city", label: "Cidade" }, { key: "system", label: "Sistema" }, { key: "browser", label: "Navegador" }, { key: "device", label: "Dispositivo" }]} rows={listeners.listeners} />
    </>
  );
}

function StatsSection() {
  const { state } = useRadioEngineStore();
  return (
    <>
      <RadioSectionHeader eyebrow="Estatisticas" title="Performance da radio" description="Mais tocadas, artistas, categorias, uploads, transmissao e crescimento." />
      <div className="bar-radio-grid">
        <RadioStatCard label="Mais tocada" value={state.tracks[0]?.title} />
        <RadioStatCard label="Artistas" value="3" />
        <RadioStatCard label="Categorias" value={state.categories.length} />
        <RadioStatCard label="Uploads" value={state.tracks.length} />
        <RadioStatCard label="Downloads" value="0" />
        <RadioStatCard label="Tempo transmitido" value="128h" />
        <RadioStatCard label="Crescimento" value="+18%" />
      </div>
    </>
  );
}

function LogsSection() {
  const { state } = useRadioEngineStore();
  return (
    <>
      <RadioSectionHeader eyebrow="Logs" title="Historico operacional" description="Uploads, streaming, AutoDJ, erros e reconexoes." />
      <RadioDataTable columns={[{ key: "type", label: "Tipo" }, { key: "level", label: "Nivel" }, { key: "message", label: "Mensagem" }, { key: "createdAt", label: "Data", render: (log) => formatDateTime(log.createdAt) }]} rows={state.logs} />
    </>
  );
}

function SettingsSection() {
  const streaming = useStreaming();
  return (
    <>
      <RadioSectionHeader eyebrow="Configuracoes" title="Identidade e player" description="Nome, slogan, cores, tema, idioma, streaming, autoplay e volume padrao." />
      <div className="bar-radio-grid">
        {["name", "slogan", "primaryColor", "secondaryColor", "theme", "language", "defaultVolume"].map((field) => (
          <label className="bar-radio-card" key={field}>
            <small>{field}</small>
            <input className="bar-radio-input" onChange={(event) => streaming.updateConfig({ [field]: event.target.value })} value={streaming.config[field]} />
          </label>
        ))}
      </div>
    </>
  );
}

function RadioEngineContent() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const sections = {
    dashboard: <DashboardSection />,
    library: <LibrarySection />,
    upload: <UploadSection />,
    categories: <CategoriesSection />,
    playlists: <PlaylistsSection />,
    schedule: <ScheduleSection />,
    streaming: <StreamingSection />,
    listeners: <ListenersSection />,
    stats: <StatsSection />,
    logs: <LogsSection />,
    settings: <SettingsSection />,
  };

  return (
    <main className="bar-radio-engine">
      <section className="bar-radio-hero">
        <div>
          <span className="bar-radio-eyebrow">Bar Radio Engine v1.0</span>
          <h1>Radio online completa para o Bar dos Amigos</h1>
          <p>
            Plataforma modular com player premium, AutoDJ preparado, biblioteca, programacao, streaming,
            ouvintes, estatisticas e configuracoes usando mocks completos.
          </p>
          <div className="bar-radio-toolbar" style={{ marginTop: 18 }}>
            <span className="bar-radio-badge"><Gauge size={14} /> MVP producao</span>
            <span className="bar-radio-badge"><Database size={14} /> Mocks completos</span>
            <span className="bar-radio-badge"><Activity size={14} /> Integracoes preparadas</span>
          </div>
        </div>
        <RadioPlayer />
      </section>

      <section className="bar-radio-admin">
        <RadioAdminMenu activeSection={activeSection} onChange={setActiveSection} />
        <div className="bar-radio-panel">{sections[activeSection]}</div>
      </section>
    </main>
  );
}

export default function RadioPage() {
  return (
    <RadioEngineProvider>
      <RadioEngineContent />
    </RadioEngineProvider>
  );
}
