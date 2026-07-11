import { memo, useState } from "react";
import { FileText } from "lucide-react";

function LogsCard({ logs }) {
  const files = logs?.files || {};
  const names = Object.keys(files);
  const [selected, setSelected] = useState("deploy.log");
  const current = files[selected] || files[names[0]] || { lines: [] };

  return (
    <section className="radio-admin-panel radio-admin-logs">
      <div className="radio-admin-panel-title">
        <FileText size={18} />
        <h2>Logs</h2>
      </div>
      <div className="radio-admin-log-tabs">
        {names.map((name) => (
          <button type="button" key={name} onClick={() => setSelected(name)} className={selected === name ? "is-active" : ""}>
            {name}
          </button>
        ))}
      </div>
      <pre>{current.lines?.join("\n") || "Log vazio ou indisponivel."}</pre>
    </section>
  );
}

export default memo(LogsCard);
