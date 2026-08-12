"use client";

import { signOut, useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

export default function ConfigPage() {
  const { data: session } = useSession();
  
  const [companyName, setCompanyName] = useState("");
  const [cards, setCards] = useState<any[]>([]);
  const [cardName, setCardName] = useState("");
  const [closingDay, setClosingDay] = useState("");
  const [dueDay, setDueDay] = useState("");

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    const res = await fetch("/api/cards");
    if (res.ok) setCards(await res.json());
  };

  const handleAddCard = async () => {
    if (!cardName || !closingDay || !dueDay) return;
    setLoading(true);
    await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: cardName, closingDay, dueDay })
    });
    setCardName("");
    setClosingDay("");
    setDueDay("");
    await fetchCards();
    setLoading(false);
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm("Excluir este cartão?")) return;
    setLoading(true);
    await fetch(`/api/cards/${id}`, { method: "DELETE" });
    await fetchCards();
    setLoading(false);
  };
  const [loading, setLoading] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  const handleCompanySave = async () => {
    if (!companyName) return;
    setLoading(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "company", name: companyName })
    });
    setLoading(false);
    window.location.reload(); // Atualiza a página para refletir no Layout/Sidebar
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setLoading(true);
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "company", logo: base64 })
      });
      setLoading(false);
      window.location.reload();
    };
    reader.readAsDataURL(file);
  };

  const handleExportBackup = async () => {
    setLoading(true);
    const [txs, cats] = await Promise.all([
      fetch("/api/transactions").then(res => res.json()),
      fetch("/api/categories").then(res => res.json())
    ]);
    
    const backupData = {
      version: 1,
      exportDate: new Date().toISOString(),
      transactions: txs,
      categories: cats,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-gestao-financeira-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setLoading(false);
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonString = event.target?.result as string;
        const data = JSON.parse(jsonString);

        if (!data.transactions && !data.categories) {
          alert("Arquivo inválido.");
          return;
        }

        setLoading(true);
        const res = await fetch("/api/settings/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });

        const result = await res.json();
        setLoading(false);

        if (res.ok) {
          alert(`Importação concluída! ${result.importedTransactions || 0} lançamentos importados.`);
        } else {
          alert(result.error || "Erro ao importar");
        }
      } catch (err) {
        alert("Falha ao ler o arquivo JSON.");
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const importRef = useRef<HTMLInputElement>(null);

  return (
    <div className="content">
      <div className="section-head">
        <h2>Preferências da Empresa</h2>
      </div>
      <div className="card section">
        <div className="setting-row mobile-col" style={{ display: "flex", justifyContent: "space-between", padding: "18px", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ flex: 1, minWidth: "250px" }}>
            <div className="sr-title">Nome da Empresa</div>
            <div className="sr-desc">Aparece nos relatórios e menus.</div>
          </div>
          <div className="mobile-col" style={{ display: "flex", gap: "8px" }}>
            <input 
              className="input compact" 
              placeholder="Novo nome" 
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleCompanySave} disabled={loading || !companyName}>Salvar</button>
          </div>
        </div>
        <div className="setting-row mobile-col" style={{ display: "flex", justifyContent: "space-between", padding: "18px", borderTop: "1px solid var(--line-2)", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div className="sr-title">Logo da Empresa</div>
            <div className="sr-desc">Faça upload de uma imagem (JPG/PNG).</div>
          </div>
          <div className="mobile-col">
            <input type="file" accept="image/png, image/jpeg" style={{ display: "none" }} ref={logoRef} onChange={handleLogoUpload} />
            <button className="btn" onClick={() => logoRef.current?.click()} disabled={loading}>📁 Escolher imagem</button>
          </div>
        </div>
      </div>

      <div className="section-head" style={{ marginTop: "26px" }}>
        <h2>Cartões de Crédito</h2>
      </div>
      <div className="card section">
        <div style={{ padding: "18px" }}>
          <div className="mobile-col" style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
            <input className="input compact" placeholder="Nome do Cartão" value={cardName} onChange={e => setCardName(e.target.value)} />
            <input className="input compact" type="number" placeholder="Dia fechamento (ex: 25)" value={closingDay} onChange={e => setClosingDay(e.target.value)} />
            <input className="input compact" type="number" placeholder="Dia vencimento (ex: 5)" value={dueDay} onChange={e => setDueDay(e.target.value)} />
            <button className="btn btn-primary" onClick={handleAddCard} disabled={loading || !cardName || !closingDay || !dueDay}>Adicionar</button>
          </div>
          {cards.length > 0 ? (
            <div className="table-wrap">
              <table className="tb">
              <thead><tr><th>Cartão</th><th>Fechamento</th><th>Vencimento</th><th></th></tr></thead>
              <tbody>
                {cards.map(c => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>Dia {c.closingDay}</td>
                    <td>Dia {c.dueDay}</td>
                    <td className="right"><button className="btn btn-sm" onClick={() => handleDeleteCard(c.id)}>Excluir</button></td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          ) : (
            <div className="muted tiny">Nenhum cartão cadastrado.</div>
          )}
        </div>
      </div>

      <div className="section-head" style={{ marginTop: "26px" }}>
        <h2>Backup e Restauração</h2>
      </div>
      <div className="card section">
        <div className="setting-row mobile-col" style={{ display: "flex", justifyContent: "space-between", padding: "18px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div className="sr-title">Exportar todos os dados</div>
            <div className="sr-desc">Gera um arquivo JSON com lançamentos e categorias.</div>
          </div>
          <button className="btn" onClick={handleExportBackup} disabled={loading}>⬇️ Baixar backup</button>
        </div>
        <div className="setting-row mobile-col" style={{ display: "flex", justifyContent: "space-between", padding: "18px", borderTop: "1px solid var(--line-2)", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div className="sr-title">Importar dados (Upload)</div>
            <div className="sr-desc">Restaure um arquivo JSON gerado anteriormente.</div>
          </div>
          <div className="mobile-col">
            <input type="file" accept=".json" style={{ display: "none" }} ref={importRef} onChange={handleImportBackup} />
            <button className="btn btn-primary" onClick={() => importRef.current?.click()} disabled={loading}>⬆️ Fazer upload (Importar)</button>
          </div>
        </div>
      </div>

      <div className="section-head" style={{ marginTop: "26px" }}>
        <h2>Sistema e Conta</h2>
      </div>
      <div className="card section">
        <div className="setting-row mobile-col" style={{ display: "flex", justifyContent: "space-between", padding: "18px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div className="sr-title">Sair do sistema</div>
            <div className="sr-desc">Encerre sua sessão com segurança.</div>
          </div>
          <button className="btn" onClick={() => signOut()}>Deslogar</button>
        </div>
      </div>

      <div className="section-head" style={{ marginTop: "26px" }}>
        <h2>Zona de risco</h2>
      </div>
      <div className="card section danger-zone" style={{ borderColor: "#F0D5D2" }}>
        <div className="setting-row mobile-col" style={{ display: "flex", justifyContent: "space-between", padding: "18px", backgroundColor: "#FBEBE9", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div className="sr-title" style={{ color: "var(--neg)" }}>Limpar todos os dados</div>
            <div className="sr-desc">Apaga permanentemente os dados da sua empresa no banco. (Requer confirmação)</div>
          </div>
          <button className="btn btn-danger" onClick={() => alert("Em construção: Isso apagará tudo do banco.")}>Apagar tudo</button>
        </div>
      </div>
    </div>
  );
}
