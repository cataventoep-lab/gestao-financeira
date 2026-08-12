import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.companyId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const data = await req.json();
    
    if (!data.categories && !data.transactions) {
      return NextResponse.json({ error: "Formato de arquivo inválido." }, { status: 400 });
    }

    let catMap: Record<string, string> = {}; 

    if (data.categories && data.categories.length > 0) {
      for (const cat of data.categories) {
        const existing = await prisma.category.findFirst({
          where: { companyId: session.user.companyId, name: cat.name, type: cat.type }
        });
        
        if (existing) {
          catMap[cat.id] = existing.id;
        } else {
          const newCat = await prisma.category.create({
            data: {
              name: cat.name,
              type: cat.type,
              icon: cat.icon || "🏷️",
              color: cat.color || "#1E7A62",
              companyId: session.user.companyId,
            }
          });
          catMap[cat.id] = newCat.id;
        }
      }
    }

    let txCount = 0;
    if (data.transactions && data.transactions.length > 0) {
      for (const tx of data.transactions) {
        await prisma.transaction.create({
          data: {
            type: tx.type,
            description: tx.description,
            amount: tx.amount,
            date: new Date(tx.date),
            dueDate: tx.dueDate ? new Date(tx.dueDate) : null,
            area: tx.area || "fisico",
            categoryId: tx.categoryId ? catMap[tx.categoryId] || null : null,
            paymentMethod: tx.paymentMethod || "Outro",
            status: tx.status || "paga",
            obs: tx.obs || "",
            companyId: session.user.companyId,
          }
        });
        txCount++;
      }
    }

    return NextResponse.json({ success: true, importedTransactions: txCount });
  } catch (e) {
    return NextResponse.json({ error: "Erro ao importar dados" }, { status: 500 });
  }
}
