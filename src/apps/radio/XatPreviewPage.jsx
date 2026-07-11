import { useCallback, useEffect, useState } from "react";

import Loading from "./components/Loading";
import MiniPlayerWidget from "./widgets/MiniPlayerWidget";
import NowPlayingWidget from "./widgets/NowPlayingWidget";
import StatusWidget from "./widgets/StatusWidget";
import { loadXatWidgetData } from "./widgets/xatApi";
import "./xatWidget.css";

const INITIAL_DATA = {
  nowPlaying: null,
  status: { status: "offline" },
  stream: null,
  widget: null,
  hasError: false,
};

export default function XatPreviewPage() {
  const [data, setData] = useState(INITIAL_DATA);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (signal) => {
    try {
      setData(await loadXatWidgetData({ signal }));
    } catch {
      setData((current) => ({ ...current, hasError: true }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    const intervalId = window.setInterval(() => refresh(controller.signal), 5000);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [refresh]);

  const track = data.widget?.track || data.nowPlaying;
  const radioHtml5 = data.stream?.radioHtml5 || "[radiohtml5:HOST:PORT:MOUNT]";

  return (
    <main className="bar-radio-page bar-xat-page">
      <header className="bar-xat-header">
        <span>Integracao xat</span>
        <h1>Mini Widget Radio Bar dos Amigos</h1>
      </header>

      {loading ? (
        <Loading label="Carregando integracao xat" />
      ) : (
        <div className="bar-xat-grid">
          <div className="bar-xat-preview">
            <MiniPlayerWidget track={track} status={data.widget?.status || data.status} stream={data.stream} />
          </div>

          <section className="bar-radio-card bar-xat-code">
            <div className="bar-radio-card-title">
              <h3>Codigo radiohtml5</h3>
            </div>
            <code>{radioHtml5}</code>
            {data.hasError && <p>API offline ou parcialmente indisponivel. Preview em modo seguro.</p>}
          </section>

          <StatusWidget status={data.widget?.status || data.status} />
          <NowPlayingWidget track={track} />
        </div>
      )}
    </main>
  );
}
