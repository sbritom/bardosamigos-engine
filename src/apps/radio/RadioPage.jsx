import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Headphones, Loader2, Music2, Pause, Play, Radio, Volume2, X } from "lucide-react";

import {
  fetchMxCastStatus,
  getMxCastStreamUrl,
  getRadioMetadataInterval,
} from "./mxcastRadioApi";
import { submitRadioMusicRequest } from "./requests/radioRequestsApi";
import "./radioUi.css";

const INITIAL_METADATA = {
  online: false,
  songTitle: "",
  track: "Programacao ao vivo",
  artist: "Radio Bar dos Amigos",
  listeners: 0,
  peakListeners: 0,
  serverTitle: "Radio Bar dos Amigos",
  streamUrl: getMxCastStreamUrl(),
  cover: "",
  updatedAt: null,
};

function getListenerLabel(count) {
  const value = Number(count) || 0;
  return `${value} ${value === 1 ? "ouvinte" : "ouvintes"} agora`;
}

export default function RadioPage() {
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
        setMetadataError("Nao foi possivel atualizar os dados da radio agora.");
      }
    } finally {
      setMetadataLoading(false);
    }
  }, [streamUrl]);

  useEffect(() => {
    const controller = new AbortController();
    const refreshTimer = window.setTimeout(() => refreshMetadata(controller.signal), 0);
    const intervalId = window.setInterval(() => refreshMetadata(controller.signal), getRadioMetadataInterval());

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
      setPlayerError("Nao foi possivel conectar a radio agora.");
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
      await submitRadioMusicRequest(requestForm);
      setRequestFeedback("Seu pedido foi enviado ao locutor.");
      setRequestFeedbackTone("success");
      setRequestForm({ songAndArtist: "", message: "" });
      window.clearTimeout(requestCloseTimerRef.current);
      requestCloseTimerRef.current = window.setTimeout(() => {
        closeRequestFlow();
        setRequestFeedback("");
        setRequestFeedbackTone("info");
      }, 2400);
    } catch (error) {
      setRequestFeedback(error.status === 429
        ? "Aguarde um pouco antes de enviar outro pedido."
        : error.status === 401
          ? "Sua sessao expirou. Atualize a pagina e tente novamente; pedidos como visitante continuam liberados."
          : error.message || "Nao foi possivel registrar o pedido agora.");
      setRequestFeedbackTone("error");
    } finally {
      setRequestSubmitting(false);
    }
  }, [closeRequestFlow, requestForm]);

  return (
    <main className="bar-radio-page">
      <audio
        ref={audioRef}
        src={streamUrl}
        preload="none"
        onCanPlay={() => setConnecting(false)}
        onEnded={() => setPlaying(false)}
        onError={() => {
          setConnecting(false);
          setPlaying(false);
          setPlayerError("Stream temporariamente indisponivel.");
        }}
        onPause={() => setPlaying(false)}
        onPlay={() => {
          setPlayerError("");
          setPlaying(true);
          setConnecting(false);
        }}
        onWaiting={() => setConnecting(true)}
      />

      <section className="bar-radio-listener-player" aria-label="Player da Radio Bar dos Amigos" aria-busy={metadataLoading}>
        <div className="bar-radio-cover-panel">
          {hasCover ? (
            <img
              src={coverUrl}
              alt={`Capa de ${metadata.track}`}
              className="bar-radio-cover-image"
              onError={() => setFailedCover(coverUrl)}
            />
          ) : (
            <div className="bar-radio-cover-fallback" aria-hidden="true">
              <Radio size={72} />
            </div>
          )}
        </div>

        <div className="bar-radio-player-content">
          <span className="bar-radio-now-label">TOCANDO AGORA</span>
          <h2>{metadataLoading ? "Carregando musica..." : metadata.track}</h2>
          <p>{metadata.artist}</p>

          <div className="bar-radio-listener-row">
            <span>
              <Headphones size={17} aria-hidden="true" />
              {getListenerLabel(metadata.listeners)}
            </span>
            {metadata.updatedAt && (
              <small>Atualizado {new Date(metadata.updatedAt).toLocaleTimeString("pt-BR")}</small>
            )}
          </div>

          <div className="bar-radio-controls">
            <button
              className="bar-radio-play-button"
              type="button"
              onClick={handleToggle}
              disabled={connecting}
              aria-label={playing ? "Pausar radio" : "Tocar radio"}
            >
              {connecting ? <Loader2 size={28} className="bar-radio-spin-icon" aria-hidden="true" /> : playing ? <Pause size={30} aria-hidden="true" /> : <Play size={30} aria-hidden="true" />}
            </button>

            <label className="bar-radio-volume-control" title={`Volume ${volume}%`}>
              <Volume2 size={20} aria-hidden="true" />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolume}
                aria-label="Volume da radio"
                style={{ "--bar-radio-volume": `${volume}%` }}
              />
            </label>

            <button ref={requestTriggerRef} className="bar-radio-request-button" type="button" onClick={openRequestFlow}>
              <Music2 size={18} aria-hidden="true" />
              PEDIR M&Uacute;SICA
            </button>
          </div>

          {isUnavailable && (
            <p className="bar-radio-soft-alert" role="status" aria-live="polite">{playerError || metadataError}</p>
          )}
        </div>
      </section>

      {requestModalOpen && (
        <div className="bar-radio-request-modal" role="dialog" aria-modal="true" aria-labelledby="radio-request-title">
          <div className="bar-radio-request-panel">
            <div className="bar-radio-request-header">
              <strong id="radio-request-title">Pedir m&uacute;sica</strong>
              <button type="button" aria-label="Fechar pedido de musica" onClick={closeRequestFlow} disabled={requestSubmitting}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form className="bar-radio-request-form" onSubmit={handleRequestSubmit} aria-busy={requestSubmitting}>
              <p className="bar-radio-request-intro">
                Voce pode pedir como visitante ou com sua conta. O pedido sera enviado ao painel do locutor.
              </p>

              <label>
                M&uacute;sica e artista
                <input
                  ref={requestInputRef}
                  name="songAndArtist"
                  type="text"
                  placeholder="Nome da musica e do artista"
                  minLength={3}
                  maxLength={180}
                  required
                  value={requestForm.songAndArtist}
                  onChange={handleRequestChange}
                />
              </label>

              <label>
                Deixe seu recado <span>(opcional)</span>
                <textarea
                  name="message"
                  placeholder="Deixe um recado para a radio"
                  maxLength={500}
                  rows={3}
                  value={requestForm.message}
                  onChange={handleRequestChange}
                />
              </label>

              {requestFeedback && (
                <p
                  className={`bar-radio-request-feedback is-${requestFeedbackTone}`}
                  role={requestFeedbackTone === "error" ? "alert" : "status"}
                  aria-live="polite"
                >
                  {requestFeedback}
                </p>
              )}

              <div className="bar-radio-request-actions">
                <button type="button" onClick={closeRequestFlow} disabled={requestSubmitting}>Fechar</button>
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
