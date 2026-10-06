export const STORAGE_KEYS = {
  products: 'weebo:products',
  customers: 'weebo:customers',
  sales: 'weebo:sales',
  expenses: 'weebo:expenses',
}

export const BRAND_OPTIONS = ['O Boticário', 'WePink']
export const PAYMENT_OPTIONS = ['PIX', 'Cartão', 'Dinheiro', 'Boleto']

export const formatCurrency = (value = 0) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0)

export const formatDate = (value) => {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`))
}

export const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`
