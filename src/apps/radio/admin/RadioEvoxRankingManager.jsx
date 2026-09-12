import { useEffect, useState } from "react";
import { ListMusic, Save, Sparkles } from "lucide-react";

import {
  getRadioEvoxRankingAdmin,
  saveRadioEvoxRankingAdmin,
} from "../requests/radioEvoxRankingApi";
import "./radioEvoxRankingAdmin.css";

const EMPTY_RANKING_ITEM = { title: "", artist: "", requests: 0 };
const EMPTY_FORM = {
  periodLabel: "Últimos 7 dias",
  totalRequests: 0,
  uniqueSongs: 0,
  highlightSong: "",
  highlightArtist: "",
  ranking: Array.from({ length: 5 }, () => ({ ...EMPTY_RANKING_ITEM })),
};

function toForm(data = {}) {
  const ranking = Array.from({ length: 5 }, (_, index) => {
    const item = data.ranking?.[index] || EMPTY_RANKING_ITEM;
    return {
      title: item.title || "",
      artist: item.artist || "",
      requests: Number(item.requests ?? item.count) || 0,
    };
  });

  return {
    periodLabel: data.periodLabel || "Últimos 7 dias",
    totalRequests: Number(data.totalRequests) || 0,
    uniqueSongs: Number(data.uniqueSongs) || 0,
    highlightSong: data.highlightSong || "",
    highlightArtist: data.highlightArtist || "",
    ranking,
  };
}

export default function RadioEvoxRankingManager() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  useEffect(() => {
    let active = true;

    async function loadRanking() {
      try {
        const data = await getRadioEvoxRankingAdmin();
        if (!active) return;
        setForm(toForm(data));
        setUpdatedAt(data.updatedAt || "");
        setError("");
      } catch (requestError) {
        if (!active) return;
        setError(requestError.message || "Não foi possível carregar o Ranking EVOX.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRanking();
    return () => {
      active = false;
    };
  }, []);

  function updateField(event) {
    const { name, value, type } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "number" ? Math.max(0, Number(value) || 0) : value,
    }));
  }

  function updateRankingItem(index, field, value) {
    setForm((current) => ({
      ...current,
      ranking: current.ranking.map((item, itemIndex) => (
        itemIndex === index
          ? {
              ...item,
              [field]: field === "requests" ? Math.max(0, Number(value) || 0) : value,
            }
          : item
      )),
    }));
  }

  async function submit(event) {
    event.preventDefault();

    try {
      setBusy(true);
      setError("");
      setFeedback("");
      const data = await saveRadioEvoxRankingAdmin(form);
      setForm(toForm(data));
      setUpdatedAt(data.updatedAt || "");
      setFeedback("Ranking EVOX salvo. O card Mais Pedidas já usará este Top 5.");
    } catch (requestError) {
      setError(requestError.message || "Não foi possível salvar o Ranking EVOX.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="radio-admin-panel radio-evox-manager">
      <div className="radio-admin-panel-title">
        <ListMusic size={18} />
        <h2>Ranking EVOX</h2>
      </div>

      <p className="radio-evox-manager__intro">
        Atualize manualmente os números da EVOX e o Top 5 que alimenta o card Mais Pedidas da página Rádio.
      </p>

      {loading ? (
        <div className="radio-evox-manager__loading">Carregando Ranking EVOX...</div>
      ) : (
        <form className="radio-evox-manager__form" onSubmit={submit}>
          <div className="radio-evox-manager__section">
            <div className="radio-evox-manager__section-title">
              <Sparkles size={16} />
              <strong>Números gerais</strong>
            </div>

            <div className="radio-evox-manager__grid radio-evox-manager__grid--three">
              <label>
                Período
                <input
                  name="periodLabel"
                  value={form.periodLabel}
                  onChange={updateField}
                  maxLength={60}
                  placeholder="Ex.: Últimos 7 dias"
                />
              </label>

              <label>
                Total de pedidos
                <input
                  name="totalRequests"
                  type="number"
                  min="0"
                  value={form.totalRequests}
                  onChange={updateField}
                />
              </label>

              <label>
                Músicas diferentes
                <input
                  name="uniqueSongs"
                  type="number"
                  min="0"
                  value={form.uniqueSongs}
                  onChange={updateField}
                />
              </label>
            </div>
          </div>

          <div className="radio-evox-manager__section">
            <div className="radio-evox-manager__section-title">
              <Sparkles size={16} />
              <strong>Destaques</strong>
            </div>

            <div className="radio-evox-manager__grid radio-evox-manager__grid--two">
              <label>
                Música destaque
                <input
                  name="highlightSong"
                  value={form.highlightSong}
                  onChange={updateField}
                  maxLength={120}
                  placeholder="Nome da música"
                />
              </label>

              <label>
                Artista destaque
                <input
                  name="highlightArtist"
                  value={form.highlightArtist}
                  onChange={updateField}
                  maxLength={120}
                  placeholder="Nome do artista"
                />
              </label>
            </div>
          </div>

          <div className="radio-evox-manager__section">
            <div className="radio-evox-manager__section-title">
              <ListMusic size={16} />
              <strong>Top 5</strong>
            </div>

            <div className="radio-evox-manager__ranking">
              {form.ranking.map((item, index) => (
                <div className="radio-evox-manager__rank-row" key={index}>
                  <span className="radio-evox-manager__position">{index + 1}</span>

                  <label>
                    Música
                    <input
                      value={item.title}
                      onChange={(event) => updateRankingItem(index, "title", event.target.value)}
                      maxLength={120}
                      placeholder={`Música ${index + 1}`}
                    />
                  </label>

                  <label>
                    Artista
                    <input
                      value={item.artist}
                      onChange={(event) => updateRankingItem(index, "artist", event.target.value)}
                      maxLength={120}
                      placeholder="Artista"
                    />
                  </label>

                  <label className="radio-evox-manager__requests">
                    Pedidos
                    <input
                      type="number"
                      min="0"
                      value={item.requests}
                      onChange={(event) => updateRankingItem(index, "requests", event.target.value)}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          {error ? <p className="radio-evox-manager__error">{error}</p> : null}
          {feedback ? <p className="radio-evox-manager__success">{feedback}</p> : null}

          <div className="radio-evox-manager__footer">
            <small>
              {updatedAt
                ? `Última atualização: ${new Date(updatedAt).toLocaleString("pt-BR")}`
                : "Ainda não há atualização manual publicada."}
            </small>

            <button type="submit" disabled={busy}>
              <Save size={15} />
              {busy ? "Salvando..." : "Salvar Ranking EVOX"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
