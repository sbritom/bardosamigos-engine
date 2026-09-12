import { useEffect, useState } from "react";
import { Heart, ListMusic, Save, Sparkles, Star, ThumbsDown } from "lucide-react";

import {
  getRadioEvoxRankingAdmin,
  saveRadioEvoxRankingAdmin,
} from "../requests/radioEvoxRankingApi";
import "./radioEvoxRankingAdmin.css";

const EMPTY_RANKING_ITEM = { title: "", artist: "", likes: 0, dislikes: 0, approval: 0 };
const EMPTY_HIGHLIGHT = { title: "", artist: "", count: 0 };
const EMPTY_FORM = {
  periodLabel: "Ranking atual",
  songsEvaluated: 0,
  likesCount: 0,
  approvalPercent: 0,
  totalReactions: 0,
  mostLiked: { ...EMPTY_HIGHLIGHT },
  mostFavorited: { ...EMPTY_HIGHLIGHT },
  mostRejected: { ...EMPTY_HIGHLIGHT },
  ranking: Array.from({ length: 5 }, () => ({ ...EMPTY_RANKING_ITEM })),
};

function toForm(data = {}) {
  const ranking = Array.from({ length: 5 }, (_, index) => {
    const item = data.ranking?.[index] || EMPTY_RANKING_ITEM;
    return {
      title: item.title || "",
      artist: item.artist || "",
      likes: Number(item.likes ?? item.count) || 0,
      dislikes: Number(item.dislikes) || 0,
      approval: Number(item.approval) || 0,
    };
  });

  return {
    periodLabel: data.periodLabel || "Ranking atual",
    songsEvaluated: Number(data.songsEvaluated) || 0,
    likesCount: Number(data.likesCount) || 0,
    approvalPercent: Number(data.approvalPercent) || 0,
    totalReactions: Number(data.totalReactions) || 0,
    mostLiked: { ...EMPTY_HIGHLIGHT, ...(data.mostLiked || {}) },
    mostFavorited: { ...EMPTY_HIGHLIGHT, ...(data.mostFavorited || {}) },
    mostRejected: { ...EMPTY_HIGHLIGHT, ...(data.mostRejected || {}) },
    ranking,
  };
}

function HighlightFields({ title, icon, value, onChange }) {
  return (
    <div className="radio-evox-manager__highlight-card">
      <div className="radio-evox-manager__highlight-title">
        {icon}
        <strong>{title}</strong>
      </div>

      <label>
        Música
        <input
          value={value.title}
          onChange={(event) => onChange("title", event.target.value)}
          maxLength={120}
          placeholder="Nome da música"
        />
      </label>

      <label>
        Artista
        <input
          value={value.artist}
          onChange={(event) => onChange("artist", event.target.value)}
          maxLength={120}
          placeholder="Nome do artista"
        />
      </label>

      <label>
        Quantidade
        <input
          type="number"
          min="0"
          value={value.count}
          onChange={(event) => onChange("count", event.target.value)}
        />
      </label>
    </div>
  );
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
    const nextValue = type === "number" ? Math.max(0, Number(value) || 0) : value;
    setForm((current) => ({ ...current, [name]: nextValue }));
  }

  function updateHighlight(name, field, value) {
    setForm((current) => ({
      ...current,
      [name]: {
        ...current[name],
        [field]: field === "count" ? Math.max(0, Number(value) || 0) : value,
      },
    }));
  }

  function updateRankingItem(index, field, value) {
    setForm((current) => ({
      ...current,
      ranking: current.ranking.map((item, itemIndex) => (
        itemIndex === index
          ? {
              ...item,
              [field]: ["likes", "dislikes", "approval"].includes(field)
                ? Math.max(0, Number(value) || 0)
                : value,
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
      setFeedback("Ranking EVOX salvo. O card Mais Pedidas foi atualizado.");
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
        Cadastre exatamente os números do Ranking Musical da EVOX: avaliações, curtidas, aprovação, reações, destaques e Top 5.
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

            <div className="radio-evox-manager__grid radio-evox-manager__grid--metrics">
              <label>
                Identificação
                <input
                  name="periodLabel"
                  value={form.periodLabel}
                  onChange={updateField}
                  maxLength={60}
                  placeholder="Ex.: Ranking atual"
                />
              </label>

              <label>
                Músicas avaliadas
                <input name="songsEvaluated" type="number" min="0" value={form.songsEvaluated} onChange={updateField} />
              </label>

              <label>
                Curtidas
                <input name="likesCount" type="number" min="0" value={form.likesCount} onChange={updateField} />
              </label>

              <label>
                Aprovação (%)
                <input name="approvalPercent" type="number" min="0" max="100" value={form.approvalPercent} onChange={updateField} />
              </label>

              <label>
                Total de reações
                <input name="totalReactions" type="number" min="0" value={form.totalReactions} onChange={updateField} />
              </label>
            </div>
          </div>

          <div className="radio-evox-manager__section">
            <div className="radio-evox-manager__section-title">
              <Sparkles size={16} />
              <strong>Destaques dos ouvintes</strong>
            </div>

            <div className="radio-evox-manager__highlights">
              <HighlightFields
                title="Mais curtida"
                icon={<Heart size={15} />}
                value={form.mostLiked}
                onChange={(field, value) => updateHighlight("mostLiked", field, value)}
              />
              <HighlightFields
                title="Mais favoritada"
                icon={<Star size={15} />}
                value={form.mostFavorited}
                onChange={(field, value) => updateHighlight("mostFavorited", field, value)}
              />
              <HighlightFields
                title="Mais rejeitada"
                icon={<ThumbsDown size={15} />}
                value={form.mostRejected}
                onChange={(field, value) => updateHighlight("mostRejected", field, value)}
              />
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

                  <div className="radio-evox-manager__rank-stats">
                    <label>
                      👍
                      <input type="number" min="0" value={item.likes} onChange={(event) => updateRankingItem(index, "likes", event.target.value)} />
                    </label>
                    <label>
                      👎
                      <input type="number" min="0" value={item.dislikes} onChange={(event) => updateRankingItem(index, "dislikes", event.target.value)} />
                    </label>
                    <label>
                      Aprovação
                      <input type="number" min="0" max="100" value={item.approval} onChange={(event) => updateRankingItem(index, "approval", event.target.value)} />
                    </label>
                  </div>
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
