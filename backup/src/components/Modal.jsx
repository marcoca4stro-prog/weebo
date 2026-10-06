import { X } from 'lucide-react'

export default function Modal({ open, title, description, onClose, children }) {
  if (!open) return null
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-heading">
          <div><h2 id="modal-title">{title}</h2>{description && <p>{description}</p>}</div>
          <button type="button" onClick={onClose} aria-label="Fechar"><X size={21} /></button>
        </div>
        {children}
      </section>
    </div>
  )
}
