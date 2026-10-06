import { BarChart3 } from 'lucide-react'
import EmptyState from './EmptyState'

export default function SalesChart({ brand, sales }) {
  const showBoticario = brand !== 'WePink'
  const showWepink = brand !== 'O Boticário'
  const chartData = Array.from({ length: 6 }, (_, index) => {
    const start = index * 5 + 1
    const end = start + 4
    const inRange = sales.filter((sale) => { const day = Number(sale.date?.slice(-2)); return day >= start && day <= end })
    return {
      label: String(start).padStart(2, '0'),
      boticario: inRange.filter((sale) => sale.brand === 'O Boticário').reduce((sum, sale) => sum + sale.total, 0),
      wepink: inRange.filter((sale) => sale.brand === 'WePink').reduce((sum, sale) => sum + sale.total, 0),
    }
  })
  const max = Math.max(1, ...chartData.flatMap((item) => [item.boticario, item.wepink]))
  return (
    <section className="panel chart-panel">
      <div className="panel-heading">
        <div><h2>Vendas do mês</h2><p>Comparativo por marca</p></div>
        {sales.length > 0 && <div className="legend">{showBoticario && <span><i className="dot green" />O Boticário</span>}{showWepink && <span><i className="dot pink" />WePink</span>}</div>}
      </div>
      {sales.length === 0 ? <EmptyState compact icon={BarChart3} title="Ainda não há vendas" description="O comparativo por marca aparecerá após a primeira venda." /> : <div className="chart-wrap" aria-label="Gráfico de vendas por marca no mês">
        <div className="y-axis"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0</span></div>
        <div className="chart-grid">{chartData.map((item, index) => <div className="bar-group" key={item.label}>{showBoticario && <span className="bar boticario" style={{ height: `${item.boticario / max * 100}%`, animationDelay: `${index * 22}ms` }} />}{showWepink && <span className="bar wepink" style={{ height: `${item.wepink / max * 100}%`, animationDelay: `${index * 22 + 20}ms` }} />}<small>{item.label}</small></div>)}</div>
      </div>}
    </section>
  )
}
