import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.companyId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const categories = await prisma.category.findMany({
    where: { companyId: session.user.companyId },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { transactions: true }
      }
    }
  });

  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.companyId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();

  if (!body.name || !body.type) {
    return NextResponse.json({ error: "Nome e tipo são obrigatórios" }, { status: 400 });
  }

  const category = await prisma.category.create({
    data: {
      name: body.name,
      type: body.type, // 'entrada' | 'saida'
      icon: body.icon || "🏷️",
      color: body.color || "#1E7A62",
      companyId: session.user.companyId,
    },
  });

  return NextResponse.json(category, { status: 201 });
}
