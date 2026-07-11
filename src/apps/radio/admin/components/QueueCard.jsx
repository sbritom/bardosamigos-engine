import { memo, useMemo, useState, useCallback } from "react";
import { ListMusic } from "lucide-react";

function QueueCard({ queue }) {
  const initialItems = useMemo(() => [...(queue?.playlistQueue || []), ...(queue?.audioQueue || [])], [queue]);
  const [localItems, setLocalItems] = useState([]);
  const items = localItems.length ? localItems : initialItems;

  const clearLocal = useCallback(() => setLocalItems([]), []);
  const removeLocal = useCallback((id) => setLocalItems((current) => (current.length ? current : initialItems).filter((item) => item.id !== id)), [initialItems]);
  const moveUp = useCallback((index) => {
    setLocalItems((current) => {
      const next = [...(current.length ? current : initialItems)];
      if (index <= 0) return next;
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, [initialItems]);

  return (
    <section className="radio-admin-panel">
      <div className="radio-admin-panel-title">
        <ListMusic size={18} />
        <h2>Queue</h2>
      </div>
      <div className="radio-admin-actions">
        <button type="button" onClick={clearLocal}>Limpar visualizacao</button>
      </div>
      <div className="radio-admin-tracks">
        {items.length ? items.slice(0, 8).map((item, index) => (
          <div className="radio-admin-track" key={item.id || item.track?.id || index}>
            <span>{item.track?.title || item.title || "Musica sem titulo"}</span>
            <small>{item.track?.artist || item.artist || "Artista N/A"}</small>
            <button type="button" onClick={() => moveUp(index)}>Subir</button>
            <button type="button" onClick={() => removeLocal(item.id)}>Remover</button>
          </div>
        )) : <p>Fila vazia.</p>}
      </div>
    </section>
  );
}

export default memo(QueueCard);
