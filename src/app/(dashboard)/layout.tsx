import { MobileShell } from "@/components/MobileShell";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  let company = null;
  if (session?.user?.companyId) {
    company = await prisma.company.findUnique({ where: { id: session.user.companyId } });
  }

  return (
    <MobileShell company={company}>
      {children}
    </MobileShell>
  );
}
