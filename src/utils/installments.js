import { makeId } from '../data'

/**
 * Adiciona meses mantendo o dia aproximado (para cálculo de vencimento de parcelas)
 */
export function addMonthsToDateString(dateStr, monthsToAdd) {
  if (!dateStr) return ''
  const parts = dateStr.split('-').map(Number)
  if (parts.length !== 3) return dateStr

  const [year, month, day] = parts
  // Month is 1-indexed in dateStr
  const targetDate = new Date(year, month - 1 + monthsToAdd, day)
  
  // Garantir formato YYYY-MM-DD
  const y = targetDate.getFullYear()
  const m = String(targetDate.getMonth() + 1).padStart(2, '0')
  const d = String(targetDate.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Gera lista de parcelas dividindo o total e arredondando centavos corretamente
 */
export function generateInstallmentsList({
  total,
  installmentsCount = 1,
  firstDueDate = '',
  saleDate = '',
  status = 'Pago'
}) {
  const count = Math.max(1, Number(installmentsCount) || 1)
  const totalVal = Math.max(0, Number(total) || 0)
  const baseValue = Math.floor((totalVal / count) * 100) / 100
  const remainder = Math.round((totalVal - baseValue * count) * 100) / 100

  const baseDueDate = firstDueDate || saleDate || new Date().toISOString().slice(0, 10)
  const isAllPaid = status === 'Pago'
  const today = new Date().toISOString().slice(0, 10)

  const list = []
  for (let i = 1; i <= count; i++) {
    // A primeira parcela absorve os centavos de arredondamento
    const val = i === 1 ? Math.round((baseValue + remainder) * 100) / 100 : baseValue
    const dueDate = addMonthsToDateString(baseDueDate, i - 1)

    list.push({
      id: makeId(),
      number: i,
      totalInstallments: count,
      value: val,
      dueDate,
      status: isAllPaid ? 'Pago' : 'Pendente',
      paidAt: isAllPaid ? today : null,
      paidAmount: isAllPaid ? val : 0
    })
  }

  return list
}

/**
 * Garante que uma venda possua installmentsList e valores consistentes
 */
export function ensureSaleInstallments(sale) {
  if (!sale) return sale

  let list = Array.isArray(sale.installmentsList) ? [...sale.installmentsList] : null

  if (!list || list.length === 0) {
    list = generateInstallmentsList({
      total: sale.total,
      installmentsCount: sale.installments || 1,
      firstDueDate: sale.dueDate,
      saleDate: sale.date,
      status: sale.status || 'Pago'
    })
  }

  // Calcula valores pagos e pendentes
  const paidAmount = list
    .filter((inst) => inst.status === 'Pago')
    .reduce((sum, inst) => sum + (Number(inst.paidAmount ?? inst.value) || 0), 0)

  const remainingAmount = Math.max(0, Math.round(((Number(sale.total) || 0) - paidAmount) * 100) / 100)

  // Status geral da venda
  const isFullyPaid = remainingAmount <= 0.005 || list.every((inst) => inst.status === 'Pago')
  const newStatus = isFullyPaid ? 'Pago' : 'A receber'

  // Próximo vencimento (primeira parcela pendente)
  const nextPending = list.find((inst) => inst.status !== 'Pago')
  const nextDueDate = nextPending ? nextPending.dueDate : ''

  return {
    ...sale,
    installmentsList: list,
    paidAmount: Math.round(paidAmount * 100) / 100,
    remainingAmount,
    status: newStatus,
    dueDate: newStatus === 'Pago' ? '' : (nextDueDate || sale.dueDate || '')
  }
}

/**
 * Registra o pagamento de uma parcela específica
 */
export function paySingleInstallment(sale, installmentId, customPaidDate) {
  const normalized = ensureSaleInstallments(sale)
  const today = customPaidDate || new Date().toISOString().slice(0, 10)

  const updatedList = normalized.installmentsList.map((inst) => {
    if (inst.id === installmentId || inst.number === installmentId) {
      return {
        ...inst,
        status: 'Pago',
        paidAt: today,
        paidAmount: Number(inst.value) || 0
      }
    }
    return inst
  })

  return ensureSaleInstallments({
    ...normalized,
    installmentsList: updatedList
  })
}

/**
 * Desfaz o pagamento de uma parcela específica
 */
export function revertSingleInstallment(sale, installmentId) {
  const normalized = ensureSaleInstallments(sale)

  const updatedList = normalized.installmentsList.map((inst) => {
    if (inst.id === installmentId || inst.number === installmentId) {
      return {
        ...inst,
        status: 'Pendente',
        paidAt: null,
        paidAmount: 0
      }
    }
    return inst
  })

  return ensureSaleInstallments({
    ...normalized,
    installmentsList: updatedList
  })
}

/**
 * Antecipa um valor arbitrário ou quita parcelas em ordem
 */
export function anticipatePayment(sale, amountToPay, customPaidDate) {
  const normalized = ensureSaleInstallments(sale)
  let remainingToApply = Math.max(0, Number(amountToPay) || 0)
  const today = customPaidDate || new Date().toISOString().slice(0, 10)

  if (remainingToApply <= 0) return normalized

  const updatedList = normalized.installmentsList.map((inst) => {
    if (inst.status === 'Pago') return inst

    const instValue = Number(inst.value) || 0
    const alreadyPaid = Number(inst.paidAmount) || 0
    const needed = Math.max(0, instValue - alreadyPaid)

    if (needed <= 0) {
      return { ...inst, status: 'Pago', paidAt: inst.paidAt || today }
    }

    if (remainingToApply >= needed) {
      remainingToApply -= needed
      return {
        ...inst,
        status: 'Pago',
        paidAt: today,
        paidAmount: instValue
      }
    } else if (remainingToApply > 0) {
      const partial = Math.round((alreadyPaid + remainingToApply) * 100) / 100
      remainingToApply = 0
      return {
        ...inst,
        paidAmount: partial,
        // Mantém pendente até completar o total
        status: partial >= instValue ? 'Pago' : 'Pendente',
        paidAt: partial >= instValue ? today : inst.paidAt
      }
    }

    return inst
  })

  return ensureSaleInstallments({
    ...normalized,
    installmentsList: updatedList
  })
}

/**
 * Quita todas as parcelas restantes da venda de uma vez
 */
export function payAllRemainingInstallments(sale, customPaidDate) {
  const normalized = ensureSaleInstallments(sale)
  const today = customPaidDate || new Date().toISOString().slice(0, 10)

  const updatedList = normalized.installmentsList.map((inst) => ({
    ...inst,
    status: 'Pago',
    paidAt: inst.paidAt || today,
    paidAmount: Number(inst.value) || 0
  }))

  return ensureSaleInstallments({
    ...normalized,
    installmentsList: updatedList
  })
}

/**
 * Calcula o saldo consolidado de um cliente somando todas as suas vendas
 */
export function getCustomerBalance(customer, sales = []) {
  const customerSales = sales
    .filter((sale) => sale.customerId === customer.id || sale.customerName === customer.name)
    .map(ensureSaleInstallments)

  const totalSpent = customerSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0)
  const totalPaid = customerSales.reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0)
  const totalPending = Math.max(0, Math.round((totalSpent - totalPaid) * 100) / 100)

  // Coleta todas as parcelas pendentes da cliente
  const pendingInstallments = []
  customerSales.forEach((s) => {
    (s.installmentsList || []).forEach((inst) => {
      if (inst.status !== 'Pago') {
        pendingInstallments.push({
          ...inst,
          saleId: s.id,
          saleDate: s.date,
          productName: s.productName,
          brand: s.brand
        })
      }
    })
  })

  // Ordena parcelas pendentes por data de vencimento
  pendingInstallments.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))

  return {
    customerId: customer.id,
    customerName: customer.name,
    customerSales,
    totalSpent,
    totalPaid,
    totalPending,
    salesCount: customerSales.length,
    pendingInstallments
  }
}
