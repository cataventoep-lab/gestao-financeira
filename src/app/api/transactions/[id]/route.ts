import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.companyId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const resolvedParams = await params;
  const { id } = resolvedParams;
  const body = await req.json();

  const transaction = await prisma.transaction.findUnique({ where: { id } });
  if (!transaction || transaction.companyId !== session.user.companyId) {
    return NextResponse.json({ error: "Lançamento não encontrado" }, { status: 404 });
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      type: body.type,
      description: body.description,
      amount: body.amount ? parseFloat(body.amount) : undefined,
      date: body.date ? new Date(body.date) : undefined,
      dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : undefined,
      area: body.area,
      categoryId: body.categoryId,
      creditCardId: body.creditCardId !== undefined ? body.creditCardId : undefined,
      paymentMethod: body.paymentMethod,
      status: body.status,
      obs: body.obs,
      seriesId: body.seriesId,
      seriesFreq: body.seriesFreq,
      seriesEnd: body.seriesEnd !== undefined ? (body.seriesEnd ? new Date(body.seriesEnd) : null) : undefined,
    }
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.companyId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const resolvedParams = await params;
  const { id } = resolvedParams;

  const transaction = await prisma.transaction.findUnique({ where: { id } });
  if (!transaction || transaction.companyId !== session.user.companyId) {
    return NextResponse.json({ error: "Lançamento não encontrado" }, { status: 404 });
  }

  await prisma.transaction.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
