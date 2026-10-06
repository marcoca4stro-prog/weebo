import { useMemo, useState, useEffect } from 'react'
import {
  Bell,
  Check,
  ChevronDown,
  Clock,
  Menu,
  Plus,
  Search,
  Smartphone,
  X
} from 'lucide-react'
import Modal from './components/Modal'
import NewSaleModal from './components/NewSaleModal'
import Sidebar from './components/Sidebar'
import useLocalStorage from './hooks/useLocalStorage'
import CustomersPage from './pages/CustomersPage'
import DashboardPage from './pages/DashboardPage'
import FinancePage from './pages/FinancePage'
import ProductsPage from './pages/ProductsPage'
import SalesPage from './pages/SalesPage'
import SettingsPage from './pages/SettingsPage'
import { STORAGE_KEYS, formatCurrency, formatDate } from './data'
import { playNotificationChime } from './utils/audio'

const rawDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(new Date())
const todayLabel = rawDate.charAt(0).toUpperCase() + rawDate.slice(1)

export default function App() {
  const [active, setActive] = useState('Visão geral')
  const [brand, setBrand] = useState('Todas as marcas')
  const [theme, setTheme] = useState('pink')
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [saleModalOpen, setSaleModalOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [iosBannerDismissed, setIosBannerDismissed] = useState(false)
  const [customPushNotification, setCustomPushNotification] = useState(null)
  const [showIosPwaTip, setShowIosPwaTip] = useState(false)
  const [query, setQuery] = useState('')

  const [products, setProducts] = useLocalStorage(STORAGE_KEYS.products, [])
  const [customers, setCustomers] = useLocalStorage(STORAGE_KEYS.customers, [])
  const [sales, setSales] = useLocalStorage(STORAGE_KEYS.sales, [])
  const [expenses, setExpenses] = useLocalStorage(STORAGE_KEYS.expenses, [])

  // Configurações personalizadas
  const [darkMode, setDarkMode] = useLocalStorage('weebo:dark_mode', false)
  const [userAvatar, setUserAvatar] = useLocalStorage('weebo:user_avatar', '/bianca.png')
  const [allowOutOfStock, setAllowOutOfStock] = useLocalStorage('weebo:allow_out_of_stock', false)
  const [notificationLeadTime, setNotificationLeadTime] = useLocalStorage('weebo:notif_lead_time', '1_day')

  function handleBrandChange(selected) {
    setBrand(selected)
    const normalized = selected
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()

    if (normalized.includes('boticario')) {
      setTheme('green')
    } else if (normalized.includes('wepink')) {
      setTheme('pink')
    }
  }

  const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')
  const searchedSales = normalizedQuery ? sales.filter((item) => `${item.customerName} ${item.productName} ${item.brand}`.toLocaleLowerCase('pt-BR').includes(normalizedQuery)) : sales
  const searchedProducts = normalizedQuery ? products.filter((item) => `${item.name} ${item.brand} ${item.category}`.toLocaleLowerCase('pt-BR').includes(normalizedQuery)) : products
  const searchedCustomers = normalizedQuery ? customers.filter((item) => `${item.name} ${item.phone} ${item.email}`.toLocaleLowerCase('pt-BR').includes(normalizedQuery)) : customers

  // Cálculo de pagamentos a receber próximos do vencimento
  const upcomingReceivables = useMemo(() => {
    const now = new Date()
    // Define hoje às 00:00 para comparação precisa de datas
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    return sales
      .filter((item) => item.status === 'A receber' && item.dueDate)
      .map((sale) => {
        const parts = sale.dueDate.split('-').map(Number)
        if (parts.length !== 3) return null
        const dueObj = new Date(parts[0], parts[1] - 1, parts[2])
        const diffMs = dueObj.getTime() - today.getTime()
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

        let isDueSoon = false
        let label = ''

        if (diffDays < 0) {
          isDueSoon = true
          label = `Vencido há ${Math.abs(diffDays)} dia(s)`
        } else if (diffDays === 0) {
          isDueSoon = true
          label = 'Vence hoje!'
        } else if (notificationLeadTime === '1_hour') {
          // Para antecedência de 1 hora, avisa itens de hoje
          if (diffDays <= 0) {
            isDueSoon = true
            label = 'Vence hoje!'
          }
        } else if (notificationLeadTime === '1_day') {
          if (diffDays <= 1) {
            isDueSoon = true
            label = diffDays === 1 ? 'Vence amanhã' : 'Vence hoje!'
          }
        } else if (notificationLeadTime === '1_week') {
          if (diffDays <= 7) {
            isDueSoon = true
            label = diffDays === 1 ? 'Vence amanhã' : `Vence em ${diffDays} dias`
          }
        }

        return isDueSoon ? { ...sale, diffDays, label } : null
      })
      .filter(Boolean)
      .sort((a, b) => a.diffDays - b.diffDays)
  }, [sales, notificationLeadTime])

  // Disparo de notificação para iPhone / Web Notification
  function triggerIPhoneNotificationPermission() {
    playNotificationChime()
    const msg = upcomingReceivables.length > 0
      ? `Você tem ${upcomingReceivables.length} pagamento(s) próximo(s) do vencimento!`
      : 'Alertas sonoros e visuais ativados com sucesso para o seu iPhone!'

    setCustomPushNotification({
      title: 'Weebo • Alerta no iPhone',
      body: msg
    })

    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification('Weebo Cosméticos', {
            body: msg,
            icon: '/logo.png'
          })
        }
      })
    }

    // Se estiver no iPhone e não estiver em modo PWA, exibe a dica para adicionar à tela de início
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches
    if (isIos && !isStandalone) {
      setTimeout(() => setShowIosPwaTip(true), 800)
    }
  }

  function saveSale(payload) {
    const sale = payload?.sale || payload
    const newProduct = payload?.newProduct
    const newCustomer = payload?.newCustomer

    if (newCustomer) {
      setCustomers((current) => [newCustomer, ...current.filter((c) => c.id !== newCustomer.id)])
    }

    if (newProduct) {
      // Produto adicionado via lançamento de venda entra no estoque ZERADO (0)
      setProducts((current) => [newProduct, ...current.filter((p) => p.id !== newProduct.id)])
    } else if (sale.productId) {
      setProducts((current) => current.map((product) => product.id === sale.productId ? {
        ...product,
        // Ao realizar venda, o estoque reduz ou permanece zerado (0)
        stock: Math.max(0, Number(product.stock) - sale.quantity)
      } : product))
    }

    setSales((current) => [sale, ...current])
  }

  function markPaid(id) {
    setSales((current) => current.map((sale) => sale.id === id ? { ...sale, status: 'Pago', dueDate: '' } : sale))
  }

  function navigate(section) {
    setActive(section); setQuery(''); setNotificationsOpen(false)
  }

  return (
    <div
      className={`app-shell theme-${theme} ${collapsed ? 'sidebar--collapsed' : ''} ${darkMode ? 'dark-mode' : ''}`}
      data-theme={theme}
      data-mode={darkMode ? 'dark' : 'light'}
    >
      {/* Banner de Notificação Estilo iOS para iPhone */}
      {(customPushNotification || (!iosBannerDismissed && upcomingReceivables.length > 0)) && (
        <aside className="ios-push-banner" role="alert" aria-live="polite">
          <div className="ios-push-icon">
            <img src="/logo.png" alt="" />
          </div>
          <div
            className="ios-push-body"
            onClick={() => {
              setNotificationsOpen(true)
              setCustomPushNotification(null)
            }}
          >
            <div className="ios-push-header">
              <span>WEEBO</span>
              <small>AGORA</small>
            </div>
            <strong>
              {customPushNotification ? customPushNotification.title : 'Pagamento próximo do vencimento'}
            </strong>
            <p>
              {customPushNotification
                ? customPushNotification.body
                : upcomingReceivables.length === 1
                ? `${upcomingReceivables[0].customerName}: ${formatCurrency(upcomingReceivables[0].total)} (${upcomingReceivables[0].label})`
                : `Você tem ${upcomingReceivables.length} pagamentos a receber próximos do vencimento.`}
            </p>
          </div>
          <button
            type="button"
            className="ios-push-close"
            onClick={() => {
              setCustomPushNotification(null)
              setIosBannerDismissed(true)
            }}
            aria-label="Dispensar aviso"
          >
            <X size={15} />
          </button>
        </aside>
      )}

      <Sidebar
        active={active}
        onChange={navigate}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        userAvatar={userAvatar}
      />
      {menuOpen && <button className="scrim" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}
      <main>
        <header className="topbar">
          <button className="mobile-menu" aria-label="Abrir menu" onClick={() => setMenuOpen(true)}><Menu /></button>
          <div className="greeting">
            <h1>{active === 'Visão geral' ? 'Olá, Bianca Alves' : active}</h1>
            <p>{todayLabel}</p>
          </div>

          <label className="search">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente, produto ou venda..." aria-label="Buscar" />
          </label>

          <div className="notification-wrap">
            <button
              className={`notification ${upcomingReceivables.length > 0 ? 'has-notifications' : ''}`}
              aria-label="Notificações"
              aria-expanded={notificationsOpen}
              onClick={() => setNotificationsOpen((value) => !value)}
            >
              <Bell size={20} />
              {upcomingReceivables.length > 0 && (
                <span className="notification-count">{upcomingReceivables.length}</span>
              )}
            </button>

            {notificationsOpen && (
              <div className="notification-popover">
                <div className="notif-popover-header">
                  <div>
                    <strong>Pagamentos a Receber</strong>
                    <small>Avisos de vencimento</small>
                  </div>
                  <button className="notif-close-btn" onClick={() => setNotificationsOpen(false)}>
                    <X size={16} />
                  </button>
                </div>

                {/* Seletor de Antecedência no próprio popover */}
                <div className="notif-lead-selector">
                  <span>Avisar com antecedência de:</span>
                  <div className="lead-pills">
                    {[
                      { id: '1_hour', label: '1 hora' },
                      { id: '1_day', label: '1 dia' },
                      { id: '1_week', label: '1 semana' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`lead-pill ${notificationLeadTime === opt.id ? 'active' : ''}`}
                        onClick={() => setNotificationLeadTime(opt.id)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lista de Pagamentos Próximos */}
                <div className="notif-list">
                  {upcomingReceivables.length === 0 ? (
                    <div className="notif-empty">
                      <Clock size={20} />
                      <p>Nenhum pagamento a receber próximo para o prazo selecionado.</p>
                    </div>
                  ) : (
                    upcomingReceivables.map((sale) => (
                      <div className="notif-item" key={sale.id}>
                        <div className="notif-item-info">
                          <strong>{sale.customerName}</strong>
                          <span className="notif-item-due">{sale.label} ({formatDate(sale.dueDate)})</span>
                          <b>{formatCurrency(sale.total)}</b>
                        </div>
                        <button
                          type="button"
                          className="primary notif-pay-btn"
                          onClick={() => markPaid(sale.id)}
                          title="Marcar como pago"
                        >
                          Receber
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Botão de integração com iPhone */}
                <div className="notif-popover-footer">
                  <button
                    type="button"
                    className="iphone-notif-link"
                    onClick={triggerIPhoneNotificationPermission}
                  >
                    <Smartphone size={14} />
                    <span>Ativar alertas no iPhone</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="top-user-menu" onClick={() => navigate('Configuração')} title="Ir para Configurações">
            <div className="top-avatar">
              <img src={userAvatar || '/bianca.png'} alt="Bianca Alves" />
            </div>
            <ChevronDown size={14} className="user-chevron" />
          </div>
        </header>

        <div className="page-content">
          {active === 'Visão geral' && (
            <DashboardPage
              brand={brand}
              setBrand={handleBrandChange}
              sales={searchedSales}
              products={searchedProducts}
              onNewSale={() => setSaleModalOpen(true)}
              onNavigate={navigate}
              todayLabel={todayLabel}
            />
          )}
          {(active === 'Vendas' || active === 'Vendas e Lançamentos') && (
            <SalesPage
              sales={searchedSales}
              onNewSale={() => setSaleModalOpen(true)}
              onMarkPaid={markPaid}
            />
          )}
          {active === 'Estoque' && <ProductsPage products={searchedProducts} setProducts={setProducts} />}
          {active === 'Clientes' && <CustomersPage customers={searchedCustomers} setCustomers={setCustomers} sales={sales} />}
          {active === 'Financeiro' && <FinancePage sales={searchedSales} expenses={expenses} setExpenses={setExpenses} onMarkPaid={markPaid} />}
          {active === 'Configuração' && (
            <SettingsPage
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              userAvatar={userAvatar}
              setUserAvatar={setUserAvatar}
              allowOutOfStock={allowOutOfStock}
              setAllowOutOfStock={setAllowOutOfStock}
              notificationLeadTime={notificationLeadTime}
              setNotificationLeadTime={setNotificationLeadTime}
              onTestNotification={triggerIPhoneNotificationPermission}
            />
          )}
        </div>
        <button className="floating-action" onClick={() => setSaleModalOpen(true)}>
          <Plus size={21} />Novo lançamento
        </button>
      </main>
      <NewSaleModal
        open={saleModalOpen}
        onClose={() => setSaleModalOpen(false)}
        onSave={saveSale}
        products={products}
        customers={customers}
        allowOutOfStock={allowOutOfStock}
      />

      {/* Dica para iPhone PWA (Receber notificações com Safari fechado) */}
      {showIosPwaTip && (
        <Modal
          open={showIosPwaTip}
          title="Notificações no iPhone"
          description="Como receber alertas sonoros mesmo com a tela bloqueada."
          onClose={() => setShowIosPwaTip(false)}
        >
          <div className="ios-pwa-sheet">
            <div className="ios-pwa-steps">
              <div className="ios-step">
                <span className="ios-step-num">1</span>
                <div>No Safari do iPhone, toque no botão <b>Compartilhar</b> (ícone no rodapé com um quadrado e uma seta para cima).</div>
              </div>
              <div className="ios-step">
                <span className="ios-step-num">2</span>
                <div>Role a lista para baixo e toque em <b>Adicionar à Tela de Início</b>.</div>
              </div>
              <div className="ios-step">
                <span className="ios-step-num">3</span>
                <div>Toque em <b>Adicionar</b> no canto superior direito.</div>
              </div>
            </div>
            <p style={{ margin: '0', fontSize: '12px', color: 'var(--muted)', textAlign: 'center' }}>
              ✓ Os alertas sonoros e o banner no topo da tela já estão 100% ativos!
            </p>
            <div className="modal-actions">
              <button type="button" className="primary" onClick={() => setShowIosPwaTip(false)}>
                Entendi, continuar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
