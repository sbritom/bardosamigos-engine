import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Headphones,
  ListMusic,
  Loader2,
  Mic2,
  Music2,
  Sparkles,
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
import {
  getRadioPublicContent,
  submitRadioMusicRequest,
} from "./requests/radioRequestsApi";
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



const FALLBACK_SCHEDULE = [
  { dayOfWeek: 1, dayLabel: "Segunda", locutorName: "", timeLabel: "", enabled: true },
  { dayOfWeek: 2, dayLabel: "Terça", locutorName: "", timeLabel: "", enabled: true },
  { dayOfWeek: 3, dayLabel: "Quarta", locutorName: "", timeLabel: "", enabled: true },
  { dayOfWeek: 4, dayLabel: "Quinta", locutorName: "", timeLabel: "", enabled: true },
  { dayOfWeek: 5, dayLabel: "Sexta", locutorName: "", timeLabel: "", enabled: true },
  { dayOfWeek: 6, dayLabel: "Sábado", locutorName: "", timeLabel: "", enabled: true },
  { dayOfWeek: 7, dayLabel: "Domingo", locutorName: "", timeLabel: "", enabled: true },
];

function getListenerLabel(count) {
  const value = Number(count) || 0;
  return `${value} ${value === 1 ? "ouvinte" : "ouvintes"} agora`;
}


function normalizeRadioSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function isMusicNews(item = {}) {
  const text = normalizeRadioSearchText(
    [item.title, item.description, item.summary].filter(Boolean).join(" "),
  );

  return /(musica|musical|cantor|cantora|banda|album|single|show|turne|festival|sertanejo|forro|pagode|funk|rap|rock|pop|dj|artista)/.test(text);
}

function normalizeMusicNews(item = {}) {
  return {
    id: item.id || item.url || item.title,
    title: item.title || "Novidade musical",
    source: item.source || item.metadata?.source || "Fonte sincronizada",
    url: item.url || item.metadata?.sourceUrl || item.metadata?.originalUrl || "",
  };
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
  const [activeProgramIndex, setActiveProgramIndex] = useState(0);
  const [radioPrograms, setRadioPrograms] = useState([]);
  const [radioSchedule, setRadioSchedule] = useState(FALLBACK_SCHEDULE);
  const [radioRanking, setRadioRanking] = useState([]);
  const [radioNews, setRadioNews] = useState([]);
  const [radioLocutorStatus, setRadioLocutorStatus] = useState({ isLive: false, locutorName: "" });
  const [radioContentError, setRadioContentError] = useState("");
  const [requestForm, setRequestForm] = useState({
    requesterName: "",
    songAndArtist: "",
    message: "",
  });

  const streamUrl = useMemo(() => getMxCastStreamUrl(), []);
  const coverUrl = typeof metadata.cover === "string" ? metadata.cover.trim() : "";
  const hasCover = /^https?:\/\//i.test(coverUrl) && failedCover !== coverUrl;
  const isUnavailable = Boolean(metadataError || playerError);
  const activeProgram = radioPrograms[activeProgramIndex] || null;

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


  useEffect(() => {
    let active = true;

    async function loadPublicRadioContent() {
      try {
        const content = await getRadioPublicContent();
        if (!active) return;

        setRadioPrograms(Array.isArray(content?.programs) ? content.programs : []);
        setRadioSchedule(
          Array.isArray(content?.schedule) && content.schedule.length
            ? content.schedule
            : FALLBACK_SCHEDULE,
        );
        setRadioRanking(Array.isArray(content?.ranking) ? content.ranking : []);
        setRadioLocutorStatus({
          isLive: Boolean(content?.locutorStatus?.isLive),
          locutorName: content?.locutorStatus?.locutorName || "",
        });
        setRadioContentError("");

        try {
          const musicResponse = await fetch("/api/news?category=Música&limit=5", {
            headers: { Accept: "application/json" },
          });
          const musicPayload = await musicResponse.json().catch(() => ({}));
          let musicArticles = Array.isArray(musicPayload?.articles) ? musicPayload.articles : [];

          if (!musicArticles.length) {
            const fallbackResponse = await fetch("/api/news?category=Entretenimento&limit=20", {
              headers: { Accept: "application/json" },
            });
            const fallbackPayload = await fallbackResponse.json().catch(() => ({}));
            musicArticles = (Array.isArray(fallbackPayload?.articles) ? fallbackPayload.articles : [])
              .filter(isMusicNews);
          }

          if (active) {
            setRadioNews(musicArticles.slice(0, 3).map(normalizeMusicNews));
          }
        } catch {
          if (active) setRadioNews([]);
        }
      } catch {
        if (!active) return;
        setRadioContentError("A programação está sendo atualizada.");
      }
    }

    loadPublicRadioContent();
    const intervalId = window.setInterval(loadPublicRadioContent, 60000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (radioPrograms.length < 2) return undefined;

    const timer = window.setInterval(() => {
      setActiveProgramIndex((current) => (current + 1) % radioPrograms.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [radioPrograms.length]);

  useEffect(() => {
    if (activeProgramIndex < radioPrograms.length) return;
    setActiveProgramIndex(0);
  }, [activeProgramIndex, radioPrograms.length]);

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

          {radioLocutorStatus.isLive ? (
            <div className="imortal-radio-schedule__live">
              <Radio size={14} />
              <span>NO AR AGORA</span>
              <strong>{radioLocutorStatus.locutorName || "Locutor"}</strong>
            </div>
          ) : null}
        </div>

        <div className="imortal-radio-schedule__grid">
          {radioSchedule.map((slot) => (
            <article key={slot.dayOfWeek || slot.dayLabel} className="imortal-radio-schedule__day">
              <div className="imortal-radio-schedule__day-title">
                <CalendarDays size={15} />
                <strong>{slot.dayLabel}</strong>
              </div>
              <span>{slot.locutorName || "Locutor a definir"}</span>
              <small>
                <Clock3 size={13} />
                {slot.timeLabel || "Horário a definir"}
              </small>
            </article>
          ))}
        </div>
      </section>

      <section className="imortal-radio-content-grid" aria-label="Conteúdo da rádio">
        <article id="ranking" className="imortal-radio-info-card imortal-radio-ranking-card">
          <div className="imortal-radio-info-card__icon">
            <ListMusic size={21} />
          </div>
          <span>MAIS PEDIDAS</span>
          <h2>Ranking musical</h2>
          <p>As músicas mais pedidas pela comunidade no IMORTAL0800.</p>

          {radioRanking.length ? (
            <ol className="imortal-radio-ranking-list">
              {radioRanking.map((item, index) => (
                <li key={`${item.label}-${index}`}>
                  <strong>{index + 1}</strong>
                  <span>{item.label}</span>
                  <small>{item.count} {item.count === 1 ? "pedido" : "pedidos"}</small>
                </li>
              ))}
            </ol>
          ) : (
            <div className="imortal-radio-empty">
              <strong>Ranking começando</strong>
              <small>Os pedidos enviados pela página alimentarão este Top 5 automaticamente.</small>
            </div>
          )}
        </article>

        <article id="novidades" className="imortal-radio-info-card imortal-radio-news-card">
          <div className="imortal-radio-info-card__icon">
            <Newspaper size={21} />
          </div>
          <span>MÚSICA</span>
          <h2>Novidades</h2>
          <p>Lançamentos e destaques musicais encontrados nas notícias do portal.</p>

          {radioNews.length ? (
            <div className="imortal-radio-news-list">
              {radioNews.map((item) => (
                <a
                  key={item.id}
                  href={item.url || "#"}
                  target={item.url ? "_blank" : undefined}
                  rel={item.url ? "noreferrer" : undefined}
                  onClick={(event) => {
                    if (!item.url) event.preventDefault();
                  }}
                >
                  <strong>{item.title}</strong>
                  <small>{item.source}</small>
                </a>
              ))}
            </div>
          ) : (
            <div className="imortal-radio-empty">
              <strong>Novidades em atualização</strong>
              <small>Quando houver notícias musicais recentes, elas aparecerão aqui automaticamente.</small>
            </div>
          )}
        </article>

        <article
          className={`imortal-radio-programs-card ${activeProgram?.imageUrl ? "has-image" : ""}`}
          aria-labelledby="radio-programs-title"
          style={activeProgram?.imageUrl ? { "--imortal-radio-program-image": `url("${activeProgram.imageUrl}")` } : undefined}
        >
          <div className="imortal-radio-programs-card__top">
            <div className="imortal-radio-info-card__icon">
              <Sparkles size={21} />
            </div>
            <span>PROGRAMAS DA RÁDIO</span>
          </div>

          {activeProgram ? (
            <>
              <div key={activeProgram.id} className="imortal-radio-programs-card__slide">
                <small>{activeProgram.locutorName || "IMORTAL0800"}</small>
                <h2 id="radio-programs-title">{activeProgram.title}</h2>
                <p>{activeProgram.description || "Programa da Rádio IMORTAL0800."}</p>
                <strong>
                  {[activeProgram.daysLabel, activeProgram.timeLabel].filter(Boolean).join(" • ") || "Dias e horários a definir"}
                </strong>
              </div>

              {radioPrograms.length > 1 ? (
                <div className="imortal-radio-programs-card__indicators" aria-label="Selecionar programa">
                  {radioPrograms.map((program, index) => (
                    <button
                      key={program.id}
                      type="button"
                      className={index === activeProgramIndex ? "is-active" : ""}
                      aria-label={`Mostrar programa ${index + 1}`}
                      aria-current={index === activeProgramIndex ? "true" : undefined}
                      onClick={() => setActiveProgramIndex(index)}
                    />
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="imortal-radio-empty">
              <strong>Programas em preparação</strong>
              <small>Os programas cadastrados no Painel da Rádio aparecerão aqui automaticamente.</small>
            </div>
          )}
        </article>
      </section>

      {radioContentError ? (
        <p className="imortal-radio-content-notice" role="status">{radioContentError}</p>
      ) : null}

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
