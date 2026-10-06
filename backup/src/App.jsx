import { useState } from 'react'
import { Bell, Menu, Plus, Search } from 'lucide-react'
import NewSaleModal from './components/NewSaleModal'
import Sidebar from './components/Sidebar'
import useLocalStorage from './hooks/useLocalStorage'
import CustomersPage from './pages/CustomersPage'
import DashboardPage from './pages/DashboardPage'
import FinancePage from './pages/FinancePage'
import ProductsPage from './pages/ProductsPage'
import SalesPage from './pages/SalesPage'
import { STORAGE_KEYS } from './data'

const todayLabel = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(new Date())

export default function App() {
  const [active, setActive] = useState('Visão geral')
  const [brand, setBrand] = useState('Todas as marcas')
  const [menuOpen, setMenuOpen] = useState(false)
  const [saleModalOpen, setSaleModalOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [products, setProducts] = useLocalStorage(STORAGE_KEYS.products, [])
  const [customers, setCustomers] = useLocalStorage(STORAGE_KEYS.customers, [])
  const [sales, setSales] = useLocalStorage(STORAGE_KEYS.sales, [])
  const [expenses, setExpenses] = useLocalStorage(STORAGE_KEYS.expenses, [])

  const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')
  const searchedSales = normalizedQuery ? sales.filter((item) => `${item.customerName} ${item.productName} ${item.brand}`.toLocaleLowerCase('pt-BR').includes(normalizedQuery)) : sales
  const searchedProducts = normalizedQuery ? products.filter((item) => `${item.name} ${item.brand} ${item.category}`.toLocaleLowerCase('pt-BR').includes(normalizedQuery)) : products
  const searchedCustomers = normalizedQuery ? customers.filter((item) => `${item.name} ${item.phone} ${item.email}`.toLocaleLowerCase('pt-BR').includes(normalizedQuery)) : customers

  function saveSale(sale) {
    setSales((current) => [sale, ...current])
    setProducts((current) => current.map((product) => product.id === sale.productId ? { ...product, stock: Math.max(0, Number(product.stock) - sale.quantity) } : product))
  }

  function markPaid(id) {
    setSales((current) => current.map((sale) => sale.id === id ? { ...sale, status: 'Pago', dueDate: '' } : sale))
  }

  function navigate(section) {
    setActive(section); setQuery('')
  }

  return (
    <div className="app-shell">
      <Sidebar active={active} onChange={navigate} open={menuOpen} onClose={() => setMenuOpen(false)} />
      {menuOpen && <button className="scrim" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}
      <main>
        <header className="topbar">
          <button className="mobile-menu" aria-label="Abrir menu" onClick={() => setMenuOpen(true)}><Menu /></button>
          <div className="greeting"><h1>{active === 'Visão geral' ? 'Olá, Bianca' : active}</h1><p>{todayLabel}</p></div>
          <label className="search"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente, produto ou venda..." aria-label="Buscar" /></label>
          <div className="notification-wrap">
            <button className="notification" aria-label="Notificações" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((value) => !value)}><Bell size={21} /></button>
            {notificationsOpen && <div className="notification-popover"><strong>Notificações</strong><p>Nenhuma notificação no momento.</p></div>}
          </div>
          <div className="top-avatar">BI</div>
        </header>
        <div className="page-content">
          {active === 'Visão geral' && <DashboardPage brand={brand} setBrand={setBrand} sales={searchedSales} products={searchedProducts} onNewSale={() => setSaleModalOpen(true)} onNavigate={navigate} />}
          {active === 'Vendas' && <SalesPage sales={searchedSales} onNewSale={() => setSaleModalOpen(true)} onMarkPaid={markPaid} />}
          {active === 'Estoque' && <ProductsPage products={searchedProducts} setProducts={setProducts} />}
          {active === 'Clientes' && <CustomersPage customers={searchedCustomers} setCustomers={setCustomers} sales={sales} />}
          {active === 'Financeiro' && <FinancePage sales={searchedSales} expenses={expenses} setExpenses={setExpenses} onMarkPaid={markPaid} />}
        </div>
        <button className="floating-action" onClick={() => setSaleModalOpen(true)}><Plus size={21} />Nova venda</button>
      </main>
      <NewSaleModal open={saleModalOpen} onClose={() => setSaleModalOpen(false)} onSave={saveSale} products={products} customers={customers} />
    </div>
  )
}
