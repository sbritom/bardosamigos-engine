const days = ["Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado", "Domingo"];

export default function RadioScheduleGrid({ schedule }) {
  return (
    <div className="bar-radio-grid">
      {days.map((day) => (
        <article className="bar-radio-card" key={day}>
          <small>{day}</small>
          {(schedule.filter((item) => item.day === day).length ? schedule.filter((item) => item.day === day) : [{ id: `${day}-empty`, start: "--:--", title: "Livre" }]).map((item) => (
            <div className="bar-radio-row" key={item.id} style={{ justifyContent: "space-between", marginTop: 10 }}>
              <span>{item.start}</span>
              <strong style={{ fontSize: 15 }}>{item.title}</strong>
            </div>
          ))}
        </article>
      ))}
    </div>
  );
}
