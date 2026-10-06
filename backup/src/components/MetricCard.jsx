export default function MetricCard({ icon: Icon, label, value, note, tone = 'green' }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon ${tone}`}><Icon size={21} strokeWidth={1.8} /></div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </article>
  )
}
