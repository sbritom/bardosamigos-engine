import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  Clock3,
  Image,
  Mic2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import {
  createRadioProgram,
  deleteRadioProgram,
  listRadioProgramsAdmin,
  listRadioScheduleAdmin,
  updateRadioProgram,
  updateRadioScheduleSlot,
} from "../requests/radioRequestsApi";

const EMPTY_PROGRAM = {
  id: "",
  title: "",
  description: "",
  locutorName: "",
  daysLabel: "",
  timeLabel: "",
  imageUrl: "",
  displayOrder: 0,
  enabled: true,
};

function ProgramManager() {
  const [programs, setPrograms] = useState([]);
  const [form, setForm] = useState(EMPTY_PROGRAM);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setPrograms(await listRadioProgramsAdmin());
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Não foi possível carregar os programas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function resetForm() {
    setEditingId("");
    setForm(EMPTY_PROGRAM);
    setFeedback("");
  }

  function editProgram(program) {
    setEditingId(program.id);
    setForm({
      id: program.id,
      title: program.title || "",
      description: program.description || "",
      locutorName: program.locutorName || "",
      daysLabel: program.daysLabel || "",
      timeLabel: program.timeLabel || "",
      imageUrl: program.imageUrl || "",
      displayOrder: program.displayOrder || 0,
      enabled: program.enabled !== false,
    });
    setFeedback("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event) {
    event.preventDefault();
    try {
      setBusy(true);
      setError("");
      setFeedback("");

      if (editingId) {
        await updateRadioProgram({ ...form, id: editingId });
        setFeedback("Programa atualizado.");
      } else {
        await createRadioProgram(form);
        setFeedback("Programa criado.");
      }

      setEditingId("");
      setForm(EMPTY_PROGRAM);
      await refresh();
    } catch (requestError) {
      setError(requestError.message || "Não foi possível salvar o programa.");
    } finally {
      setBusy(false);
    }
  }

  async function removeProgram(program) {
    if (!window.confirm(`Remover o programa "${program.title}"?`)) return;

    try {
      setBusy(true);
      setError("");
      await deleteRadioProgram(program.id);
      if (editingId === program.id) resetForm();
      await refresh();
    } catch (requestError) {
      setError(requestError.message || "Não foi possível remover o programa.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="radio-admin-panel radio-content-manager">
      <div className="radio-admin-panel-title">
        <Mic2 size={18} />
        <h2>Programas da Rádio</h2>
      </div>

      <p className="radio-content-manager__intro">
        Cadastre os programas que aparecem no card dinâmico da página da Rádio.
      </p>

      <form className="radio-program-form" onSubmit={submit}>
        <div className="radio-program-form__grid">
          <label>
            Nome do programa
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              maxLength={80}
              required
              placeholder="Ex.: Batida Perfeita"
            />
          </label>

          <label>
            Locutor
            <input
              name="locutorName"
              value={form.locutorName}
              onChange={handleChange}
              maxLength={80}
              placeholder="Nome do locutor"
            />
          </label>

          <label>
            Dias
            <input
              name="daysLabel"
              value={form.daysLabel}
              onChange={handleChange}
              maxLength={100}
              placeholder="Ex.: Segunda e quarta"
            />
          </label>

          <label>
            Horário
            <input
              name="timeLabel"
              value={form.timeLabel}
              onChange={handleChange}
              maxLength={80}
              placeholder="Ex.: 20:00 às 22:00"
            />
          </label>

          <label className="radio-program-form__wide">
            URL da imagem/banner
            <span className="radio-program-form__input-with-icon">
              <Image size={15} />
              <input
                name="imageUrl"
                value={form.imageUrl}
                onChange={handleChange}
                maxLength={500}
                placeholder="https://..."
              />
            </span>
          </label>

          <label>
            Ordem
            <input
              name="displayOrder"
              type="number"
              min="0"
              value={form.displayOrder}
              onChange={handleChange}
            />
          </label>

          <label className="radio-program-form__toggle">
            <input
              name="enabled"
              type="checkbox"
              checked={form.enabled}
              onChange={handleChange}
            />
            <span>Mostrar no site</span>
          </label>

          <label className="radio-program-form__wide">
            Descrição
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              maxLength={300}
              rows={3}
              placeholder="Descrição curta do programa."
            />
          </label>
        </div>

        {error ? <p className="radio-content-manager__error">{error}</p> : null}
        {feedback ? <p className="radio-content-manager__success">{feedback}</p> : null}

        <div className="radio-program-form__actions">
          {editingId ? (
            <button type="button" onClick={resetForm} disabled={busy}>
              <X size={15} />
              Cancelar edição
            </button>
          ) : null}
          <button type="submit" className="is-primary" disabled={busy}>
            {editingId ? <Save size={15} /> : <Plus size={15} />}
            {busy ? "Salvando..." : editingId ? "Salvar alterações" : "Adicionar programa"}
          </button>
        </div>
      </form>

      <div className="radio-program-list">
        {loading ? (
          <p>Carregando programas...</p>
        ) : programs.length ? (
          programs.map((program) => (
            <article key={program.id} className="radio-program-card">
              <div className="radio-program-card__main">
                <div className="radio-program-card__title">
                  <strong>{program.title}</strong>
                  <span className={program.enabled ? "is-active" : ""}>
                    {program.enabled ? "Ativo" : "Oculto"}
                  </span>
                </div>
                <p>{program.description || "Sem descrição."}</p>
                <small>
                  {program.locutorName || "Locutor a definir"}
                  {" • "}
                  {program.daysLabel || "Dias a definir"}
                  {" • "}
                  {program.timeLabel || "Horário a definir"}
                </small>
              </div>

              <div className="radio-program-card__actions">
                <button type="button" onClick={() => editProgram(program)} disabled={busy}>
                  <Pencil size={14} />
                  Editar
                </button>
                <button type="button" className="is-danger" onClick={() => removeProgram(program)} disabled={busy}>
                  <Trash2 size={14} />
                  Excluir
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="radio-content-manager__empty">
            <Mic2 size={20} />
            <p>Nenhum programa cadastrado ainda.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function ScheduleManager() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyDay, setBusyDay] = useState(0);
  const [error, setError] = useState("");
  const [savedDay, setSavedDay] = useState(0);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setSchedule(await listRadioScheduleAdmin());
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Não foi possível carregar a grade.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function updateLocal(dayOfWeek, field, value) {
    setSchedule((current) => current.map((slot) => (
      slot.dayOfWeek === dayOfWeek ? { ...slot, [field]: value } : slot
    )));
  }

  async function saveSlot(slot) {
    try {
      setBusyDay(slot.dayOfWeek);
      setSavedDay(0);
      setError("");
      const updated = await updateRadioScheduleSlot(slot);
      setSchedule((current) => current.map((item) => (
        item.dayOfWeek === updated.dayOfWeek ? updated : item
      )));
      setSavedDay(slot.dayOfWeek);
      window.setTimeout(() => setSavedDay(0), 1800);
    } catch (requestError) {
      setError(requestError.message || "Não foi possível salvar a grade.");
    } finally {
      setBusyDay(0);
    }
  }

  return (
    <section className="radio-admin-panel radio-content-manager">
      <div className="radio-admin-panel-title">
        <CalendarDays size={18} />
        <h2>Grade de Locutores</h2>
      </div>

      <p className="radio-content-manager__intro">
        Defina quem apresenta a rádio em cada dia e o horário que será exibido no site.
      </p>

      {error ? <p className="radio-content-manager__error">{error}</p> : null}

      <div className="radio-schedule-editor">
        {loading ? (
          <p>Carregando grade...</p>
        ) : schedule.map((slot) => (
          <article key={slot.dayOfWeek} className="radio-schedule-editor__row">
            <div className="radio-schedule-editor__day">
              <CalendarDays size={15} />
              <strong>{slot.dayLabel}</strong>
            </div>

            <label>
              Locutor
              <input
                value={slot.locutorName}
                onChange={(event) => updateLocal(slot.dayOfWeek, "locutorName", event.target.value)}
                maxLength={80}
                placeholder="Locutor a definir"
              />
            </label>

            <label>
              Horário
              <span className="radio-program-form__input-with-icon">
                <Clock3 size={14} />
                <input
                  value={slot.timeLabel}
                  onChange={(event) => updateLocal(slot.dayOfWeek, "timeLabel", event.target.value)}
                  maxLength={80}
                  placeholder="Horário a definir"
                />
              </span>
            </label>

            <label className="radio-schedule-editor__toggle">
              <input
                type="checkbox"
                checked={slot.enabled}
                onChange={(event) => updateLocal(slot.dayOfWeek, "enabled", event.target.checked)}
              />
              <span>Exibir</span>
            </label>

            <button
              type="button"
              className="radio-schedule-editor__save"
              onClick={() => saveSlot(slot)}
              disabled={busyDay === slot.dayOfWeek}
            >
              {savedDay === slot.dayOfWeek ? <Check size={15} /> : <Save size={15} />}
              {busyDay === slot.dayOfWeek ? "Salvando..." : savedDay === slot.dayOfWeek ? "Salvo" : "Salvar"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function RadioContentManager({ mode }) {
  return mode === "schedule" ? <ScheduleManager /> : <ProgramManager />;
}
