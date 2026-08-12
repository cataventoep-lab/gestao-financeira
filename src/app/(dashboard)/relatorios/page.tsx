"use client";

import { useState, useEffect } from "react";
import { IconChart } from "@/components/Icons";

export default function RelatoriosPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [periodo, setPeriodo] = useState("mes");

  useEffect(() => {
    fetchData();
  }, [periodo]);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch("/api/transactions");
    let txs = await res.json();
    
    // Filtro simplificado apenas para demonstração do Relatório
    const today = new Date();
    if (periodo === "mes") {
      txs = txs.filter((t: any) => new Date(t.date).getMonth() === today.getMonth() && new Date(t.date).getFullYear() === today.getFullYear());
    } else if (periodo === "ano") {
      txs = txs.filter((t: any) => new Date(t.date).getFullYear() === today.getFullYear());
    }

    setTransactions(txs);
    setLoading(false);
  };

  const brl = (v: number) => (v || 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

  const entradasRecebidas = transactions.filter(t => t.type === "entrada" && t.status === "recebida");
  const saidasPagas = transactions.filter(t => t.type === "saida" && t.status === "paga");
  
  const totalEntradas = entradasRecebidas.reduce((a, c) => a + c.amount, 0);
  const totalSaidas = saidasPagas.reduce((a, c) => a + c.amount, 0);
  const saldo = totalEntradas - totalSaidas;

  return (
    <div className="content">
      <div className="card section no-print">
        <div className="filter-bar">
          <div className="field">
            <label>Período</label>
            <select className="select compact" value={periodo} onChange={e => setPeriodo(e.target.value)}>
              <option value="mes">Mês atual</option>
              <option value="ano">Ano atual</option>
              <option value="todos">Todo o período</option>
            </select>
          </div>
          <div style={{ flex: 1 }} />
          <button className="btn btn-sm" onClick={() => window.print()}>
            🖨️ Imprimir / PDF
          </button>
        </div>
      </div>

      <div id="relatorioConteudo">
        {loading ? (
          <div className="empty">Gerando relatório...</div>
        ) : (
          <>
            <div className="card card-pad section">
              <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", flexWrap: "wrap", alignItems: "baseline" }}>
                <div>
                  <h2>Relatório Financeiro</h2>
                  <div className="small muted">Emitido em {new Date().toLocaleDateString('pt-BR')}</div>
                </div>
                <div className="small muted">{transactions.length} lançamento(s)</div>
              </div>
            </div>

            <div className="section kpis">
              <div className="card kpi pos">
                <div className="kpi-top">Total de entradas</div>
                <div className="kpi-value num">{brl(totalEntradas)}</div>
              </div>
              <div className="card kpi neg">
                <div className="kpi-top">Total de saídas</div>
                <div className="kpi-value num">{brl(totalSaidas)}</div>
              </div>
              <div className={`card kpi ${saldo >= 0 ? 'pos' : 'neg'}`}>
                <div className="kpi-top">Saldo</div>
                <div className="kpi-value num">{brl(saldo)}</div>
              </div>
            </div>

            <div className="section split">
              <div className="card report-block" style={{ padding: "18px" }}>
                <h3 style={{ marginBottom: "12px" }}>Contas Pagas</h3>
                {saidasPagas.length === 0 ? (
                  <div className="empty" style={{ padding: "20px" }}>Nenhuma conta paga.</div>
                ) : (
                  <div className="table-wrap">
                    <table className="tb">
                      <thead><tr><th>Data</th><th>Descrição</th><th className="right">Valor</th></tr></thead>
                      <tbody>
                        {saidasPagas.map(t => (
                          <tr key={t.id}>
                            <td className="nowrap">{new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                            <td>{t.description}</td>
                            <td className="right num">{brl(t.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              
              <div className="card report-block" style={{ padding: "18px" }}>
                <h3 style={{ marginBottom: "12px" }}>Entradas Recebidas</h3>
                {entradasRecebidas.length === 0 ? (
                  <div className="empty" style={{ padding: "20px" }}>Nenhuma entrada recebida.</div>
                ) : (
                  <div className="table-wrap">
                    <table className="tb">
                      <thead><tr><th>Data</th><th>Descrição</th><th className="right">Valor</th></tr></thead>
                      <tbody>
                        {entradasRecebidas.map(t => (
                          <tr key={t.id}>
                            <td className="nowrap">{new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                            <td>{t.description}</td>
                            <td className="right num">{brl(t.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
