import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.companyId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const cards = await prisma.creditCard.findMany({
    where: { companyId: session.user.companyId },
    orderBy: { name: "asc" }
  });

  return NextResponse.json(cards);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.companyId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { name, closingDay, dueDay } = body;

  const card = await prisma.creditCard.create({
    data: {
      name,
      closingDay: parseInt(closingDay),
      dueDay: parseInt(dueDay),
      companyId: session.user.companyId,
    }
  });

  return NextResponse.json(card, { status: 201 });
}
