import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Headphones,
  ListMusic,
  Loader2,
  Mic2,
  Music2,
  Newspaper,
  Pause,
  Play,
  Radio,
  Volume2,
  X,
} from "lucide-react";

import {
  fetchMxCastStatus,
  getMxCastStreamUrl,
  getRadioMetadataInterval,
} from "./mxcastRadioApi";
import { submitRadioMusicRequest } from "./requests/radioRequestsApi";
import { useAuth } from "../../modules/auth/AuthContext";
import "./radioUi.css";

const INITIAL_METADATA = {
  online: false,
  songTitle: "",
  track: "Programação ao vivo",
  artist: "IMORTAL0800",
  listeners: 0,
  peakListeners: 0,
  serverTitle: "IMORTAL0800",
  streamUrl: getMxCastStreamUrl(),
  cover: "",
  updatedAt: null,
};

const RADIO_SECTIONS = [
  {
    id: "ranking",
    icon: ListMusic,
    eyebrow: "Mais tocadas",
    title: "Ranking musical",
    description: "As músicas que estão se destacando na rádio e nos pedidos.",
    empty: "Ainda não há um ranking musical publicado.",
  },
  {
    id: "novidades",
    icon: Newspaper,
    eyebrow: "Música",
    title: "Novidades",
    description: "Lançamentos, destaques e novidades do universo musical.",
    empty: "As próximas novidades musicais aparecerão aqui.",
  },
];


const RADIO_SCHEDULE = [
  { day: "Segunda", locutor: "Locutor a definir", time: "Horário a definir" },
  { day: "Terça", locutor: "Locutor a definir", time: "Horário a definir" },
  { day: "Quarta", locutor: "Locutor a definir", time: "Horário a definir" },
  { day: "Quinta", locutor: "Locutor a definir", time: "Horário a definir" },
  { day: "Sexta", locutor: "Locutor a definir", time: "Horário a definir" },
  { day: "Sábado", locutor: "Locutor a definir", time: "Horário a definir" },
  { day: "Domingo", locutor: "Locutor a definir", time: "Horário a definir" },
];

function getListenerLabel(count) {
  const value = Number(count) || 0;
  return `${value} ${value === 1 ? "ouvinte" : "ouvintes"} agora`;
}

export default function RadioPage() {
  const { isAuthenticated, profile, displayName, openAuth } = useAuth();
  const audioRef = useRef(null);
  const requestCloseTimerRef = useRef(null);
  const requestInputRef = useRef(null);
  const requestTriggerRef = useRef(null);
  const [metadata, setMetadata] = useState(INITIAL_METADATA);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [metadataError, setMetadataError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [playerError, setPlayerError] = useState("");
  const [volume, setVolume] = useState(80);
  const [failedCover, setFailedCover] = useState("");
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState("");
  const [requestFeedbackTone, setRequestFeedbackTone] = useState("info");
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestForm, setRequestForm] = useState({
    requesterName: "",
    songAndArtist: "",
    message: "",
  });

  const streamUrl = useMemo(() => getMxCastStreamUrl(), []);
  const coverUrl = typeof metadata.cover === "string" ? metadata.cover.trim() : "";
  const hasCover = /^https?:\/\//i.test(coverUrl) && failedCover !== coverUrl;
  const isUnavailable = Boolean(metadataError || playerError);

  const refreshMetadata = useCallback(async (signal) => {
    try {
      const nextMetadata = await fetchMxCastStatus({ signal });
      setMetadata((current) => ({
        ...current,
        ...nextMetadata,
        streamUrl: streamUrl || nextMetadata.streamUrl,
      }));
      setMetadataError("");
    } catch (error) {
      if (error.name !== "AbortError") {
        setMetadataError("Os dados da faixa não puderam ser atualizados agora.");
      }
    } finally {
      setMetadataLoading(false);
    }
  }, [streamUrl]);

  useEffect(() => {
    const controller = new AbortController();
    const refreshTimer = window.setTimeout(() => refreshMetadata(controller.signal), 0);
    const intervalId = window.setInterval(
      () => refreshMetadata(controller.signal),
      getRadioMetadataInterval(),
    );

    return () => {
      controller.abort();
      window.clearTimeout(refreshTimer);
      window.clearInterval(intervalId);
    };
  }, [refreshMetadata]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = Math.min(Math.max(volume, 0), 100) / 100;
  }, [volume]);

  useEffect(() => () => {
    window.clearTimeout(requestCloseTimerRef.current);
  }, []);

  const closeRequestFlow = useCallback(() => {
    window.clearTimeout(requestCloseTimerRef.current);
    setRequestModalOpen(false);
    window.requestAnimationFrame(() => requestTriggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!requestModalOpen) return undefined;

    const frame = window.requestAnimationFrame(() => requestInputRef.current?.focus());
    const onKeyDown = (event) => {
      if (event.key !== "Escape" || requestSubmitting) return;
      event.preventDefault();
      closeRequestFlow();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeRequestFlow, requestModalOpen, requestSubmitting]);

  const handleToggle = useCallback(async () => {
    if (!audioRef.current) return;

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      setConnecting(false);
      return;
    }

    try {
      setPlayerError("");
      setConnecting(true);
      await audioRef.current.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
      setPlayerError("Não foi possível conectar à rádio agora.");
    } finally {
      setConnecting(false);
    }
  }, [playing]);

  const handleVolume = useCallback((event) => {
    setVolume(Number(event.target.value));
  }, []);

  const handleRequestChange = useCallback((event) => {
    const { name, value } = event.target;
    setRequestForm((current) => ({
      ...current,
      [name]: value,
    }));
  }, []);

  const openRequestFlow = useCallback(() => {
    setRequestFeedback("");
    setRequestFeedbackTone("info");
    setRequestModalOpen(true);
  }, []);

  const handleRequestSubmit = useCallback(async (event) => {
    event.preventDefault();
    setRequestFeedback("");
    setRequestFeedbackTone("info");

    try {
      setRequestSubmitting(true);
      await submitRadioMusicRequest({
        ...requestForm,
        requesterName: isAuthenticated ? "" : requestForm.requesterName,
      });
      setRequestFeedback("Seu pedido foi enviado ao locutor.");
      setRequestFeedbackTone("success");
      setRequestForm({ requesterName: "", songAndArtist: "", message: "" });
      window.clearTimeout(requestCloseTimerRef.current);
      requestCloseTimerRef.current = window.setTimeout(() => {
        closeRequestFlow();
        setRequestFeedback("");
        setRequestFeedbackTone("info");
      }, 2400);
    } catch (error) {
      setRequestFeedback(
        error.status === 429
          ? "Aguarde um pouco antes de enviar outro pedido."
          : error.status === 401
            ? "Sua sessão expirou. Atualize a página e tente novamente."
            : error.message || "Não foi possível registrar o pedido agora.",
      );
      setRequestFeedbackTone("error");
    } finally {
      setRequestSubmitting(false);
    }
  }, [closeRequestFlow, isAuthenticated, requestForm]);

  return (
    <main className="imortal-radio-page">
      <audio
        ref={audioRef}
        src={streamUrl}
        preload="none"
        onCanPlay={() => setConnecting(false)}
        onEnded={() => setPlaying(false)}
        onError={() => {
          setConnecting(false);
          setPlaying(false);
          setPlayerError("Stream temporariamente indisponível.");
        }}
        onPause={() => setPlaying(false)}
        onPlay={() => {
          setPlayerError("");
          setPlaying(true);
          setConnecting(false);
        }}
        onWaiting={() => setConnecting(true)}
      />

      <header className="imortal-radio-hero">
        <div>
          <span className="imortal-radio-hero__eyebrow">
            <Radio size={15} />
            RÁDIO IMORTAL0800
          </span>
          <h1>Som que não para.</h1>
          <p>Ouça ao vivo, peça sua música e acompanhe tudo que acontece na programação.</p>
        </div>

        <nav className="imortal-radio-nav" aria-label="Seções da rádio">
          <a href="#ao-vivo">
            <Radio size={14} />
            Ao vivo
          </a>
          <button ref={requestTriggerRef} type="button" onClick={openRequestFlow}>
            <Music2 size={14} />
            Pedidos
          </button>
          <a href="#ranking">
            <ListMusic size={14} />
            Ranking
          </a>
          <a href="#novidades">
            <Newspaper size={14} />
            Novidades
          </a>
        </nav>
      </header>

      <section
        id="ao-vivo"
        className={`imortal-radio-player-card ${hasCover ? "has-cover" : ""}`}
        aria-label="Player da Rádio IMORTAL0800"
        aria-busy={metadataLoading}
        style={hasCover ? { "--imortal-radio-cover-image": `url("${coverUrl}")` } : undefined}
      >
        <div className="imortal-radio-cover">
          {hasCover ? (
            <img
              src={coverUrl}
              alt={`Capa de ${metadata.track}`}
              onError={() => setFailedCover(coverUrl)}
            />
          ) : (
            <div className="imortal-radio-cover__fallback" aria-hidden="true">
              <Radio size={72} />
              <span>IMORTAL0800</span>
            </div>
          )}
        </div>

        <div className="imortal-radio-player-card__content">
          <div className="imortal-radio-live-line">
            <span className={`imortal-radio-live-badge ${metadata.online || playing ? "is-live" : ""}`}>
              <i aria-hidden="true" />
              {playing ? "OUVINDO AGORA" : metadata.online ? "NO AR" : "RÁDIO"}
            </span>
            <span className="imortal-radio-listeners">
              <Headphones size={16} />
              {getListenerLabel(metadata.listeners)}
            </span>
          </div>

          <div className="imortal-radio-track">
            <span>TOCANDO AGORA</span>
            <h2>{metadataLoading ? "Carregando música..." : metadata.track}</h2>
            <p>{metadata.artist || "IMORTAL0800"}</p>
          </div>

          <div className="imortal-radio-controls">
            <button
              className="imortal-radio-play"
              type="button"
              onClick={handleToggle}
              disabled={connecting}
              aria-label={playing ? "Pausar rádio" : "Tocar rádio"}
            >
              {connecting ? (
                <Loader2 size={22} className="imortal-radio-spin" aria-hidden="true" />
              ) : playing ? (
                <Pause size={23} fill="currentColor" aria-hidden="true" />
              ) : (
                <Play size={23} fill="currentColor" aria-hidden="true" />
              )}
            </button>

            <div className="imortal-radio-control-center">
              <span>{playing ? "Tocando ao vivo" : "Rádio IMORTAL0800"}</span>
              <small>{playing ? "Clique para pausar" : "Clique em play para ouvir"}</small>
            </div>

            <label className="imortal-radio-volume" title={`Volume ${volume}%`}>
              <Volume2 size={17} aria-hidden="true" />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolume}
                aria-label="Volume da rádio"
                style={{ "--imortal-radio-volume": `${volume}%` }}
              />
              <span>{volume}%</span>
            </label>

            <button className="imortal-radio-request" type="button" onClick={openRequestFlow}>
              <Music2 size={16} aria-hidden="true" />
              Pedir música
            </button>
          </div>

          {isUnavailable && (
            <p className="imortal-radio-alert" role="status" aria-live="polite">
              {playerError || metadataError}
            </p>
          )}
        </div>
      </section>

      <section className="imortal-radio-schedule" aria-labelledby="radio-schedule-title">
        <div className="imortal-radio-schedule__header">
          <div className="imortal-radio-schedule__icon">
            <Mic2 size={20} />
          </div>
          <div>
            <span>PROGRAMAÇÃO</span>
            <h2 id="radio-schedule-title">Locutores da rádio</h2>
            <p>Grade semanal do IMORTAL0800 com dia, locutor e horário.</p>
          </div>
        </div>

        <div className="imortal-radio-schedule__grid">
          {RADIO_SCHEDULE.map((slot) => (
            <article key={slot.day} className="imortal-radio-schedule__day">
              <div className="imortal-radio-schedule__day-title">
                <CalendarDays size={15} />
                <strong>{slot.day}</strong>
              </div>
              <span>{slot.locutor}</span>
              <small>
                <Clock3 size={13} />
                {slot.time}
              </small>
            </article>
          ))}
        </div>
      </section>

      <section className="imortal-radio-content-grid" aria-label="Conteúdo da rádio">
        {RADIO_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <article key={section.id} id={section.id} className="imortal-radio-info-card">
              <div className="imortal-radio-info-card__icon">
                <Icon size={21} />
              </div>
              <span>{section.eyebrow}</span>
              <h2>{section.title}</h2>
              <p>{section.description}</p>
              <div className="imortal-radio-empty">
                <strong>Em preparação</strong>
                <small>{section.empty}</small>
              </div>
            </article>
          );
        })}
      </section>

      {requestModalOpen && (
        <div className="imortal-radio-modal" role="dialog" aria-modal="true" aria-labelledby="radio-request-title">
          <div className="imortal-radio-modal__panel">
            <div className="imortal-radio-modal__header">
              <div>
                <span>IMORTAL0800</span>
                <strong id="radio-request-title">Pedir música</strong>
              </div>
              <button type="button" aria-label="Fechar pedido de música" onClick={closeRequestFlow} disabled={requestSubmitting}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form className="imortal-radio-request-form" onSubmit={handleRequestSubmit} aria-busy={requestSubmitting}>
              {isAuthenticated ? (
                <div className="imortal-radio-request-identity is-user">
                  <div>
                    <span>Pedido identificado</span>
                    <strong>@{String(profile?.username || displayName || "usuario").toUpperCase()}</strong>
                  </div>
                  <small>Seu pedido ficará vinculado à sua conta.</small>
                </div>
              ) : (
                <>
                  <div className="imortal-radio-request-identity is-guest">
                    <div>
                      <span>Modo visitante</span>
                      <strong>Continuar como visitante</strong>
                    </div>
                    <button type="button" onClick={() => openAuth("", "login")}>
                      Entrar
                    </button>
                  </div>

                  <label>
                    Seu nome
                    <input
                      name="requesterName"
                      type="text"
                      placeholder="Nome que aparecerá no pedido"
                      minLength={2}
                      maxLength={40}
                      required
                      value={requestForm.requesterName}
                      onChange={handleRequestChange}
                    />
                  </label>
                </>
              )}

              <label>
                Música e artista
                <input
                  ref={requestInputRef}
                  name="songAndArtist"
                  type="text"
                  placeholder="Nome da música e do artista"
                  minLength={3}
                  maxLength={180}
                  required
                  value={requestForm.songAndArtist}
                  onChange={handleRequestChange}
                />
              </label>

              <label>
                Recado <span>(opcional)</span>
                <textarea
                  name="message"
                  placeholder="Deixe um recado para a rádio"
                  maxLength={500}
                  rows={3}
                  value={requestForm.message}
                  onChange={handleRequestChange}
                />
              </label>

              {requestFeedback && (
                <p
                  className={`imortal-radio-feedback is-${requestFeedbackTone}`}
                  role={requestFeedbackTone === "error" ? "alert" : "status"}
                  aria-live="polite"
                >
                  {requestFeedback}
                </p>
              )}

              <div className="imortal-radio-modal__actions">
                <button type="button" onClick={closeRequestFlow} disabled={requestSubmitting}>Cancelar</button>
                <button type="submit" disabled={requestSubmitting}>
                  {requestSubmitting ? "Enviando..." : "Enviar pedido"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
