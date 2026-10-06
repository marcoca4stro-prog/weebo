import { formatCurrency, formatDate } from '../data'

export default function RecentSales({ sales, showAll = false, onMarkPaid }) {
  return (
    <section className="panel sales-panel">
      <div className="panel-heading"><h2>{showAll ? 'Todas as vendas' : 'Últimas vendas'}</h2>{!showAll && <span className="panel-count">{sales.length} registros</span>}</div>
      <div className="table-scroll"><table>
        <thead><tr><th>Data</th><th>Cliente</th><th>Marca</th><th>Produto</th><th>Pagamento</th><th>Status</th><th>Valor</th>{showAll && <th></th>}</tr></thead>
        <tbody>{sales.map((sale) => <tr key={sale.id}><td>{formatDate(sale.date)}</td><td>{sale.customerName}</td><td><span className={`brand-mark ${sale.brand === 'WePink' ? 'wp' : 'ob'}`}>{sale.brand}</span></td><td className="product-cell">{sale.productName} × {sale.quantity}</td><td>{sale.payment}{sale.installments > 1 ? ` (${sale.installments}x de ${formatCurrency(sale.installmentValue || (sale.total / sale.installments))})` : ''}</td><td><span className={`status ${sale.status === 'Pago' ? 'paid' : 'pending'}`}>{sale.status}</span></td><td className="currency">{formatCurrency(sale.total)}</td>{showAll && <td>{sale.status === 'A receber' && <button className="inline-action" onClick={() => onMarkPaid(sale.id)}>Receber</button>}</td>}</tr>)}</tbody>
      </table></div>
    </section>
  )
}
