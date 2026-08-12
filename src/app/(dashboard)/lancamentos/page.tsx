"use client";

import { useState, useEffect } from "react";
import { IconPlus, IconTrash, IconEdit } from "@/components/Icons";
import { TransactionModal } from "@/components/TransactionModal";

export default function LancamentosPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);

  useEffect(() => {
    fetchData();
    const handleEvent = () => fetchData();
    window.addEventListener("transactionSaved", handleEvent);
    return () => window.removeEventListener("transactionSaved", handleEvent);
  }, [type, status]);

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (status) params.append("status", status);

    const [txRes, catRes] = await Promise.all([
      fetch(`/api/transactions?${params.toString()}`),
      fetch("/api/categories")
    ]);
    
    setTransactions(await txRes.json());
    setCategories(await catRes.json());
    setLoading(false);
  };

  const brl = (v: number) => (v || 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este lançamento?")) return;
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleEdit = (t: any) => {
    setEditingTransaction(t);
    setIsModalOpen(true);
  };

  const handleQuickPay = async (t: any) => {
    const payload = { ...t, status: t.type === "entrada" ? "recebida" : "paga" };
    await fetch(`/api/transactions/${t.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    fetchData();
  };

  return (
    <div className="content">
      <div className="card section">
        <div className="filter-bar">
          <div className="field">
            <label>Tipo</label>
            <select className="select compact" value={type} onChange={e => setType(e.target.value)}>
              <option value="">Todos</option>
              <option value="entrada">Entradas</option>
              <option value="saida">Saídas</option>
            </select>
          </div>
          <button className="btn btn-sm btn-primary" onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }}>
            <IconPlus /> Novo
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <div className="empty">Carregando...</div>
          ) : transactions.length === 0 ? (
            <div className="empty">
              <div className="t">Nenhum lançamento encontrado</div>
            </div>
          ) : (
            <>
              <div className="desktop-only">
                <table className="tb">
                  <thead>
                    <tr>
                      <th>Data / Vencimento</th>
                      <th>Descrição</th>
                      <th>Categoria</th>
                      <th>Tipo</th>
                      <th>Situação</th>
                      <th className="right">Valor</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(t => {
                      const canPay = t.status !== "paga" && t.status !== "recebida";
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
                          {t.type === 'entrada' ? <span className="badge b-pos">Entrada</span> : <span className="badge b-neg">Saída</span>}
                        </td>
                        <td>
                          <span className={`badge ${t.status === 'recebida' || t.status === 'paga' ? 'b-pos' : 'b-warn'}`}>
                            <span className="dot"></span>{t.status}
                          </span>
                        </td>
                        <td className={`right nowrap num ${t.type === 'entrada' ? 'val-pos' : 'val-neg'}`}>
                          {t.type === 'entrada' ? '+' : '−'} {brl(t.amount)}
                        </td>
                        <td className="cell-actions">
                          <div className="row-actions">
                            {canPay && (
                              <button className="btn btn-sm btn-icon" onClick={() => handleQuickPay(t)} title={t.type === 'entrada' ? "Receber" : "Pagar"}>
                                ✔️
                              </button>
                            )}
                            <button className="btn btn-sm btn-icon" onClick={() => handleEdit(t)} title="Editar"><IconEdit /></button>
                            <button className="btn btn-sm btn-icon" onClick={() => handleDelete(t.id)} title="Excluir"><IconTrash /></button>
                          </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
              
              {/* VERSÃO MOBILE */}
              <div className="list mobile-only">
                {transactions.map(t => {
                  const canPay = t.status !== "paga" && t.status !== "recebida";
                  return (
                    <div className="list-item" key={t.id} style={{ flexWrap: "wrap", padding: "16px", gap: "14px" }}>
                      <div className="li-body" style={{ minWidth: "100%" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="li-title" style={{ fontSize: "15px", marginBottom: "4px" }}>{t.description}</div>
                            <div className="li-sub">
                              {new Date(t.dueDate || t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                              {t.category ? ` · ${t.category.name}` : ''}
                            </div>
                          </div>
                          <div className="right nowrap">
                            <div className={`num ${t.type === 'entrada' ? 'val-pos' : 'val-neg'}`} style={{ fontSize: "15.5px" }}>
                              {t.type === 'entrada' ? '+' : '−'} {brl(t.amount)}
                            </div>
                            <span className={`badge ${t.status === 'recebida' || t.status === 'paga' ? 'b-pos' : 'b-warn'}`} style={{ marginTop: 6, display: "inline-flex" }}>
                              <span className="dot"></span>{t.status}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "8px", marginTop: "16px", width: "100%" }}>
                          {canPay && (
                            <button className="btn btn-sm btn-primary" style={{ flex: 1 }} onClick={() => handleQuickPay(t)}>
                              ✔️ {t.type === 'entrada' ? 'Receber' : 'Pagar'}
                            </button>
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
      />
    </div>
  );
}
