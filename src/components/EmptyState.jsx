export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction, compact = false }) {
  return (
    <div className={`empty-state ${compact ? 'empty-state--compact' : ''}`}>
      <span><Icon size={24} strokeWidth={1.7} /></span>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && <button className="primary" onClick={onAction}>{actionLabel}</button>}
    </div>
  )
}
