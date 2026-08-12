import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.companyId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const area = searchParams.get("area");
  
  // Lógica de Baixa Automática para Cartões de Crédito
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.transaction.updateMany({
    where: {
      companyId: session.user.companyId,
      paymentMethod: "Cartão de crédito",
      status: { in: ["pendente", "vencida"] },
      creditCardId: { not: null },
      dueDate: { lt: today }
    },
    data: {
      status: "paga"
    }
  });

  // Condições flexíveis para filtro
  const where: any = { companyId: session.user.companyId };
  if (type) where.type = type;
  if (area && area !== "todas") where.area = area;

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
    include: { category: true }
  });

  return NextResponse.json(transactions);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.companyId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();

  const transaction = await prisma.transaction.create({
    data: {
      type: body.type,
      description: body.description,
      amount: parseFloat(body.amount),
      date: new Date(body.date),
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      area: body.area || "fisico",
      categoryId: body.categoryId || null,
      creditCardId: body.creditCardId || null,
      paymentMethod: body.paymentMethod || "Outro",
      status: body.status || (body.type === "entrada" ? "recebida" : "paga"),
      obs: body.obs,
      seriesId: body.seriesId,
      seriesFreq: body.seriesFreq,
      seriesEnd: body.seriesEnd ? new Date(body.seriesEnd) : null,
      companyId: session.user.companyId,
    },
  });

  return NextResponse.json(transaction, { status: 201 });
}
