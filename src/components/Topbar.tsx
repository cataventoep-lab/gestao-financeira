"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IconPlus } from "./Icons";
import { TransactionModal } from "./TransactionModal";

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  const currentMonth = searchParams.get("month") || "";
  const currentArea = searchParams.get("area") || "";

  const generateMonths = () => {
    const months = [];
    const now = new Date();
    for (let i = -6; i <= 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      months.push({ value: val, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return months;
  };

  const setParam = (key: string, val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set(key, val);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    if (isModalOpen) {
      fetch("/api/categories").then(r => r.json()).then(setCategories);
    }
  }, [isModalOpen]);

  const getPageTitle = () => {
    if (pathname === "/") return { crumb: "Visão do mês", title: "Dashboard" };
    if (pathname === "/lancamentos") return { crumb: "Entradas e saídas", title: "Lançamentos" };
    if (pathname === "/contas") return { crumb: "Despesas em aberto", title: "Contas a pagar" };
    if (pathname === "/categorias") return { crumb: "Organização", title: "Categorias" };
    if (pathname === "/relatorios") return { crumb: "Análise", title: "Relatórios" };
    if (pathname === "/config") return { crumb: "Sistema", title: "Configurações" };
    return { crumb: "Painel", title: "Visão Geral" };
  };

  const { crumb, title } = getPageTitle();
  const showBtn = pathname !== "/categorias" && pathname !== "/config";
  const showFilters = pathname !== "/categorias" && pathname !== "/config";

  const handleSave = () => {
    setIsModalOpen(false);
    // Dispara um evento para atualizar componentes client-side
    window.dispatchEvent(new Event("transactionSaved"));
    // Atualiza componentes server-side
    router.refresh();
  };

  return (
    <>
      <header className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button className="btn btn-ghost btn-icon menu-trigger" onClick={onMenuClick}>
            ☰
          </button>
          <div className="page-title">
            <div className="crumb">{crumb}</div>
            <h1>{title}</h1>
          </div>
        </div>
        
        {showFilters && (
          <div className="filters" id="globalFilters">
            <select className="select compact" aria-label="Mês" value={currentMonth} onChange={e => setParam("month", e.target.value)}>
              <option value="">Mês atual</option>
              {generateMonths().map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <div className="seg">
              <button className={!currentArea ? "active" : ""} onClick={() => setParam("area", "")}>Visão geral</button>
              <button className={currentArea === "fisico" ? "active" : ""} onClick={() => setParam("area", "fisico")}>Físico</button>
              <button className={currentArea === "digital" ? "active" : ""} onClick={() => setParam("area", "digital")}>Digital</button>
            </div>
          </div>
        )}

        {showBtn && (
          <button className="btn btn-primary no-print" onClick={() => setIsModalOpen(true)}>
            <IconPlus /> Novo lançamento
          </button>
        )}
      </header>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave} 
        categories={categories}
      />
    </>
  );
}
