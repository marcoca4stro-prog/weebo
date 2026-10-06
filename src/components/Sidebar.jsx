import {
  BarChart3,
  CircleDollarSign,
  Crown,
  LayoutGrid,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  User,
  X
} from 'lucide-react'

const items = [
  [LayoutGrid, 'Visão geral'],
  [BarChart3, 'Lançamentos'],
  [Package, 'Estoque'],
  [User, 'Clientes'],
  [CircleDollarSign, 'Financeiro'],
  [Settings, 'Configuração'],
]

export default function Sidebar({ active, onChange, open, onClose, collapsed, onToggleCollapse, userAvatar }) {
  return (
    <aside className={`sidebar ${open ? 'sidebar--open' : ''} ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="brand-row">
        <button className="brand" onClick={() => onChange('Visão geral')} aria-label="Weebo Cosméticos — ir para visão geral">
          <span className="brand-logo-frame">
            <img src="/logo.png" alt="Weebo Cosméticos" />
          </span>
        </button>
        <button
          className="collapse-toggle"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          title={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
        <button className="mobile-close" onClick={onClose} aria-label="Fechar menu">
          <X size={20} />
        </button>
      </div>

      {!collapsed && (
        <p className="brand-copy">
          Organize hoje.<br />
          Venda melhor amanhã.
        </p>
      )}

      <nav aria-label="Navegação principal">
        {items.map(([Icon, label]) => {
          const isItemActive =
            active === label ||
            (label === 'Lançamentos' &&
              (active === 'Lançamentos' || active === 'Vendas' || active === 'Vendas e Lançamentos'))
          return (
            <button
              key={label}
              className={isItemActive ? 'nav-item active' : 'nav-item'}
              onClick={() => { onChange(label); onClose() }}
              title={collapsed ? label : undefined}
            >
              <Icon size={20} strokeWidth={1.8} className="nav-icon" />
              {!collapsed && <span>{label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Cartão motivacional com elementos botânicos decorativos */}
      {!collapsed && (
        <div className="sidebar-promo-container">
          <div className="sidebar-botanical-art" aria-hidden="true">
            <svg viewBox="0 0 220 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="botanical-svg">
              <path
                d="M10 130 C40 80, 140 100, 200 170 C160 210, 40 210, 10 180 Z"
                fill="url(#blushGrad)"
                opacity="0.8"
              />
              <path
                d="M-15 110 C15 90, 65 115, 75 135 C50 145, 10 140, -15 110 Z"
                fill="#5ba878"
                opacity="0.9"
              />
              <path
                d="M-15 110 Q35 125 75 135"
                stroke="#3f8457"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M-20 155 C10 135, 55 160, 60 185 C35 190, -5 180, -20 155 Z"
                fill="#4b9766"
                opacity="0.92"
              />
              <path
                d="M115 195 C145 155, 190 140, 215 135 C205 165, 165 195, 115 195 Z"
                fill="#4a9c67"
                opacity="0.95"
              />
              <path
                d="M115 195 Q170 165 215 135"
                stroke="#347c4e"
                strokeWidth="1.5"
                fill="none"
              />
              <defs>
                <linearGradient id="blushGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fbcfe8" />
                  <stop offset="1%" stopColor="#f472b6" stopOpacity="0.35" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="sidebar-promo-card">
            <div className="promo-crown">
              <Crown size={22} strokeWidth={2.4} />
            </div>
            <p className="promo-text">
              O sucesso<br />
              da sua marca<br />
              começa com<br />
              organização.
            </p>
            <div className="promo-divider" />
          </div>
        </div>
      )}

      {/* Rodapé com a foto de Bianca Alves */}
      <div className="sidebar-footer">
        <div className="avatar">
          <img src={userAvatar || '/bianca.png'} alt="Bianca Alves" />
        </div>
        {!collapsed && (
          <div className="user-info">
            <strong>Bianca Alves</strong>
            <small>Revendedora independente</small>
          </div>
        )}
      </div>
    </aside>
  )
}
