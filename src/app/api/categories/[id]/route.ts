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

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category || category.companyId !== session.user.companyId) {
    return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
  }

  const updated = await prisma.category.update({
    where: { id },
    data: {
      name: body.name,
      icon: body.icon,
      color: body.color,
    }
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.companyId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const resolvedParams = await params;
  const { id } = resolvedParams;

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category || category.companyId !== session.user.companyId) {
    return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
  }

  // Verificar se há lançamentos vinculados
  const inUse = await prisma.transaction.findFirst({ where: { categoryId: id } });
  if (inUse) {
    return NextResponse.json({ error: "Não é possível excluir uma categoria em uso." }, { status: 400 });
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
