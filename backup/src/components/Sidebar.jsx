import { BarChart3, Boxes, CircleDollarSign, LayoutDashboard, UsersRound, X } from 'lucide-react'

const items = [
  [LayoutDashboard, 'Visão geral'],
  [BarChart3, 'Vendas'],
  [Boxes, 'Estoque'],
  [UsersRound, 'Clientes'],
  [CircleDollarSign, 'Financeiro'],
]

export default function Sidebar({ active, onChange, open, onClose }) {
  return (
    <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
      <div className="brand-row">
        <button className="brand" onClick={() => onChange('Visão geral')} aria-label="WinkBI — ir para visão geral">
          <span className="brand-logo-frame"><img src="/winkbi-logo.svg" alt="" /></span>
          <span className="brand-name">WinkBI</span>
        </button>
        <button className="mobile-close" onClick={onClose} aria-label="Fechar menu"><X size={20} /></button>
      </div>
      <p className="brand-copy">Organize hoje.<br />Venda melhor amanhã.</p>
      <nav aria-label="Navegação principal">
        {items.map(([Icon, label]) => (
          <button key={label} className={active === label ? 'nav-item active' : 'nav-item'} onClick={() => { onChange(label); onClose() }}>
            <Icon size={20} strokeWidth={1.8} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="avatar">BR</div>
        <div><strong>Bianca Rocha</strong><small>Revendedora independente</small></div>
      </div>
    </aside>
  )
}
