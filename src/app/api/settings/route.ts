import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.companyId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();

    if (body.type === "company") {
      const updated = await prisma.company.update({
        where: { id: session.user.companyId },
        data: {
          name: body.name,
          logo: body.logo, // Base64
        }
      });
      return NextResponse.json(updated);
    } 
    
    if (body.type === "user") {
      const updated = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          name: body.name,
          avatar: body.avatar, // Base64
        }
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: "Erro ao salvar configurações" }, { status: 500 });
  }
}
