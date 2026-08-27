const labels = [
  ["icecast", "Icecast"],
  ["ffmpeg", "FFmpeg"],
  ["stream", "Stream"],
  ["library", "Library"],
  ["watcher", "Watcher"],
  ["metadata", "Metadata"],
  ["cover", "Cover Engine"],
  ["player", "Player"],
  ["autodj", "AutoDJ"],
  ["scheduler", "Scheduler"],
  ["playlist", "Playlist"],
  ["queue", "Queue"],
  ["api", "API"],
  ["nowPlaying", "Now Playing"],
  ["storage", "Storage"],
  ["cache", "Cache"],
  ["events", "Events"],
  ["players", "Players"],
];

export class HealthReporter {
  format(report) {
    const lines = [
      "==================================================",
      "RADIO HEALTH",
      "==================================================",
      "",
    ];

    labels.forEach(([key, label]) => {
      const status = report.modules?.[key]?.status || "N/A";
      lines.push(`${label.padEnd(25, ".")} ${status}`);
    });

    lines.push("");
    lines.push("==================================================");
    lines.push("Status:");
    lines.push(report.status);
    lines.push("==================================================");
    return lines.join("\n");
  }
}
