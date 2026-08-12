import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { DashboardCharts } from "@/components/DashboardCharts";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ month?: string, area?: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const resolvedParams = await searchParams;
  const { month, area } = resolvedParams;

  // Fetch transactions for the current month
  const today = new Date();
  let firstDay, lastDay;
  if (month) {
    const [y, m] = month.split("-").map(Number);
    firstDay = new Date(y, m - 1, 1);
    lastDay = new Date(y, m, 0);
  } else {
    firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  }

  const whereMes: any = {
    companyId: session.user.companyId,
    date: { gte: firstDay, lte: lastDay }
  };
  if (area) whereMes.area = area;

  const whereAll: any = { companyId: session.user.companyId };
  if (area) whereAll.area = area;

  const [doMes, allTransactions] = await Promise.all([
    prisma.transaction.findMany({
      where: whereMes,
      include: { category: true }
    }),
    prisma.transaction.findMany({
      where: whereAll,
      include: { category: true }
    })
  ]);

  const soma = (arr: any[]) => arr.reduce((acc, curr) => acc + curr.amount, 0);

  const entradasRecebidas = doMes.filter(t => t.type === "entrada" && t.status === "recebida");
  const entradasAReceber = doMes.filter(t => t.type === "entrada" && t.status === "a_receber");
  const saidasPagas = doMes.filter(t => t.type === "saida" && t.status === "paga");
  
  // Contas a pagar do mês (pendentes ou vencidas dentro do mês)
  const contasMes = doMes.filter(t => t.type === "saida" && t.status !== "paga");

  // Vencidas (qualquer data antes de hoje que não esteja paga)
  const vencidas = allTransactions.filter(t => {
    if (t.type !== "saida" || t.status === "paga") return false;
    const ref = t.dueDate || t.date;
    return new Date(ref) < new Date(new Date().setHours(0,0,0,0));
  });

  const saldo = soma(entradasRecebidas) - soma(saidasPagas);
  const saldoPos = saldo >= 0;

  const brl = (v: number) => (v || 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

  // Últimos lançamentos
  const ultimos = [...allTransactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  // Próximas contas
  const proximas = allTransactions
    .filter(t => t.type === "saida" && t.status !== "paga")
    .sort((a, b) => new Date(a.dueDate || a.date).getTime() - new Date(b.dueDate || b.date).getTime())
    .slice(0, 8);

  return (
    <div className="content">
      <div className="section">
        <div className="kpis">
          <div className="card kpi pos">
            <div className="kpi-top">Entradas do mês</div>
            <div className="kpi-value num">{brl(soma(entradasRecebidas))}</div>
            <div className="kpi-foot">{soma(entradasAReceber) > 0 ? `${brl(soma(entradasAReceber))} ainda a receber` : 'Tudo recebido no período'}</div>
          </div>
          <div className="card kpi neg">
            <div className="kpi-top">Saídas do mês</div>
            <div className="kpi-value num">{brl(soma(saidasPagas))}</div>
            <div className="kpi-foot">{saidasPagas.length} despesas pagas</div>
          </div>
          <div className="card kpi pos">
            <div className="kpi-top">Saldo do mês</div>
            <div className="kpi-value num" style={{ color: saldoPos ? "var(--pos)" : "var(--neg)" }}>{brl(saldo)}</div>
            <div className="kpi-foot">{saldoPos ? 'Entradas maiores que as saídas' : 'As saídas superaram as entradas'}</div>
          </div>
          <div className="card kpi info">
            <div className="kpi-top">Contas a pagar</div>
            <div className="kpi-value num">{brl(soma(contasMes))}</div>
            <div className="kpi-foot">{contasMes.length} conta(s) no mês</div>
          </div>
          <div className="card kpi">
            <div className="kpi-top">Contas vencidas</div>
            <div className="kpi-value num" style={{ color: vencidas.length > 0 ? "var(--neg)" : "inherit" }}>{brl(soma(vencidas))}</div>
            <div className="kpi-foot">{vencidas.length > 0 ? `${vencidas.length} conta(s) em atraso` : 'Nenhuma conta em atraso'}</div>
          </div>
        </div>
      </div>

      <DashboardCharts allTransactions={allTransactions} doMes={doMes} baseDate={firstDay} />

      <div className="section split">
        <div className="card">
          <div className="section-head" style={{ padding: "16px 18px 0" }}>
            <h2>Últimos lançamentos</h2>
          </div>
          {ultimos.length === 0 ? (
            <div className="empty">
              <div className="t">Nenhum lançamento por enquanto</div>
              <div className="small">Cadastre no menu Lançamentos para começar.</div>
            </div>
          ) : (
            <div className="list">
              {ultimos.map((l) => (
                <div className="list-item" key={l.id}>
                  <div className="li-ico" style={{ background: `${l.category?.color || '#888'}22` }}>
                    {l.category?.icon || '🏷️'}
                  </div>
                  <div className="li-body">
                    <div className="li-title">{l.description}</div>
                    <div className="li-sub">
                      {new Date(l.date).toLocaleDateString("pt-BR", { timeZone: 'UTC' })} · {l.area} · {l.category?.name || 'Sem categoria'}
                    </div>
                  </div>
                  <div className="right nowrap">
                    <div className={`num ${l.type === 'entrada' ? 'val-pos' : 'val-neg'}`}>
                      {l.type === 'entrada' ? '+' : '−'} {brl(l.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <div className="section-head" style={{ padding: "16px 18px 0" }}>
            <h2>Próximas contas a vencer</h2>
          </div>
          {proximas.length === 0 ? (
            <div className="empty">
              <div className="t">Não há contas pendentes</div>
              <div className="small">Todas as despesas estão quitadas.</div>
            </div>
          ) : (
            <div className="list">
              {proximas.map(l => {
                const isVencida = new Date(l.dueDate || l.date) < new Date(new Date().setHours(0,0,0,0));
                return (
                  <div className="list-item" key={l.id}>
                    <div className="li-body">
                      <div className="li-title">{l.description}</div>
                      <div className="li-sub">
                        Vence em {new Date(l.dueDate || l.date).toLocaleDateString("pt-BR", { timeZone: 'UTC' })} · {l.area}
                      </div>
                    </div>
                    <div className="right nowrap">
                      <div className="num" style={{ fontWeight: 600 }}>{brl(l.amount)}</div>
                      <div style={{ marginTop: "3px" }}>
                        <span className={`badge ${isVencida ? 'b-neg' : 'b-warn'}`}>
                          <span className="dot"></span> {isVencida ? 'Vencida' : 'Pendente'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
