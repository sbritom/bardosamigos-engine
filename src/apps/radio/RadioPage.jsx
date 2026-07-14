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

  const handleRequestSubmit = useCallback(async (event) => {
    event.preventDefault();
    setRequestFeedback("");
    setRequestFeedbackTone("info");

    try {
      setRequestSubmitting(true);
      await submitRadioMusicRequest(requestForm);
      setRequestFeedback("Pedido enviado para o locutor! Seu pedido foi registrado com sucesso.");
      setRequestFeedbackTone("success");
      setRequestForm({ songAndArtist: "", message: "" });
    } catch (error) {
      setRequestFeedback(error.status === 429
        ? "Aguarde um pouco antes de enviar outro pedido."
        : error.message || "Nao foi possivel registrar o pedido agora.");
      setRequestFeedbackTone("error");
    } finally {
      setRequestSubmitting(false);
    }
  }, [requestForm]);

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

      <header className="bar-radio-page-header">
        <div className="bar-radio-page-title">
          <Radio size={24} />
          <h1>R&Aacute;DIO DO BAR</h1>
        </div>
      </header>

      <section className="bar-radio-listener-player" aria-label="Player da Radio Bar dos Amigos">
        <div className="bar-radio-cover-panel">
          {hasCover ? (
            <img
              src={coverUrl}
              alt=""
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
              <Headphones size={17} />
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
              {connecting ? <Loader2 size={28} className="bar-radio-spin-icon" /> : playing ? <Pause size={30} /> : <Play size={30} />}
            </button>

            <label className="bar-radio-volume-control">
              <Volume2 size={20} />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolume}
                aria-label="Volume da radio"
              />
              <span>{volume}%</span>
            </label>
          </div>

          {isUnavailable && (
            <p className="bar-radio-soft-alert">{playerError || metadataError}</p>
          )}
        </div>
      </section>

      <section className="bar-radio-request-block">
        <button className="bar-radio-request-button" type="button" onClick={() => {
          setRequestFeedback("");
          setRequestFeedbackTone("info");
          setRequestModalOpen(true);
        }}>
          <Music2 size={18} />
          PEDIR M&Uacute;SICA
        </button>
      </section>

      {requestModalOpen && (
        <div className="bar-radio-request-modal" role="dialog" aria-modal="true" aria-labelledby="radio-request-title">
          <div className="bar-radio-request-panel">
            <div className="bar-radio-request-header">
              <strong id="radio-request-title">Pedir m&uacute;sica</strong>
              <button type="button" aria-label="Fechar pedido de musica" onClick={() => setRequestModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form className="bar-radio-request-form" onSubmit={handleRequestSubmit}>
              <label>
                M&uacute;sica e artista
                <input
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

              {requestFeedback && <p className={`bar-radio-request-feedback is-${requestFeedbackTone}`}>{requestFeedback}</p>}

              <div className="bar-radio-request-actions">
                <button type="button" onClick={() => setRequestModalOpen(false)} disabled={requestSubmitting}>Fechar</button>
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
