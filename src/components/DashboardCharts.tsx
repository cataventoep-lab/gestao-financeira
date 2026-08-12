"use client";

import React from 'react';

const brl = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const curto = (v: number) => {
  v = Number(v) || 0;
  if (Math.abs(v) >= 1000000) return (v / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mi';
  if (Math.abs(v) >= 1000) return (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil';
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
};

function escalaRedonda(pico: number) {
  const bruto = pico / 4;
  const exp = Math.pow(10, Math.floor(Math.log10(bruto || 1)));
  const n = bruto / exp;
  const passo = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * exp;
  return (passo || 1) * 4;
}

function BarChartSVG({ series }: { series: any[] }) {
  const W = 660, H = 250;
  const mL = 60, mR = 10, mT = 24, mB = 34;
  const iw = W - mL - mR, ih = H - mT - mB;
  const pico = Math.max(1, ...series.map(s => Math.max(s.entradas, s.saidas)));
  const max = escalaRedonda(pico);
  const passo = iw / series.length;
  const bw = Math.min(30, passo * 0.30);
  const base = mT + ih;

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: 'auto', fontFamily: 'inherit' }}>
      {[0, 1, 2, 3, 4].map(g => {
        const y = base - (ih / 4) * g;
        return (
          <g key={`grid-${g}`}>
            <line x1={mL} y1={y} x2={W - mR} y2={y} stroke="var(--line-2)" strokeWidth="1" />
            <text x={mL - 9} y={y + 4} textAnchor="end" fontSize="12" fill="var(--muted)">{curto(max / 4 * g)}</text>
          </g>
        );
      })}
      <line x1={mL} y1={base} x2={W - mR} y2={base} stroke="var(--line)" strokeWidth="1" />
      {series.map((s, i) => {
        const cx = mL + passo * i + passo / 2;
        const hE = Math.max((s.entradas / max) * ih, s.entradas > 0 ? 2 : 0);
        const hS = Math.max((s.saidas / max) * ih, s.saidas > 0 ? 2 : 0);
        return (
          <g key={`bar-${i}`}>
            <rect x={cx - bw - 3} y={base - hE} width={bw} height={hE} rx="3" fill="var(--pos)">
              <title>Entradas {s.rotulo}: {brl(s.entradas)}</title>
            </rect>
            {s.entradas > 0 && (
              <text x={cx - bw / 2 - 3} y={Math.max(base - hE - 5, 15)} textAnchor="middle" fontSize="10.5" fontWeight="650" fill="var(--pos)">
                {curto(s.entradas)}
              </text>
            )}

            <rect x={cx + 3} y={base - hS} width={bw} height={hS} rx="3" fill="var(--neg)">
              <title>Saídas {s.rotulo}: {brl(s.saidas)}</title>
            </rect>
            {s.saidas > 0 && (
              <text x={cx + bw / 2 + 3} y={Math.max(base - hS - 5, 15)} textAnchor="middle" fontSize="10.5" fontWeight="650" fill="var(--neg)">
                {curto(s.saidas)}
              </text>
            )}

            <text x={cx} y={base + 21} textAnchor="middle" fontSize="13" fill="var(--ink-2)">{s.rotulo}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function DashboardCharts({ allTransactions, doMes, baseDate }: { allTransactions: any[], doMes: any[], baseDate: Date }) {
  // Chart 1: Last 4 months
  const series = [];
  const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  
  for (let i = 3; i >= 0; i--) {
    const ref = new Date(baseDate);
    const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
    const targetYear = d.getFullYear();
    const targetMonth = d.getMonth();
    
    const txsMes = allTransactions.filter(t => {
      if (!t.date) return false;
      const dt = new Date(t.date);
      // Match by year and month using UTC to prevent timezone shifts
      const y = dt.getUTCFullYear();
      const m = dt.getUTCMonth();
      return y === targetYear && m === targetMonth;
    });
    
    const entradas = txsMes
      .filter(t => t.type === 'entrada' && t.status === 'recebida')
      .reduce((a, c) => a + Number(c.amount || 0), 0);

    const saidas = txsMes
      .filter(t => t.type === 'saida' && t.status === 'paga')
      .reduce((a, c) => a + Number(c.amount || 0), 0);
    
    series.push({ rotulo: MESES_CURTOS[targetMonth], entradas, saidas });
  }

  // Chart 2: Despesas por categoria do mês
  const efetivosSaida = doMes.filter(t => t.type === 'saida' && t.status === 'paga');
  const mapa: Record<string, any> = {};
  efetivosSaida.forEach(l => {
    const k = l.categoryId || 'sem';
    if (!mapa[k]) {
      mapa[k] = {
        nome: l.category?.name || 'Sem categoria',
        cor: l.category?.color || '#7A8797',
        icone: l.category?.icon || '🏷️',
        valor: 0
      };
    }
    mapa[k].valor += l.amount;
  });
  
  const catsOrdenadas = Object.values(mapa).sort((a, b) => b.valor - a.valor);
  const maxVal = Math.max(...catsOrdenadas.map(i => i.valor), 1);
  const totalVal = catsOrdenadas.reduce((a, c) => a + c.valor, 0) || 1;

  return (
    <div className="section split-3">
      <div className="card card-pad">
        <div className="section-head">
          <h2>Entradas e saídas</h2>
          <span className="small muted">Últimos 4 meses</span>
        </div>
        <BarChartSVG series={series} />
        <div className="legend" style={{ marginTop: "12px" }}>
          <span><i style={{ background: "var(--pos)" }}></i>Entradas</span>
          <span><i style={{ background: "var(--neg)" }}></i>Saídas</span>
        </div>
      </div>
      
      <div className="card card-pad">
        <div className="section-head"><h2>Despesas por categoria</h2></div>
        <div>
          {catsOrdenadas.length === 0 ? (
            <div className="empty">
              <div className="t">Nada por aqui ainda</div>
              <div className="small">Cadastre lançamentos para ver esta divisão.</div>
            </div>
          ) : (
            catsOrdenadas.map((c, idx) => (
              <div className="bar-row" key={idx}>
                <div className="bl">
                  {c.icone && <span className="ico" style={{ width: 20, height: 20, borderRadius: 6, display: 'grid', placeItems: 'center', background: `${c.cor}22` }}>{c.icone}</span>}
                  <span>{c.nome}</span>
                </div>
                <div className="bv num">{brl(c.valor)} <span className="muted tiny">{Math.round((c.valor / totalVal) * 100)}%</span></div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(c.valor / maxVal) * 100}%`, background: c.cor }}></div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
