import {
  CircleDollarSign,
  Plus,
  CreditCard,
  TrendingUp,
  Boxes,
  WalletCards,
  UsersRound,
  ShoppingBag,
  CalendarDays,
  Calendar
} from 'lucide-react'
import { useState, useMemo } from 'react'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import { formatCurrency, formatDate, makeId } from '../data'
import { ensureSaleInstallments } from '../utils/installments'

const initialForm = { description: '', date: new Date().toISOString().slice(0, 10), value: '' }

const monthNamesLong = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

function formatMonthLabel(ym) {
  if (!ym || ym === 'all') return 'Todos os meses'
  const parts = ym.split('-').map(Number)
  if (parts.length !== 2) return ym
  const [year, month] = parts
  const monthName = monthNamesLong[month - 1] || ''
  return `${monthName}/${year}`
}

export default function FinancePage({
  sales,
  allSales,
  customers = [],
  expenses,
  setExpenses,
  onMarkPaid,
  onOpenPayment
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialForm)

  const salesForCalc = allSales && allSales.length > 0 ? allSales : sales

  const now = new Date()
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const currentMonthName = monthNamesLong[now.getMonth()]

  // Faturamento acumulado do mês atual para o badge no topo da página
  const currentMonthRevenue = useMemo(() => {
    return salesForCalc
      .filter((s) => s.date && s.date.slice(0, 7) === currentYearMonth)
      .reduce((sum, s) => sum + (Number(s.total) || 0), 0)
  }, [salesForCalc, currentYearMonth])

  // Normalização e entradas para o extrato geral
  const normalizedSales = sales.map(ensureSaleInstallments)

  const entries = [
    ...normalizedSales.map((sale) => ({
      id: sale.id,
      date: sale.date,
      description: `Venda • ${sale.customerName} (${sale.productName})`,
      type: 'Receita',
      value: sale.total,
      paidAmount: sale.paidAmount,
      remainingAmount: sale.remainingAmount,
      status: sale.status,
      rawSale: sale
    })),
    ...expenses.map((item) => ({
      ...item,
      type: 'Despesa',
      status: 'Pago',
      paidAmount: item.value,
      remainingAmount: 0
    })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  // Totais gerais do fluxo de caixa
  const received = normalizedSales.reduce((sum, item) => sum + (item.paidAmount || 0), 0)
  const pending = normalizedSales.reduce((sum, item) => sum + (item.remainingAmount || 0), 0)
  const spent = expenses.reduce((sum, item) => sum + Number(item.value || 0), 0)

  // Custo dos produtos vendidos em uma venda
  function getSaleCost(sale) {
    if (sale.items && Array.isArray(sale.items) && sale.items.length > 0) {
      return sale.items.reduce((sum, item) => {
        const unitC = Number(item.unitCost) || 0
        const qty = Number(item.quantity) || 1
        return sum + (unitC * qty)
      }, 0)
    }
    return (Number(sale.unitCost) || 0) * (Number(sale.quantity) || 1)
  }

  // Descobrir o primeiro mês em que a cliente foi cadastrada ou fez a 1ª compra
  function getCustomerFirstMonth(customer) {
    if (customer.createdAt) return customer.createdAt.slice(0, 7)
    const clientSales = salesForCalc.filter(
      (s) => s.customerId === customer.id || s.customerName === customer.name
    )
    if (clientSales.length > 0) {
      const dates = clientSales.map((s) => s.date).filter(Boolean).sort()
      if (dates.length > 0) return dates[0].slice(0, 7)
    }
    return currentYearMonth
  }

  // Contagem de novas clientes por mês
  const customerMonthsMap = useMemo(() => {
    const map = {}
    customers.forEach((cust) => {
      const ym = getCustomerFirstMonth(cust)
      map[ym] = (map[ym] || 0) + 1
    })
    return map
  }, [customers, salesForCalc])

  // Lista única de todos os meses disponíveis (ordenados decrescente)
  const availableMonths = useMemo(() => {
    const set = new Set()
    set.add(currentYearMonth)
    salesForCalc.forEach((s) => {
      if (s.date) set.add(s.date.slice(0, 7))
    })
    expenses.forEach((e) => {
      if (e.date) set.add(e.date.slice(0, 7))
    })
    customers.forEach((c) => {
      const ym = getCustomerFirstMonth(c)
      if (ym) set.add(ym)
    })
    return Array.from(set).sort().reverse()
  }, [salesForCalc, expenses, customers, currentYearMonth])

  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth)

  // Mapa de métricas consolidadas mês a mês
  const monthlyDataMap = useMemo(() => {
    const map = {}
    availableMonths.forEach((ym) => {
      const monthSales = salesForCalc.filter((s) => s.date && s.date.slice(0, 7) === ym)
      const monthExpenses = expenses.filter((e) => e.date && e.date.slice(0, 7) === ym)

      const faturamento = monthSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0)
      const custoProdutos = monthSales.reduce((acc, s) => acc + getSaleCost(s), 0)
      const despesas = monthExpenses.reduce((acc, e) => acc + (Number(e.value) || 0), 0)
      const custoTotal = custoProdutos + despesas
      const lucroLiquido = faturamento - custoTotal
      const margemLucro = faturamento > 0 ? (lucroLiquido / faturamento) * 100 : 0
      const totalVendas = monthSales.length
      const ticketMedio = totalVendas > 0 ? faturamento / totalVendas : 0
      const novosClientes = customerMonthsMap[ym] || 0

      map[ym] = {
        ym,
        label: formatMonthLabel(ym),
        faturamento,
        custoProdutos,
        despesas,
        custoTotal,
        lucroLiquido,
        margemLucro,
        totalVendas,
        ticketMedio,
        novosClientes
      }
    })
    return map
  }, [availableMonths, salesForCalc, expenses, customerMonthsMap])

  // Estatísticas para os cards principais do topo do painel
  const selectedStats = useMemo(() => {
    if (selectedMonth === 'all') {
      const list = Object.values(monthlyDataMap)
      const totalFaturamento = list.reduce((acc, m) => acc + m.faturamento, 0)
      const totalCustoProdutos = list.reduce((acc, m) => acc + m.custoProdutos, 0)
      const totalDespesas = list.reduce((acc, m) => acc + m.despesas, 0)
      const totalCusto = totalCustoProdutos + totalDespesas
      const totalLucro = totalFaturamento - totalCusto
      const totalVendas = list.reduce((acc, m) => acc + m.totalVendas, 0)
      const totalNovosClientes = customers.length
      const margem = totalFaturamento > 0 ? (totalLucro / totalFaturamento) * 100 : 0
      const ticketMedio = totalVendas > 0 ? totalFaturamento / totalVendas : 0

      return {
        ym: 'all',
        label: 'Todo o Período (Consolidado)',
        faturamento: totalFaturamento,
        custoProdutos: totalCustoProdutos,
        despesas: totalDespesas,
        custoTotal: totalCusto,
        lucroLiquido: totalLucro,
        margemLucro: margem,
        totalVendas,
        ticketMedio,
        novosClientes: totalNovosClientes
      }
    }

    return monthlyDataMap[selectedMonth] || {
      ym: selectedMonth,
      label: formatMonthLabel(selectedMonth),
      faturamento: 0,
      custoProdutos: 0,
      despesas: 0,
      custoTotal: 0,
      lucroLiquido: 0,
      margemLucro: 0,
      totalVendas: 0,
      ticketMedio: 0,
      novosClientes: 0
    }
  }, [selectedMonth, monthlyDataMap, customers])

  function change(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function submit(event) {
    event.preventDefault()
    setExpenses((current) => [{ ...form, id: makeId(), value: Number(form.value) }, ...current])
    setForm(initialForm)
    setOpen(false)
  }

  return (
    <>
      <div className="section-header">
        <div>
          <h2>Financeiro</h2>
          <p>Entradas, parcelas recebidas, valores pendentes e despesas.</p>
        </div>

        {/* Badge do Faturamento Mensal da Empresa no cabeçalho substituindo o botão */}
        <div className="finance-header-revenue-badge" title="Faturamento total da empresa no mês atual">
          <div className="fhrb-header">
            <span className="fhrb-dot" />
            <span className="fhrb-label">Faturamento ({currentMonthName})</span>
          </div>
          <strong className="fhrb-value">{formatCurrency(currentMonthRevenue)}</strong>
        </div>
      </div>

      {/* Resumo do Fluxo de Caixa */}
      <section className="finance-summary">
        <article>
          <span>Recebido</span>
          <strong style={{ color: '#2ea86e' }}>{formatCurrency(received)}</strong>
        </article>
        <article>
          <span>A receber (pendente)</span>
          <strong style={{ color: '#f40675' }}>{formatCurrency(pending)}</strong>
        </article>
        <article>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Despesas</span>
            <button
              type="button"
              className="finance-add-expense-pill"
              onClick={() => setOpen(true)}
              title="Cadastrar nova despesa"
            >
              <Plus size={12} /> Despesa
            </button>
          </div>
          <strong>{formatCurrency(spent)}</strong>
        </article>
        <article>
          <span>Saldo em caixa</span>
          <strong>{formatCurrency(received - spent)}</strong>
        </article>
      </section>

      {/* NOVO CAMPO: Desempenho e Métricas Mensais (DRE Simplificado) */}
      <section className="panel monthly-analytics-panel">
        <div className="panel-heading monthly-analytics-header">
          <div>
            <div className="monthly-heading-badge">
              <CalendarDays size={15} />
              <span>DRE & Balanço Mensal</span>
            </div>
            <h2>Desempenho por Mês</h2>
            <p>Faturamento, lucro líquido, custos, novos clientes e total de vendas por mês.</p>
          </div>

          <div className="monthly-analytics-actions">
            <div className="month-picker-pill">
              <span className="month-picker-icon"><Calendar size={14} /></span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="month-picker-select"
                aria-label="Selecionar mês de análise"
              >
                <option value={currentYearMonth}>
                  {formatMonthLabel(currentYearMonth)} (Mês atual)
                </option>
                {availableMonths
                  .filter((ym) => ym !== currentYearMonth)
                  .map((ym) => (
                    <option key={ym} value={ym}>
                      {formatMonthLabel(ym)}
                    </option>
                  ))}
                <option value="all">Todo o período (Consolidado)</option>
              </select>
            </div>

            <button
              type="button"
              className="primary action-button monthly-add-expense-btn"
              onClick={() => setOpen(true)}
              title="Registrar nova despesa"
            >
              <Plus size={15} />
              <span>Nova despesa</span>
            </button>
          </div>
        </div>

        {/* 5 Cards de Métricas Principais do Mês Selecionado */}
        <div className="monthly-metrics-grid">
          <div className="monthly-metric-card highlight-revenue">
            <div className="mmc-top">
              <span className="mmc-title">Faturamento no Mês</span>
              <span className="mmc-icon"><TrendingUp size={18} /></span>
            </div>
            <strong className="mmc-value">{formatCurrency(selectedStats.faturamento)}</strong>
            <span className="mmc-sub">
              {selectedStats.totalVendas} {selectedStats.totalVendas === 1 ? 'venda realizada' : 'vendas realizadas'}
            </span>
          </div>

          <div className="monthly-metric-card highlight-costs">
            <div className="mmc-top">
              <span className="mmc-title">Custos no Mês</span>
              <span className="mmc-icon"><Boxes size={18} /></span>
            </div>
            <strong className="mmc-value">{formatCurrency(selectedStats.custoTotal)}</strong>
            <span className="mmc-sub">
              Produtos: {formatCurrency(selectedStats.custoProdutos)} • Despesas: {formatCurrency(selectedStats.despesas)}
            </span>
          </div>

          <div className="monthly-metric-card highlight-profit">
            <div className="mmc-top">
              <span className="mmc-title">Lucro Líquido</span>
              <span className="mmc-icon"><WalletCards size={18} /></span>
            </div>
            <strong className={`mmc-value ${selectedStats.lucroLiquido >= 0 ? 'profit-positive' : 'profit-negative'}`}>
              {formatCurrency(selectedStats.lucroLiquido)}
            </strong>
            <span className="mmc-sub">
              <span className="mmc-tag-pill">
                Margem: {selectedStats.margemLucro.toFixed(1)}%
              </span>
            </span>
          </div>

          <div className="monthly-metric-card highlight-customers">
            <div className="mmc-top">
              <span className="mmc-title">Novos Clientes</span>
              <span className="mmc-icon"><UsersRound size={18} /></span>
            </div>
            <strong className="mmc-value">
              {selectedStats.novosClientes} {selectedStats.novosClientes === 1 ? 'cliente' : 'clientes'}
            </strong>
            <span className="mmc-sub">
              Conquistados neste período
            </span>
          </div>

          <div className="monthly-metric-card highlight-orders">
            <div className="mmc-top">
              <span className="mmc-title">Total de Vendas</span>
              <span className="mmc-icon"><ShoppingBag size={18} /></span>
            </div>
            <strong className="mmc-value">
              {selectedStats.totalVendas} {selectedStats.totalVendas === 1 ? 'pedido' : 'pedidos'}
            </strong>
            <span className="mmc-sub">
              Ticket médio: {formatCurrency(selectedStats.ticketMedio)}
            </span>
          </div>
        </div>

        {/* Tabela Comparativa Mês a Mês */}
        <div className="monthly-table-section">
          <div className="monthly-table-title-row">
            <h3>Histórico Comparativo Mês a Mês</h3>
            <span className="monthly-table-hint">Clique em um mês para detalhar os indicadores acima</span>
          </div>

          <div className="table-scroll">
            <table className="monthly-dre-table">
              <thead>
                <tr>
                  <th>Mês / Ano</th>
                  <th>Faturamento</th>
                  <th>Custo Produtos (CMV)</th>
                  <th>Despesas</th>
                  <th>Custo Total</th>
                  <th>Lucro Líquido</th>
                  <th>Margem</th>
                  <th>Novos Clientes</th>
                  <th>Qtd. Vendas</th>
                  <th>Ticket Médio</th>
                </tr>
              </thead>
              <tbody>
                {availableMonths.map((ym) => {
                  const m = monthlyDataMap[ym]
                  if (!m) return null
                  const isRowSelected = selectedMonth === ym
                  return (
                    <tr
                      key={ym}
                      className={isRowSelected ? 'row-selected' : ''}
                      onClick={() => setSelectedMonth(ym)}
                      style={{ cursor: 'pointer' }}
                      title="Clique para detalhar este mês nos cards"
                    >
                      <td className="strong-cell">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{m.label}</span>
                          {ym === currentYearMonth && (
                            <span className="badge-current-month">Atual</span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(m.faturamento)}</td>
                      <td>{formatCurrency(m.custoProdutos)}</td>
                      <td>{formatCurrency(m.despesas)}</td>
                      <td style={{ color: '#d80064', fontWeight: 600 }}>{formatCurrency(m.custoTotal)}</td>
                      <td style={{ color: m.lucroLiquido >= 0 ? '#2ea86e' : '#e02424', fontWeight: 700 }}>
                        {formatCurrency(m.lucroLiquido)}
                      </td>
                      <td>
                        <span className="badge-pill-subtle">{m.margemLucro.toFixed(1)}%</span>
                      </td>
                      <td>{m.novosClientes}</td>
                      <td>{m.totalVendas}</td>
                      <td>{formatCurrency(m.ticketMedio)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                {(() => {
                  const totFat = Object.values(monthlyDataMap).reduce((acc, m) => acc + m.faturamento, 0)
                  const totProd = Object.values(monthlyDataMap).reduce((acc, m) => acc + m.custoProdutos, 0)
                  const totDesp = Object.values(monthlyDataMap).reduce((acc, m) => acc + m.despesas, 0)
                  const totCust = totProd + totDesp
                  const totLucro = totFat - totCust
                  const totVendas = Object.values(monthlyDataMap).reduce((acc, m) => acc + m.totalVendas, 0)
                  const totClientes = customers.length
                  const margemGlob = totFat > 0 ? (totLucro / totFat) * 100 : 0
                  const ticketGlob = totVendas > 0 ? totFat / totVendas : 0

                  return (
                    <tr className="monthly-table-total-row">
                      <th>Total Consolidado</th>
                      <th style={{ fontWeight: 700 }}>{formatCurrency(totFat)}</th>
                      <th>{formatCurrency(totProd)}</th>
                      <th>{formatCurrency(totDesp)}</th>
                      <th style={{ color: '#d80064' }}>{formatCurrency(totCust)}</th>
                      <th style={{ color: totLucro >= 0 ? '#2ea86e' : '#e02424', fontWeight: 700 }}>
                        {formatCurrency(totLucro)}
                      </th>
                      <th>{margemGlob.toFixed(1)}%</th>
                      <th>{totClientes}</th>
                      <th>{totVendas}</th>
                      <th>{formatCurrency(ticketGlob)}</th>
                    </tr>
                  )
                })()}
              </tfoot>
            </table>
          </div>
        </div>
      </section>

      {/* Extrato Detalhado de Movimentações */}
      <section className="panel entity-panel">
        <div className="panel-heading" style={{ marginBottom: '14px' }}>
          <div>
            <h2>Movimentações Recentes</h2>
            <p>Histórico detalhado de vendas e despesas em ordem cronológica.</p>
          </div>
        </div>

        {entries.length === 0 ? (
          <EmptyState
            icon={CircleDollarSign}
            title="Nenhuma movimentação"
            description="As vendas e despesas aparecerão aqui automaticamente."
          />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Valor Total</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((item) => (
                  <tr key={`${item.type}-${item.id}`}>
                    <td>{formatDate(item.date)}</td>
                    <td className="strong-cell">{item.description}</td>
                    <td>
                      <span className={`entry-type ${item.type === 'Despesa' ? 'expense' : ''}`}>
                        {item.type}
                      </span>
                    </td>
                    <td>
                      {item.type === 'Receita' ? (
                        item.remainingAmount <= 0 ? (
                          <span className="status paid">Pago</span>
                        ) : item.paidAmount > 0 ? (
                          <span className="status partial-paid">
                            Parcial ({formatCurrency(item.remainingAmount)} pend.)
                          </span>
                        ) : (
                          <span className="status pending">A receber</span>
                        )
                      ) : (
                        <span className="status paid">Pago</span>
                      )}
                    </td>
                    <td className="currency">
                      {item.type === 'Despesa' ? '− ' : ''}
                      {formatCurrency(item.value)}
                    </td>
                    <td>
                      {item.type === 'Receita' && item.remainingAmount > 0 && (
                        <button
                          type="button"
                          className="inline-action pay-action-highlight"
                          onClick={() => {
                            if (onOpenPayment && item.rawSale) {
                              onOpenPayment(item.rawSale)
                            } else if (onMarkPaid) {
                              onMarkPaid(item.id)
                            }
                          }}
                        >
                          <CreditCard size={13} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                          Receber parcelas
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal de Nova Despesa */}
      <Modal
        open={open}
        title="Nova despesa"
        description="Registre uma saída para acompanhar seu saldo e lucratividade."
        onClose={() => setOpen(false)}
      >
        <form onSubmit={submit}>
          <label>
            Descrição
            <input
              required
              name="description"
              value={form.description}
              onChange={change}
              placeholder="Ex.: sacolas, brindes, taxas de entrega"
            />
          </label>
          <div className="field-row">
            <label>
              Data
              <input required type="date" name="date" value={form.date} onChange={change} />
            </label>
            <label>
              Valor (R$)
              <input
                required
                min="0.01"
                step="0.01"
                type="number"
                name="value"
                value={form.value}
                onChange={change}
              />
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </button>
            <button className="primary">Salvar despesa</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
