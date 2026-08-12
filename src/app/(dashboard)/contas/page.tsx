"use client";

import { useState, useEffect } from "react";
import { IconPlus, IconTrash, IconEdit } from "@/components/Icons";
import { TransactionModal } from "@/components/TransactionModal";

export default function ContasPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [status, setStatus] = useState("abertas");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);

  useEffect(() => {
    fetchData();
    const handleEvent = () => fetchData();
    window.addEventListener("transactionSaved", handleEvent);
    return () => window.removeEventListener("transactionSaved", handleEvent);
  }, [status]);

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams({ type: "saida" });

    const [txRes, catRes] = await Promise.all([
      fetch(`/api/transactions?${params.toString()}`),
      fetch("/api/categories")
    ]);
    
    let txs = await txRes.json();
    
    // Client-side status filtering for bills
    if (status === "abertas") {
      txs = txs.filter((t: any) => t.status !== "paga");
    } else if (status === "pagas") {
      txs = txs.filter((t: any) => t.status === "paga");
    } else if (status === "vencidas") {
      txs = txs.filter((t: any) => t.status === "vencida");
    }

    // Order from nearest to furthest
    txs.sort((a: any, b: any) => {
      const dateA = new Date(a.dueDate || a.date).getTime();
      const dateB = new Date(b.dueDate || b.date).getTime();
      return dateA - dateB;
    });

    setTransactions(txs);
    setCategories(await catRes.json());
    setLoading(false);
  };

  const brl = (v: number) => (v || 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
  const soma = transactions.reduce((acc, curr) => acc + curr.amount, 0);

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta conta?")) return;
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleEdit = (t: any) => {
    setEditingTransaction(t);
    setIsModalOpen(true);
  };

  const handleQuickPay = async (t: any) => {
    const payload = { ...t, status: "paga" };
    await fetch(`/api/transactions/${t.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    fetchData();
  };

  const handleReopen = async (t: any) => {
    const payload = { ...t, status: "pendente" };
    await fetch(`/api/transactions/${t.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    fetchData();
  };

  return (
    <div className="content">
      <div className="card section no-print">
        <div className="filter-bar">
          <div className="field">
            <label>Situação</label>
            <select className="select compact" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="abertas">Em aberto</option>
              <option value="vencidas">Vencidas</option>
              <option value="pagas">Pagas</option>
              <option value="todas">Todas</option>
            </select>
          </div>
          <div style={{ flex: 1 }} />
          <button className="btn btn-sm btn-primary" onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }}>
            <IconPlus /> Nova conta
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <div className="empty">Carregando...</div>
          ) : transactions.length === 0 ? (
            <div className="empty">
              <div className="t">Nenhuma conta encontrada</div>
            </div>
          ) : (
            <>
              <div className="desktop-only">
                <table className="tb">
                  <thead>
                    <tr>
                      <th>Vencimento</th>
                      <th>Descrição</th>
                      <th>Categoria</th>
                      <th>Área</th>
                      <th>Situação</th>
                      <th className="right">Valor</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(t => {
                      const isVencida = new Date(t.dueDate || t.date) < new Date(new Date().setHours(0,0,0,0));
                      return (
                      <tr key={t.id}>
                        <td className="nowrap num">{new Date(t.dueDate || t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                        <td>
                          <strong style={{ fontWeight: 550 }}>{t.description}</strong>
                          {t.obs && <div className="tiny muted">{t.obs}</div>}
                        </td>
                        <td>
                          {t.category ? (
                            <span className="chip">
                              <span className="ico" style={{ background: t.category.color + "22" }}>{t.category.icon}</span>
                              <span>{t.category.name}</span>
                            </span>
                          ) : (
                            <span className="chip muted">Sem categoria</span>
                          )}
                        </td>
                        <td>
                          <span className="badge b-mut">{t.area}</span>
                        </td>
                        <td>
                          <span className={`badge ${t.status === 'paga' ? 'b-pos' : (isVencida ? 'b-neg' : 'b-warn')}`}>
                            <span className="dot"></span>{t.status === 'paga' ? 'Paga' : (isVencida ? 'Vencida' : 'Pendente')}
                          </span>
                        </td>
                        <td className={`right nowrap num val-neg`}>
                          {brl(t.amount)}
                        </td>
                        <td className="cell-actions">
                          <div className="row-actions">
                            {t.status !== "paga" ? (
                              <button className="btn btn-sm btn-primary" onClick={() => handleQuickPay(t)}>
                                ✔️ Marcar como paga
                              </button>
                            ) : (
                              <button className="btn btn-sm" onClick={() => handleReopen(t)}>
                                Reabrir
                              </button>
                            )}
                            <button className="btn btn-sm btn-icon" onClick={() => handleEdit(t)} title="Editar"><IconEdit /></button>
                            <button className="btn btn-sm btn-icon" onClick={() => handleDelete(t.id)} title="Excluir"><IconTrash /></button>
                          </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={5}>{transactions.length} conta(s) listada(s)</td>
                      <td colSpan={2} className="right num">Total {brl(soma)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* VERSÃO MOBILE (CARD LIST) */}
              <div className="list mobile-only">
                {transactions.map(t => {
                  const isVencida = new Date(t.dueDate || t.date) < new Date(new Date().setHours(0,0,0,0));
                  return (
                    <div className="list-item" key={t.id} style={{ flexWrap: "wrap", padding: "16px", gap: "14px" }}>
                      <div className="li-body" style={{ minWidth: "100%" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="li-title" style={{ fontSize: "15px", marginBottom: "4px" }}>{t.description}</div>
                            <div className="li-sub">
                              Vencimento: {new Date(t.dueDate || t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                              {t.category ? ` · ${t.category.name}` : ''}
                            </div>
                          </div>
                          <div className="right nowrap">
                            <div className="num val-neg" style={{ fontSize: "15.5px" }}>{brl(t.amount)}</div>
                            <span className={`badge ${t.status === 'paga' ? 'b-pos' : (isVencida ? 'b-neg' : 'b-warn')}`} style={{ marginTop: 6, display: "inline-flex" }}>
                              <span className="dot"></span>{t.status === 'paga' ? 'Paga' : (isVencida ? 'Vencida' : 'Pendente')}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "8px", marginTop: "16px", width: "100%" }}>
                          {t.status !== "paga" ? (
                            <button className="btn btn-sm btn-primary" style={{ flex: 1 }} onClick={() => handleQuickPay(t)}>✔️ Pagar</button>
                          ) : (
                            <button className="btn btn-sm" style={{ flex: 1 }} onClick={() => handleReopen(t)}>Reabrir</button>
                          )}
                          <button className="btn btn-sm btn-icon" onClick={() => handleEdit(t)}><IconEdit /></button>
                          <button className="btn btn-sm btn-icon" style={{ color: "var(--neg)" }} onClick={() => handleDelete(t.id)}><IconTrash /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={() => { setIsModalOpen(false); fetchData(); }} 
        categories={categories}
        editingTransaction={editingTransaction}
        defaultType="saida"
        defaultStatus="pendente"
      />
    </div>
  );
}
