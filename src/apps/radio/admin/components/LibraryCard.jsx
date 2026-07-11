import { memo } from "react";
import { Library } from "lucide-react";

import { formatBytes } from "../adminFormatters";

function LibraryCard({ library }) {
  return (
    <section className="radio-admin-panel">
      <div className="radio-admin-panel-title">
        <Library size={18} />
        <h2>Biblioteca</h2>
      </div>
      <div className="radio-admin-list">
        <span>Total de musicas <strong>{library?.totalTracks || 0}</strong></span>
        <span>Artistas <strong>{library?.artists || 0}</strong></span>
        <span>Albuns <strong>{library?.albums || 0}</strong></span>
        <span>Generos <strong>{library?.genres || 0}</strong></span>
        <span>Tamanho <strong>{formatBytes(library?.size)}</strong></span>
        <span>Atualizacao <strong>{library?.updatedAt ? new Date(library.updatedAt).toLocaleString("pt-BR") : "N/A"}</strong></span>
      </div>
    </section>
  );
}

export default memo(LibraryCard);
