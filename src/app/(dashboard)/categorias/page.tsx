"use client";

import { useState, useEffect } from "react";
import { IconPlus, IconTag, IconTrash, IconEdit } from "@/components/Icons";

type Category = {
  id: string;
  name: string;
  type: string;
  icon: string;
  color: string;
  _count?: { transactions: number };
};

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("saida");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!name) return alert("Nome é obrigatório");
    
    const payload = { name, type, icon: "🏷️", color: type === "entrada" ? "#1E7A62" : "#B4483F" };

    if (editingId) {
      await fetch(`/api/categories/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/categories", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    
    setIsModalOpen(false);
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;
    
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const { error } = await res.json();
      alert(error || "Erro ao excluir");
    } else {
      fetchCategories();
    }
  };

  const openNew = (t: string) => {
    setEditingId(null);
    setName("");
    setType(t);
    setIsModalOpen(true);
  };

  const entradas = categories.filter(c => c.type === "entrada");
  const saidas = categories.filter(c => c.type === "saida");

  if (loading) return <div className="content">Carregando...</div>;

  return (
    <div className="content">
      <div className="section-head">
        <h2>Categorias de entrada</h2>
        <button className="btn btn-sm" onClick={() => openNew("entrada")}>
          <IconPlus /> Nova categoria
        </button>
      </div>
      <div className="cat-grid section">
        {entradas.map(c => (
          <div className="card cat-card" key={c.id}>
            <div className="cc-ico" style={{ background: c.color + "22" }}>{c.icon}</div>
            <div className="cc-body">
              <div className="cc-name">{c.name}</div>
              <div className="cc-sub">{c._count?.transactions || 0} lançamento(s)</div>
            </div>
            <div className="cc-actions">
              <button className="btn btn-sm btn-icon" onClick={() => { setEditingId(c.id); setName(c.name); setType(c.type); setIsModalOpen(true); }}><IconEdit /></button>
              <button className="btn btn-sm btn-icon" onClick={() => handleDelete(c.id)}><IconTrash /></button>
            </div>
          </div>
        ))}
        {entradas.length === 0 && <div className="empty">Nenhuma categoria de entrada.</div>}
      </div>

      <div className="section-head" style={{ marginTop: "26px" }}>
        <h2>Categorias de saída</h2>
        <button className="btn btn-sm" onClick={() => openNew("saida")}>
          <IconPlus /> Nova categoria
        </button>
      </div>
      <div className="cat-grid section">
        {saidas.map(c => (
          <div className="card cat-card" key={c.id}>
            <div className="cc-ico" style={{ background: c.color + "22" }}>{c.icon}</div>
            <div className="cc-body">
              <div className="cc-name">{c.name}</div>
              <div className="cc-sub">{c._count?.transactions || 0} lançamento(s)</div>
            </div>
            <div className="cc-actions">
              <button className="btn btn-sm btn-icon" onClick={() => { setEditingId(c.id); setName(c.name); setType(c.type); setIsModalOpen(true); }}><IconEdit /></button>
              <button className="btn btn-sm btn-icon" onClick={() => handleDelete(c.id)}><IconTrash /></button>
            </div>
          </div>
        ))}
        {saidas.length === 0 && <div className="empty">Nenhuma categoria de saída.</div>}
      </div>

      {isModalOpen && (
        <div className="overlay">
          <div className="modal narrow">
            <div className="modal-head">
              <div className="mh-txt"><h2>{editingId ? "Editar categoria" : "Nova categoria"}</h2></div>
              <button className="btn btn-ghost btn-icon" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label>Nome da categoria</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Energia elétrica" />
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave}>Salvar categoria</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
