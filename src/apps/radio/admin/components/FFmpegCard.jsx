import { memo } from "react";
import { TerminalSquare } from "lucide-react";

import { formatDuration } from "../adminFormatters";

function FFmpegCard({ ffmpeg }) {
  return (
    <section className="radio-admin-panel">
      <div className="radio-admin-panel-title">
        <TerminalSquare size={18} />
        <h2>FFmpeg</h2>
      </div>
      <div className="radio-admin-list">
        <span>Status <strong>{ffmpeg?.running ? "RUNNING" : "OFFLINE"}</strong></span>
        <span>PID <strong>{ffmpeg?.pid || "N/A"}</strong></span>
        <span>Tempo <strong>{formatDuration(ffmpeg?.uptimeSeconds)}</strong></span>
        <span>Ultimo erro <strong>{ffmpeg?.lastError || "Nenhum"}</strong></span>
      </div>
    </section>
  );
}

export default memo(FFmpegCard);
