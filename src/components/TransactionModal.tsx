"use client";

import { useState, useEffect } from "react";
import { IconX } from "./Icons";

type TransactionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  categories: any[];
  editingTransaction?: any;
  defaultType?: "entrada" | "saida";
  defaultStatus?: "pendente" | "paga" | "recebida" | "a_receber";
};

export const FREQS: Record<string, string> = {
  semanal: "Toda semana",
  quinzenal: "A cada 15 dias",
  mensal: "Todo mês",
  bimestral: "A cada 2 meses",
  trimestral: "A cada 3 meses",
  semestral: "A cada 6 meses",
  anual: "Todo ano",
};

const PAGAMENTOS = ["Pix", "Boleto", "Cartão de crédito", "Cartão de débito", "Transferência", "Dinheiro", "Débito automático", "Outro"];

export function TransactionModal({
  isOpen,
  onClose,
  onSave,
  categories,
  editingTransaction,
  defaultType = "saida",
  defaultStatus
}: TransactionModalProps) {
  const [tipo, setTipo] = useState<"entrada" | "saida">(defaultType);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [repetir, setRepetir] = useState("");
  const [repetirAte, setRepetirAte] = useState("");
  const [area, setArea] = useState<"fisico" | "digital">("fisico");
  const [categoriaId, setCategoriaId] = useState("");
  const [pagamento, setPagamento] = useState("Pix");
  const [creditCardId, setCreditCardId] = useState("");
  const [creditCards, setCreditCards] = useState<any[]>([]);
  const [status, setStatus] = useState<string>(defaultStatus || (defaultType === "entrada" ? "recebida" : "paga"));
  const [obs, setObs] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (editingTransaction) {
        setTipo(editingTransaction.type);
        setDescricao(editingTransaction.description);
        setValor(new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(editingTransaction.amount));
        setData(editingTransaction.date.split("T")[0]);
        setVencimento(editingTransaction.dueDate ? editingTransaction.dueDate.split("T")[0] : "");
        setArea(editingTransaction.area);
        setCategoriaId(editingTransaction.categoryId || "");
        setPagamento(editingTransaction.paymentMethod);
        setCreditCardId(editingTransaction.creditCardId || "");
        setStatus(editingTransaction.status);
        setObs(editingTransaction.obs || "");
        setRepetir(editingTransaction.seriesFreq || "");
        setRepetirAte(editingTransaction.seriesEnd ? editingTransaction.seriesEnd.split("T")[0] : "");
      } else {
        setTipo(defaultType);
        setDescricao("");
        setValor("");
        setData(new Date().toISOString().split("T")[0]);
        setVencimento("");
        setArea("fisico");
        setCategoriaId("");
        setPagamento("Pix");
        setCreditCardId("");
        setStatus(defaultStatus || (defaultType === "entrada" ? "recebida" : "paga"));
        setObs("");
        setRepetir("");
        setRepetirAte("");
      }
      setErrorMsg("");
      
      // Fetch cards
      fetch("/api/cards").then(res => { if (res.ok) res.json().then(setCreditCards); });
    }
  }, [isOpen, editingTransaction, defaultType, defaultStatus]);

  useEffect(() => {
    // Quando muda o tipo, ajusta as opções de status e reseta a categoria
    if (!editingTransaction) {
      setCategoriaId("");
      setStatus(tipo === "entrada" ? "recebida" : "paga");
    }
  }, [tipo]);

  const emAberto = status === "pendente" || status === "a_receber" || status === "vencida";

  useEffect(() => {
    if (emAberto && !vencimento && data) {
      setVencimento(data);
    } else if (!emAberto && !data && vencimento) {
      setData(vencimento);
    }
  }, [emAberto, data, vencimento]);



  if (!isOpen) return null;

  const catsFiltradas = categories.filter(c => c.type === tipo);

  const handleSave = async () => {
    setErrorMsg("");
    if (!descricao || !valor || !categoriaId) {
      setErrorMsg("Preencha a descrição, valor e categoria.");
      return;
    }
    if (emAberto && !vencimento) {
      setErrorMsg("Informe a data de vencimento.");
      return;
    }
    if (!emAberto && !data) {
      setErrorMsg("Informe a data.");
      return;
    }
    if (repetir && !repetirAte) {
      setErrorMsg("Informe uma data final válida (ex: novembro só vai até dia 30).");
      return;
    }

    setLoading(true);

    const payload = {
      type: tipo,
      description: descricao,
      amount: parseFloat(valor.replace(/[^\d,-]/g, "").replace(",", ".")),
      date: emAberto && !data ? vencimento : data,
      dueDate: emAberto ? vencimento : null,
      area,
      categoryId: categoriaId,
      paymentMethod: pagamento,
      creditCardId: pagamento === "Cartão de crédito" ? creditCardId : null,
      status,
      obs,
      seriesFreq: repetir || null,
      seriesEnd: repetirAte || null,
    };

    try {
      if (editingTransaction) {
        await fetch(`/api/transactions/${editingTransaction.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      onSave();
    } catch (e: any) {
      setErrorMsg(e.message || "Erro ao salvar.");
    }
    setLoading(false);
  };

  return (
    <div className="overlay">
      <div className="modal">
        <div className="modal-head">
          <div className="mh-txt">
            <h2>{editingTransaction ? "Editar lançamento" : "Novo lançamento"}</h2>
            <div className="mh-sub">Preencha os dados abaixo.</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><IconX /></button>
        </div>
        
        <div className="modal-body">
          {errorMsg && <div className="badge b-neg" style={{ whiteSpace: 'normal' }}>{errorMsg}</div>}

          <div className="field">
            <label>Tipo de lançamento</label>
            <div className="seg" style={{ width: "100%" }}>
              <button className={tipo === "entrada" ? "active is-entrada" : ""} onClick={() => setTipo("entrada")} style={{ flex: 1 }}>Entrada</button>
              <button className={tipo === "saida" ? "active is-saida" : ""} onClick={() => setTipo("saida")} style={{ flex: 1 }}>Saída</button>
            </div>
          </div>

          <div className="field">
            <label>Descrição</label>
            <input className="input" value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex.: Mensalidade de setembro" />
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Valor</label>
              <input 
                type="text" 
                inputMode="numeric" 
                className="input num" 
                value={valor} 
                onChange={e => {
                  const numStr = e.target.value.replace(/\D/g, "");
                  if (!numStr) { setValor(""); return; }
                  const num = parseInt(numStr, 10) / 100;
                  setValor(new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num));
                }} 
                placeholder="R$ 0,00" 
              />
            </div>
            
            {!emAberto ? (
              <div className="field">
                <label>{tipo === "entrada" ? "Data do recebimento" : "Data do pagamento"}</label>
                <input type="date" className="input" value={data} onChange={e => setData(e.target.value)} />
              </div>
            ) : (
              <div className="field">
                <label>Data de vencimento</label>
                <input type="date" className="input" value={vencimento} onChange={e => setVencimento(e.target.value)} />
              </div>
            )}
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Repetir</label>
              <select className="select" value={repetir} onChange={e => setRepetir(e.target.value)}>
                <option value="">Não se repete</option>
                {Object.entries(FREQS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            {repetir && (
              <div className="field">
                <label>Repetir até</label>
                <input type="date" className="input" value={repetirAte} onChange={e => setRepetirAte(e.target.value)} />
              </div>
            )}
          </div>

          <div className="field">
            <label>Área</label>
            <div className="seg" style={{ width: "100%" }}>
              <button className={area === "fisico" ? "active" : ""} onClick={() => setArea("fisico")} style={{ flex: 1 }}>Físico</button>
              <button className={area === "digital" ? "active" : ""} onClick={() => setArea("digital")} style={{ flex: 1 }}>Digital</button>
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Categoria</label>
              <select className="select" value={categoriaId} onChange={e => setCategoriaId(e.target.value)}>
                <option value="">Selecione...</option>
                {catsFiltradas.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Forma de pagamento</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <select className="select" style={{ flex: 1 }} value={pagamento} onChange={e => {
                  setPagamento(e.target.value);
                  if (e.target.value === "Cartão de crédito" && creditCards.length > 0) {
                    setCreditCardId(creditCards[0].id);
                  } else {
                    setCreditCardId("");
                  }
                }}>
                  {PAGAMENTOS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {pagamento === "Cartão de crédito" && (
                  <select className="select" style={{ flex: 1 }} value={creditCardId} onChange={e => setCreditCardId(e.target.value)}>
                    <option value="">Selecione o cartão...</option>
                    {creditCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>
            </div>
          </div>

          <div className="field">
            <label>Situação</label>
            <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
              {tipo === "entrada" ? (
                <>
                  <option value="recebida">Recebida</option>
                  <option value="a_receber">A receber</option>
                </>
              ) : (
                <>
                  <option value="paga">Paga</option>
                  <option value="pendente">Pendente</option>
                  <option value="vencida">Vencida</option>
                </>
              )}
            </select>
          </div>

          <div className="field">
            <label>Observações <span className="muted" style={{ fontWeight: 400 }}>(opcional)</span></label>
            <textarea className="input" rows={2} value={obs} onChange={e => setObs(e.target.value)} placeholder="Anotações internas" />
          </div>

        </div>
        
        <div className="modal-foot">
          <button className="btn" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className={`btn ${tipo === 'saida' ? 'btn-danger' : 'btn-primary'}`} onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : (editingTransaction ? "Salvar alterações" : "Salvar lançamento")}
          </button>
        </div>
      </div>
    </div>
  );
}
