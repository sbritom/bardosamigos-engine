import { Image as ImageIcon } from 'lucide-react'
import { formatBytes } from '../../../image-tools'

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

export default function StorageHistory({ items }) {
  return (
    <section className="bds-storage-history" aria-labelledby="storage-history-title">
      <header>
        <h4 id="storage-history-title">Histórico desta sessão</h4>
        <span>{items.length}</span>
      </header>
      {items.length === 0 ? (
        <p>Nenhuma imagem hospedada nesta sessão.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              {item.publicUrl ? <img alt="" src={item.publicUrl} /> : <ImageIcon size={20} aria-hidden="true" />}
              <span><strong title={item.originalName || item.name}>{item.originalName || item.name}</strong><small>{formatDate(item.createdAt)} · {formatBytes(item.size)}</small></span>
              <em className={item.status === 'deleted' ? 'is-deleted' : ''}>{item.status === 'deleted' ? 'Excluído' : 'Concluído'}</em>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

